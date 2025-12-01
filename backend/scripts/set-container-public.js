import blobServiceClient from '../src/config/azure.js';

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads';

async function setContainerPublicAccess() {
    try {
        console.log(`Setting public access for container: ${containerName}`);

        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Check if container exists
        const exists = await containerClient.exists();

        if (!exists) {
            console.log('Container does not exist. Creating with public access...');
            await containerClient.create({
                access: 'container' // Public read access for container and blobs
            });
            console.log('✅ Container created with public access');
        } else {
            console.log('Container exists. Updating access level...');
            await containerClient.setAccessPolicy('container');
            console.log('✅ Container access level updated to public');
        }

        // Verify the access level
        const properties = await containerClient.getProperties();
        console.log('\nContainer properties:');
        console.log(`- Public access: ${properties.blobPublicAccess || 'none'}`);
        console.log(`- Last modified: ${properties.lastModified}`);

        console.log('\n✅ Setup complete!');
        console.log('\nYour blobs can now be accessed publicly at:');
        console.log(`https://${process.env.AZURE_STORAGE_ACCOUNT_NAME || 'your-account'}.blob.core.windows.net/${containerName}/[blob-name]`);

    } catch (error) {
        console.error('❌ Error setting container access:', error.message);
        process.exit(1);
    }
}

setContainerPublicAccess();
