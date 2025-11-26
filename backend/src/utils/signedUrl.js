import blobServiceClient from "../config/azure.js";
import { generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

/**
 * Generate a signed URL for a file in Azure Storage
 * @param {string} fileKey - The file key (blob name)
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string|null>} - Signed URL or null if error
 */
export async function getSignedUrl(fileKey, expiresIn = 3600) {
  if (!fileKey) return null;

  // If it's already a full URL (legacy or external), return as-is
  if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
    return fileKey;
  }

  try {
    // Azure keys usually don't start with slash, but check just in case
    const key = fileKey.startsWith('/') ? fileKey.slice(1) : fileKey;

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    // Generate SAS token
    const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName: key,
      permissions: BlobSASPermissions.parse("r"), // Read permission
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + expiresIn * 1000),
    }, blobServiceClient.credential).toString();

    const url = `${blockBlobClient.url}?${sasToken}`;
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    // Fallback to local URL if file might be local
    if (fileKey.startsWith('/uploads/') || fileKey.includes('uploads/')) {
      // Check if it looks like a local path
      const baseUrl = process.env.BACKEND_URL ||
        process.env.API_URL?.replace('/api', '') ||
        'http://localhost:5000';
      // Ensure leading slash
      const path = fileKey.startsWith('/') ? fileKey : `/${fileKey}`;
      return `${baseUrl}${path}`;
    }
    return null;
  }
}


