import blobServiceClient from "../config/azure.js";
import { getUploadPath } from "./storageHelper.js";

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

/**
 * Upload file to Azure Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Filename
 * @param {string} mimetype - MIME type
 * @returns {Promise<string>} - File key to store in database
 */
export async function uploadToAzure(fileBuffer, filename, mimetype) {
    try {
        const blobName = getUploadPath(filename);

        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Ensure container exists
        await containerClient.createIfNotExists({
            access: 'blob'
        });

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(fileBuffer, {
            blobHTTPHeaders: {
                blobContentType: mimetype
            }
        });

        // Return the key to store in database
        // For consistency, we might want to return the full URL or just the path.
        // The previous implementation returned blobName (which is the path).
        return blobName;
    } catch (error) {
        console.error('Error uploading to Azure:', error);
        // Fallback to local storage if upload fails
        const fs = await import('fs');
        const { writeFile, mkdir } = fs.promises;
        // Ensure uploads directory exists
        try {
            await mkdir('src/uploads', { recursive: true });
        } catch (mkdirError) {
            // Directory might already exist, ignore error
        }
        const localPath = `src/uploads/${filename}`;
        await writeFile(localPath, fileBuffer);
        return `/uploads/${filename}`;
    }
}
