# YouTube API Setup Instructions

## Quick Setup

1. **Add your YouTube API key to `.env` file:**

```bash
# In /home/daniel/RYUHA ALLIANCE/frontend/.env
VITE_YOUTUBE_API_KEY=YOUR_API_KEY_HERE
```

2. **Restart the dev server:**

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

3. **Test the music player:**
   - Go to http://localhost:5174/music
   - Search for any music
   - Click a result to play

## How It Works

The music player now uses a hybrid approach:

- **YouTube Data API v3** → Search & metadata (title, channel, thumbnail)
- **Invidious API** → Audio stream URLs (fallback across multiple instances)

### Why This Approach?

- ✅ **Reliable search** - YouTube API is always available
- ✅ **No API quota for streams** - Invidious provides direct audio URLs
- ✅ **Better metadata** - Official YouTube data for titles, channels, thumbnails
- ✅ **Fallback system** - Multiple Invidious instances for stream reliability

## API Usage

### Search (YouTube Data API)
```
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &q=QUERY
  &type=video
  &maxResults=20
  &key=YOUR_API_KEY
```

### Streams (Invidious API - No Key Required)
```
GET https://inv.nadeko.net/api/v1/videos/{VIDEO_ID}
```

Fallback instances:
- inv.nadeko.net
- inv.tux.pizza
- invidious.io.lol
- invidious.privacyredirect.com

## Troubleshooting

### "YouTube API key not configured" Error
- Make sure you added `VITE_YOUTUBE_API_KEY` to `.env`
- Restart the dev server after adding the key
- Check that the `.env` file is in the `frontend` directory

### Search works but playback fails
- This means Invidious instances are down
- Wait a few minutes and try again
- The system tries 4 different instances automatically

### API Quota Exceeded
- YouTube Data API has a daily quota
- Each search costs 100 units
- Default quota is 10,000 units/day (100 searches)
- If exceeded, wait until next day or request quota increase

## Environment Variables

```bash
# Required
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here

# Optional (if you have other API keys)
VITE_API_URL=your_backend_url
```

## Getting a YouTube API Key

If you don't have one yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Go to Credentials → Create Credentials → API Key
5. Copy the API key
6. (Optional) Restrict the key to YouTube Data API v3 only

## Security Notes

- ✅ `.env` is already in `.gitignore` - your key won't be committed
- ✅ `VITE_` prefix makes it available in the frontend
- ⚠️ The API key will be visible in browser network requests
- ⚠️ For production, consider using a backend proxy to hide the key

## Testing

After setup, test these scenarios:

1. **Search** - Type "lofi" and press Enter
2. **Play** - Click a search result
3. **Controls** - Test play/pause, seek, volume
4. **Navigation** - Go to another page, music should continue
5. **Reload** - Refresh page, should resume from last position (paused)

---

**Ready to go!** Just add your API key to `.env` and restart the server.
