import blobServiceClient from "./src/config/azure.js";
import { generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

async function test() {
    console.log("Testing Azure Storage Connection...");
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        console.log(`Container: ${containerName}`);

        // Ensure container exists
        await containerClient.createIfNotExists({ access: 'blob' });
        console.log("Container exists or created.");

        // Upload a test file
        const blobName = `test-${Date.now()}.txt`;
        const content = "Hello Azure!";
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        console.log(`Uploading ${blobName}...`);
        await blockBlobClient.uploadData(Buffer.from(content), {
            blobHTTPHeaders: { blobContentType: "text/plain" }
        });
        console.log("Upload successful.");

        // Generate SAS URL
        const sasToken = generateBlobSASQueryParameters({
            containerName,
            blobName,
            permissions: BlobSASPermissions.parse("r"),
            startsOn: new Date(),
            expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
        }, blobServiceClient.credential).toString();

        const url = `${blockBlobClient.url}?${sasToken}`;
        console.log(`Signed URL: ${url}`);

        // Delete the file
        console.log("Deleting test file...");
        await blockBlobClient.delete();
        console.log("Delete successful.");

    } catch (err) {
        console.error("Error:", err);
    }
}

test();
