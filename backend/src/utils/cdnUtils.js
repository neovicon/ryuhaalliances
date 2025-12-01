import blobServiceClient from "../config/azure.js";

const AZURE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";
const AZURE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_CDN_ENDPOINT = process.env.AZURE_CDN_ENDPOINT; // e.g., https://yourcdn.azureedge.net

/**
 * Get the optimized URL for a file (CDN if available, otherwise direct Azure)
 * @param {string} filename - The blob name/path
 * @returns {string} - The optimized URL
 */
export function getOptimizedUrl(filename) {
    if (!filename) return null;

    // If it's already a full URL, return it
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
    }

    // Clean the filename
    const cleanName = filename.replace(/^uploads\//, '').replace(/^\//, '');

    // Use CDN if configured, otherwise use direct Azure URL
    if (AZURE_CDN_ENDPOINT) {
        return `${AZURE_CDN_ENDPOINT}/${AZURE_CONTAINER}/${cleanName}`;
    }

    // Fallback to direct Azure Blob Storage URL
    const accountName = AZURE_ACCOUNT_NAME || 'ryuhaalliance';
    return `https://${accountName}.blob.core.windows.net/${AZURE_CONTAINER}/${cleanName}`;
}

/**
 * Check if a blob exists in Azure Storage
 * @param {string} filename - The blob name/path
 * @returns {Promise<boolean>}
 */
export async function checkBlobExists(filename) {
    try {
        const cleanName = filename.replace(/^uploads\//, '').replace(/^\//, '');
        const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER);
        const blockBlobClient = containerClient.getBlockBlobClient(cleanName);
        return await blockBlobClient.exists();
    } catch (error) {
        console.error('Error checking blob existence:', error);
        return false;
    }
}
