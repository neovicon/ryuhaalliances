import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: join(__dirname, '../.env') });

async function fixIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        console.log('\nCurrent indexes:');
        const indexes = await usersCollection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        // Drop the old unique indexes on email and username
        console.log('\nDropping old unique indexes...');
        try {
            await usersCollection.dropIndex('email_1');
            console.log('✓ Dropped email_1 index');
        } catch (e) {
            console.log('- email_1 index does not exist or already dropped');
        }

        try {
            await usersCollection.dropIndex('username_1');
            console.log('✓ Dropped username_1 index');
        } catch (e) {
            console.log('- username_1 index does not exist or already dropped');
        }

        console.log('\nNew indexes will be created automatically when the server restarts.');
        console.log('The new compound indexes will be:');
        console.log('  - { email: 1, status: 1 } (unique)');
        console.log('  - { username: 1, status: 1 } (unique)');
        console.log('\nThis allows the same email/username to exist with different statuses.');

        await mongoose.connection.close();
        console.log('\n✓ Done! Please restart your server.');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixIndexes();
