import blobServiceClient from "../config/azure.js";
import { getUploadPath } from "../utils/storageHelper.js";
import { generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filename = req.file.originalname;
        const blobName = getUploadPath(filename);

        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Ensure container exists with public access
        await containerClient.createIfNotExists({
            access: 'container' // Public read access for container and blobs
        });

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(req.file.buffer, {
            blobHTTPHeaders: {
                blobContentType: req.file.mimetype,
                blobCacheControl: 'public, max-age=31536000' // Cache for 1 year
            }
        });

        // Return the key (blob name) so the client can store it
        res.status(200).json({
            message: "File uploaded successfully",
            key: blobName,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
};

export const getSignedUrlForFile = async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) {
            return res.status(400).json({ message: "Missing file key" });
        }

        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(key);

        // Generate SAS token with longer expiration for better video streaming
        const sasToken = generateBlobSASQueryParameters({
            containerName,
            blobName: key,
            permissions: BlobSASPermissions.parse("r"), // Read permission
            startsOn: new Date(),
            expiresOn: new Date(new Date().valueOf() + 24 * 3600 * 1000), // 24 hours
        }, blobServiceClient.credential).toString();

        const url = `${blockBlobClient.url}?${sasToken}`;

        res.status(200).json({ url });
    } catch (error) {
        console.error("Signed URL error:", error);
        res.status(500).json({ message: "Could not generate signed URL", error: error.message });
    }
};
