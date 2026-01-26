/**
 * Check if a URL is from Supabase
 * @param {string} url 
 * @returns {boolean}
 */
export function isSupabaseUrl(url) {
    if (!url) return false;
    return url.includes('supabase.co');
}

/**
 * Check if a URL is from Azure Blob Storage
 * @param {string} url 
 * @returns {boolean}
 */
export function isAzureUrl(url) {
    if (!url) return false;
    return url.includes('blob.core.windows.net');
}
