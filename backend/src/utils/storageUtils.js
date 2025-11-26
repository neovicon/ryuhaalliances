import { supabase } from "../config/supabase.js";
import blobServiceClient from "../config/azure.js";

const AZURE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";
const AZURE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;

/**
 * Generate a signed URL for a file in Supabase Storage
 * @param {string} filename 
 * @returns {Promise<string|null>}
 */
export async function getSupabaseSignedUrl(filename) {
    if (!supabase) return null;

    // Try common buckets
    const buckets = ['uploads', 'images', 'public'];

    // Clean filename
    const cleanName = filename.replace(/^uploads\//, '').replace(/^\//, '');

    for (const bucket of buckets) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(cleanName, 60 * 60 * 24 * 7); // 7 days

        if (!error && data) {
            return data.signedUrl;
        }
    }

    return null;
}

/**
 * Get the public URL for a file in Azure Blob Storage
 * @param {string} filename 
 * @returns {string}
 */
export function getAzureUrl(filename) {
    // If we don't have account name, we can try to extract it from connection string or just fail gracefully
    // But usually it's in the env or we can construct it.
    // The user provided example: https://ryuhaalliance.blob.core.windows.net/uploads/${filename}

    // If filename already has full URL, return it
    if (filename.startsWith('http')) return filename;

    const cleanName = filename.replace(/^uploads\//, '').replace(/^\//, '');

    // Use configured account name or fallback to hardcoded from user request if missing (risky but requested)
    const accountName = AZURE_ACCOUNT_NAME || 'ryuhaalliance';

    return `https://${accountName}.blob.core.windows.net/${AZURE_CONTAINER}/${cleanName}`;
}

/**
 * Check if file exists in Azure
 * @param {string} filename 
 * @returns {Promise<boolean>}
 */
async function checkAzureExists(filename) {
    try {
        const cleanName = filename.replace(/^uploads\//, '').replace(/^\//, '');
        const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER);
        const blockBlobClient = containerClient.getBlockBlobClient(cleanName);
        return await blockBlobClient.exists();
    } catch (error) {
        console.error('Error checking Azure existence:', error);
        return false;
    }
}

/**
 * Get the appropriate URL for an image (Azure or Supabase)
 * @param {string} filename 
 * @returns {Promise<string|null>}
 */
export async function getImageUrl(filename) {
    if (!filename) return null;

    // If it's already a URL, return it
    if (filename.startsWith('http')) return filename;

    // Check if it exists in Azure
    const existsInAzure = await checkAzureExists(filename);

    if (existsInAzure) {
        return getAzureUrl(filename);
    }

    // If not in Azure, try Supabase
    const supabaseUrl = await getSupabaseSignedUrl(filename);
    if (supabaseUrl) {
        return supabaseUrl;
    }

    // If not found in either, return Azure URL as fallback (might 404 but better than null)
    return getAzureUrl(filename);
}
