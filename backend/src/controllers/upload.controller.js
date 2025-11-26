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

        // Ensure container exists
        await containerClient.createIfNotExists({
            access: 'blob' // Allow public read access to blobs if desired, or 'container' or undefined (private)
        });

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(req.file.buffer, {
            blobHTTPHeaders: {
                blobContentType: req.file.mimetype
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

        // Generate SAS token
        const sasToken = generateBlobSASQueryParameters({
            containerName,
            blobName: key,
            permissions: BlobSASPermissions.parse("r"), // Read permission
            startsOn: new Date(),
            expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour
        }, blobServiceClient.credential).toString();

        const url = `${blockBlobClient.url}?${sasToken}`;

        res.status(200).json({ url });
    } catch (error) {
        console.error("Signed URL error:", error);
        res.status(500).json({ message: "Could not generate signed URL", error: error.message });
    }
};
