# Azure CDN Setup Guide

This guide will help you set up Azure CDN to dramatically improve image and video loading speeds globally.

## Why Use Azure CDN?

- **Faster Loading**: Content is served from edge locations closest to your users
- **Reduced Costs**: Less bandwidth usage on your storage account
- **Better Performance**: Cached content loads instantly
- **Global Reach**: 100+ edge locations worldwide

## Setup Steps

### 1. Create Azure CDN Profile

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "CDN" and select "Front Door and CDN profiles"
3. Click "+ Create"
4. Fill in the details:
   - **Resource group**: Same as your storage account
   - **Name**: `ryuha-cdn` (or your preferred name)
   - **Pricing tier**: Choose based on your needs:
     - **Standard Microsoft**: Good for most use cases, affordable
     - **Standard Akamai**: Better for high traffic
     - **Premium Verizon**: Advanced features, more expensive

### 2. Create CDN Endpoint

1. After the profile is created, click on it
2. Click "+ Endpoint"
3. Fill in the details:
   - **Name**: `ryuhaalliance` (this will be part of your CDN URL)
   - **Origin type**: Select "Storage"
   - **Origin hostname**: Select your storage account (`ryuhaalliance.blob.core.windows.net`)
   - **Origin path**: Leave empty or set to `/uploads` if you want to serve only from that container
   - **Origin host header**: Same as origin hostname
   - **Protocol**: HTTPS only (recommended)
   - **Origin port**: 443

4. Click "Add"

### 3. Configure Caching Rules (Optional but Recommended)

1. In your CDN endpoint, go to "Caching rules"
2. Set up rules:
   - **Query string caching**: "Ignore query strings" (for static content)
   - **Global caching rule**:
     - Caching behavior: "Override"
     - Cache expiration duration: 7 days (for images/videos)

### 4. Enable Compression (Recommended)

1. In your CDN endpoint, go to "Compression"
2. Enable compression
3. Add MIME types:
   - `image/jpeg`
   - `image/png`
   - `image/webp`
   - `video/mp4`
   - `application/json`

### 5. Get Your CDN Endpoint URL

Your CDN endpoint URL will be:
```
https://ryuhaalliance.azureedge.net
```

(Replace `ryuhaalliance` with your endpoint name)

### 6. Update Backend Configuration

Add this to your `.env` file:

```env
AZURE_CDN_ENDPOINT=https://ryuhaalliance.azureedge.net
```

### 7. Test Your CDN

1. Upload a test image through your app
2. Check the network tab in browser dev tools
3. The image URL should now be served from `*.azureedge.net`
4. Subsequent loads should be much faster (cached)

## Custom Domain (Optional)

To use your own domain (e.g., `cdn.ryuhaalliance.com`):

1. In your CDN endpoint, click "+ Custom domain"
2. Add your domain name
3. Create a CNAME record in your DNS:
   ```
   cdn.ryuhaalliance.com -> ryuhaalliance.azureedge.net
   ```
4. Enable HTTPS (Azure provides free SSL certificates)

## Purging Cache

If you need to update content immediately:

1. Go to your CDN endpoint
2. Click "Purge"
3. Enter the paths to purge (e.g., `/uploads/image.jpg`)
4. Click "Purge"

## Cost Optimization

- **Standard Microsoft CDN**: ~$0.081/GB for first 10TB
- **Caching**: Reduces origin requests, saving storage costs
- **Compression**: Reduces bandwidth usage

## Monitoring

1. Go to your CDN endpoint
2. Click "Metrics" to see:
   - Bandwidth usage
   - Hit ratio (higher is better)
   - Request count
   - Cache efficiency

## Troubleshooting

### Images not loading from CDN
- Check that your storage container has public access enabled
- Verify the CDN endpoint is running
- Check CORS settings on your storage account

### Slow first load
- This is normal - CDN caches on first request
- Subsequent loads will be fast
- You can "pre-warm" the cache by accessing files

### 404 errors
- Ensure the file exists in your storage account
- Check the path is correct
- Verify container access level is set to "Blob" or "Container"

## Alternative: Azure Front Door

For even better performance and features:
- Global load balancing
- Web Application Firewall (WAF)
- Advanced routing
- Better for high-traffic applications

Cost: Higher than standard CDN but includes more features.
