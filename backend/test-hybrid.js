import { getImageUrl } from './src/utils/storageUtils.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing Hybrid Storage...');

async function test() {
    // Test 1: Known Azure file (if any, or fake one)
    // We can't easily know a real file without checking DB, but we can test the logic.
    // If we pass a filename that definitely doesn't exist in Azure, it should try Supabase.

    const fakeFile = 'non-existent-file.jpg';
    console.log(`Testing ${fakeFile}...`);
    const url1 = await getImageUrl(fakeFile);
    console.log(`Result for ${fakeFile}: ${url1}`);

    // Test 2: HTTP URL
    const httpUrl = 'https://example.com/image.jpg';
    const url2 = await getImageUrl(httpUrl);
    console.log(`Result for ${httpUrl}: ${url2}`);

    // Test 3: If we have a real file in Supabase, we could test it.
    // Based on previous logs, we had some files that were missing in Azure.
    // e.g. 1763305697271-4DGCdZ1F.jpg
    const missingFile = '1763305697271-4DGCdZ1F.jpg';
    console.log(`Testing potential Supabase file ${missingFile}...`);
    const url3 = await getImageUrl(missingFile);
    console.log(`Result for ${missingFile}: ${url3}`);

    if (url1 && url2 && url3) {
        console.log('✅ Hybrid Storage tests finished (check logs for correctness)');
    } else {
        console.error('❌ Hybrid Storage tests failed to return URLs');
    }
}

test();
