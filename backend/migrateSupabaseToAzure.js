import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { supabase } from './src/config/supabase.js';
import { uploadToAzure } from './src/utils/azureUploader.js';
import { isSupabaseUrl } from './src/utils/urlHelper.js';
import blobServiceClient from './src/config/azure.js';
import User from './src/models/User.js';
import Blog from './src/models/Blog.js';
import Event from './src/models/Event.js';
import Announcement from './src/models/Announcement.js';
import Article from './src/models/Article.js';
import Story from './src/models/Story.js';
import path from 'path';
import { nanoid } from 'nanoid';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const AZURE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing in .env');
    process.exit(1);
}

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

async function checkAzureExists(filename) {
    try {
        // Remove leading slash if present
        const blobName = filename.startsWith('/') ? filename.slice(1) : filename;
        // Also remove 'uploads/' prefix if present in filename but we are checking in 'uploads' container
        // Wait, getUploadPath returns 'timestamp-filename'.
        // But stored paths might be 'uploads/timestamp-filename' or 'timestamp-filename'.
        // The container is 'uploads'.
        // If stored path is 'uploads/foo.jpg', and container is 'uploads', then blob name is 'foo.jpg'?
        // Or is the blob name 'uploads/foo.jpg' inside 'uploads' container?
        // Based on upload.js: blobName = getUploadPath(filename). containerClient.getBlockBlobClient(blobName).
        // So blobName is just 'timestamp-filename'.
        // But if DB has 'uploads/timestamp-filename', then we need to be careful.

        // Let's assume the stored value is the blob name, or has 'uploads/' prefix which we might need to strip if it's part of the path but not the blob name.
        // Actually, let's just try to get properties.

        const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER);

        // Try as is
        let blockBlobClient = containerClient.getBlockBlobClient(blobName);
        if (await blockBlobClient.exists()) return true;

        // Try stripping 'uploads/' if present
        if (blobName.startsWith('uploads/')) {
            const stripped = blobName.replace('uploads/', '');
            blockBlobClient = containerClient.getBlockBlobClient(stripped);
            if (await blockBlobClient.exists()) return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking Azure existence:', error);
        return false;
    }
}

async function downloadFromSupabase(filenameOrUrl) {
    // If it's a full URL, use it
    if (isSupabaseUrl(filenameOrUrl)) {
        try {
            const response = await fetch(filenameOrUrl);
            if (response.ok) return Buffer.from(await response.arrayBuffer());
        } catch (e) {
            console.error(`Failed to fetch from full URL: ${e.message}`);
        }
    }

    // If it's a filename, try to construct Supabase URL
    // Try common buckets: 'uploads', 'images', 'public'

    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    // Get buckets dynamically
    let buckets = ['uploads', 'images', 'public']; // Default buckets
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (!error && data) {
            buckets = data.map(b => b.name);
            // console.log('Found Supabase buckets:', buckets);
        } else {
            console.error('Error listing buckets:', error);
        }
    } catch (e) {
        console.error('Failed to list buckets:', e);
    }

    // Clean filename: remove 'uploads/' prefix if present
    const cleanName = filenameOrUrl.replace(/^uploads\//, '').replace(/^\//, '');

    for (const bucket of buckets) {
        // The public endpoint is /storage/v1/object/public/...
        // The authenticated endpoint is /storage/v1/object/...
        // Let's try authenticated endpoint with key.

        // Try authenticated path first
        const authUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${cleanName}`;
        try {
            const response = await fetch(authUrl, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            if (response.ok) {
                console.log(`Found image in Supabase bucket '${bucket}': ${authUrl}`);
                return Buffer.from(await response.arrayBuffer());
            }
        } catch (error) {
            // Ignore
        }

        // Fallback to public URL (just in case)
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanName}`;
        try {
            const response = await fetch(publicUrl);
            if (response.ok) {
                console.log(`Found image in Supabase bucket '${bucket}' (public): ${publicUrl}`);
                return Buffer.from(await response.arrayBuffer());
            }
        } catch (error) {
            // Ignore
        }
    }

    return null;
}

async function processField(doc, fieldName, modelName) {
    const val = doc[fieldName];
    if (!val) return;

    // Check if it's already Azure (by existence)
    const existsInAzure = await checkAzureExists(val);

    if (!existsInAzure) {
        console.log(`File ${val} (in ${modelName} ${doc._id}) NOT found in Azure. Checking Supabase...`);

        const buffer = await downloadFromSupabase(val);
        if (buffer) {
            console.log(`Downloading from Supabase...`);

            // Determine extension
            const ext = path.extname(val) || '.jpg';
            const cleanExt = ext.split('?')[0];
            const filename = `${nanoid(10)}${cleanExt}`;

            const mimetype = cleanExt === '.png' ? 'image/png' :
                cleanExt === '.webp' ? 'image/webp' : 'image/jpeg';

            const newKey = await uploadToAzure(buffer, filename, mimetype);

            // Update document
            doc[fieldName] = newKey;
            await doc.save();
            console.log(`Migrated to Azure: ${newKey}`);
        } else {
            console.warn(`Could not find file ${val} in Supabase either.`);
        }
    }
}

async function processArrayField(doc, fieldName, modelName) {
    const urls = doc[fieldName];
    if (Array.isArray(urls) && urls.length > 0) {
        let modified = false;
        const newUrls = [];

        for (const url of urls) {
            const existsInAzure = await checkAzureExists(url);
            if (!existsInAzure) {
                console.log(`Array item ${url} (in ${modelName} ${doc._id}) NOT found in Azure. Checking Supabase...`);
                const buffer = await downloadFromSupabase(url);
                if (buffer) {
                    const ext = path.extname(url) || '.jpg';
                    const cleanExt = ext.split('?')[0];
                    const filename = `${nanoid(10)}${cleanExt}`;
                    const mimetype = cleanExt === '.png' ? 'image/png' :
                        cleanExt === '.webp' ? 'image/webp' : 'image/jpeg';

                    const newKey = await uploadToAzure(buffer, filename, mimetype);
                    newUrls.push(newKey);
                    modified = true;
                    console.log(`Migrated array item to Azure: ${newKey}`);
                } else {
                    console.warn(`Could not find array item ${url} in Supabase either.`);
                    newUrls.push(url);
                }
            } else {
                newUrls.push(url);
            }
        }

        if (modified) {
            doc[fieldName] = newUrls;
            await doc.save();
            console.log(`Updated ${modelName} ${doc._id} array field ${fieldName}`);
        }
    }
}

async function migrateCollection(Model, modelName, fields, arrayFields = []) {
    console.log(`Starting migration for ${modelName}...`);
    const docs = await Model.find({});
    console.log(`Found ${docs.length} documents in ${modelName}`);

    for (const doc of docs) {
        for (const field of fields) {
            await processField(doc, field, modelName);
        }
        for (const field of arrayFields) {
            await processArrayField(doc, field, modelName);
        }
    }
    console.log(`Finished migration for ${modelName}`);
}

async function runMigration() {
    await connectDB();

    // Migrate User
    await migrateCollection(User, 'User', ['photoUrl', 'heroCardUrl', 'warningNotice'], ['certificates']);

    // Migrate Blog
    await migrateCollection(Blog, 'Blog', ['imageUrl']);

    // Migrate Event
    await migrateCollection(Event, 'Event', ['imageUrl']);

    // Migrate Announcement
    await migrateCollection(Announcement, 'Announcement', ['imageUrl']);

    // Migrate Article
    await migrateCollection(Article, 'Article', ['imageUrl']);

    // Migrate Story
    await migrateCollection(Story, 'Story', ['imageUrl']);

    console.log('Migration completed.');
    process.exit(0);
}

runMigration();
