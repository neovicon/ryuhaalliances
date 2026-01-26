import { isSupabaseUrl, isAzureUrl } from './src/utils/urlHelper.js';

console.log('Testing URL Helper...');

const supabaseUrl = 'https://qcdzgfzozygzxhhhklsw.supabase.co/storage/v1/object/public/images/test.jpg';
const azureUrl = 'https://myaccount.blob.core.windows.net/uploads/test.jpg';
const otherUrl = 'https://example.com/image.jpg';

console.log(`isSupabaseUrl(${supabaseUrl}) = ${isSupabaseUrl(supabaseUrl)} (Expected: true)`);
console.log(`isAzureUrl(${azureUrl}) = ${isAzureUrl(azureUrl)} (Expected: true)`);
console.log(`isSupabaseUrl(${azureUrl}) = ${isSupabaseUrl(azureUrl)} (Expected: false)`);
console.log(`isAzureUrl(${supabaseUrl}) = ${isAzureUrl(supabaseUrl)} (Expected: false)`);
console.log(`isSupabaseUrl(${otherUrl}) = ${isSupabaseUrl(otherUrl)} (Expected: false)`);

if (isSupabaseUrl(supabaseUrl) && isAzureUrl(azureUrl) && !isSupabaseUrl(azureUrl)) {
    console.log('✅ URL Helper tests passed');
} else {
    console.error('❌ URL Helper tests failed');
    process.exit(1);
}
