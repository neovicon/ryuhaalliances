# 🎵 Piped.video Music Player

A fully functional, persistent music player built with React and the Piped.video API. Features inline CSS styling and works seamlessly across page navigation.

## ✨ Features

- **🎵 Persistent Playback**: Music continues playing as you navigate between pages
- **💾 Auto-Resume**: Automatically resumes from where you left off after page reload
- **🚫 No Ads**: Powered by Piped.video API - works with AdBlock enabled
- **📱 Responsive Design**: Works perfectly on mobile and desktop
- **🎨 Inline CSS Only**: No external CSS files or Tailwind dependencies

## 📁 File Structure

```
src/
├── context/
│   └── MusicPlayerContext.jsx    # Global state management
├── components/
│   ├── MusicPlayer.jsx            # Bottom fixed player bar
│   └── SearchBar.jsx              # Search component
└── pages/
    └── Music.jsx                  # Dedicated music page
```

## 🔧 Components

### 1. MusicPlayerContext.jsx

**Location**: `src/context/MusicPlayerContext.jsx`

**Purpose**: Global state management for the music player

**Key Features**:
- Global audio element via `useRef(new Audio())`
- Piped.video API integration for streaming
- localStorage persistence for last played track and position
- Auto-resume on app reload (paused state)

**API Endpoints Used**:
- Search: `GET https://piped.video/api/search?q=QUERY`
- Streams: `GET https://piped.video/api/streams/{VIDEO_ID}`

**State Management**:
```javascript
{
  audioRef,          // Reference to Audio element
  currentTrack,      // { title, channel, thumbnail, videoId }
  isPlaying,         // Boolean
  duration,          // Number (seconds)
  currentTime,       // Number (seconds)
  volume,            // Number (0-1)
  isLoading          // Boolean
}
```

**Functions**:
- `playTrack(videoId)` - Fetches stream and plays track
- `togglePlay()` - Play/pause control
- `seekTo(time)` - Seek to specific time
- `setVolume(vol)` - Adjust volume (0-1)

### 2. MusicPlayer.jsx

**Location**: `src/components/MusicPlayer.jsx`

**Purpose**: Persistent bottom player bar (like Spotify)

**Features**:
- Fixed bottom positioning
- Thumbnail display
- Track title and channel name
- Play/Pause button
- Seek bar with drag support
- Current time and duration display
- Volume slider

**Styling**: All inline CSS with dark theme (#1a1a1a background, #1db954 accent)

### 3. SearchBar.jsx

**Location**: `src/components/SearchBar.jsx`

**Purpose**: Music search interface

**Features**:
- Search input with submit button
- Results dropdown with thumbnails
- Click-to-play functionality
- Duration display on thumbnails
- View count display
- Auto-close on outside click

**API**: Uses Piped.video search API with music filter

### 4. Music.jsx

**Location**: `src/pages/Music.jsx`

**Purpose**: Dedicated music search page

**Features**:
- Hero section with gradient title
- Integrated SearchBar component
- Feature showcase cards
- Usage instructions
- Fully responsive layout

## 🚀 Usage

### Accessing the Music Player

1. **Navigate to Music Page**: Go to `/music` route
2. **Search for Music**: Type song name, artist, or album
3. **Play Track**: Click on any search result
4. **Control Playback**: Use the bottom player bar

### Player Controls

- **Play/Pause**: Click the green button
- **Seek**: Click or drag on the progress bar
- **Volume**: Use the volume slider on the right
- **Navigate**: Go to any page - music keeps playing!

## 💾 Persistence

The player uses localStorage to save:
- `lastVideoId`: ID of the last played track
- `lastTime`: Playback position in seconds

**On Reload**:
1. Loads last video metadata
2. Fetches stream URL
3. Sets audio source
4. Seeks to saved position
5. Stays paused (no autoplay)

## 🎨 Design System

All components use inline CSS with consistent styling:

**Colors**:
- Background: `#0a0a0a`, `#1a1a1a`, `#2a2a2a`
- Text: `#fff` (primary), `#aaa` (secondary), `#888` (muted)
- Accent: `#1db954` (Spotify green)
- Borders: `#333`, `#444`

**Typography**:
- Headings: Bold, white
- Body: Regular, gray tones
- Monospace: Time displays

## 🔌 API Integration

### Piped.video API

**Why Piped?**
- No YouTube API key required
- Works with AdBlock
- No tracking or ads
- Direct audio stream URLs

**Search Request**:
```javascript
GET https://piped.video/api/search?q=QUERY&filter=music_songs
```

**Stream Request**:
```javascript
GET https://piped.video/api/streams/{VIDEO_ID}
```

**Response Processing**:
- Extracts audio streams
- Selects highest bitrate
- Sets as audio source

## 📱 Mobile Support

All components are fully responsive:
- Touch-friendly controls
- Responsive grid layouts
- Optimized for small screens
- Smooth scrolling

## ⚠️ Important Notes

1. **No YouTube API**: This player does NOT use YouTube's iframe API
2. **No External CSS**: All styling is inline
3. **Global Audio**: Single audio element shared across app
4. **No Autoplay on Reload**: Respects user preference
5. **AdBlock Compatible**: Works with all ad blockers

## 🧪 Testing

To test the music player:

1. **Start Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to Music Page**:
   - Open browser to `http://localhost:5174/music`

3. **Test Search**:
   - Type "lofi hip hop" or any music query
   - Press Enter or click Search
   - Verify results appear with thumbnails

4. **Test Playback**:
   - Click on a search result
   - Verify player appears at bottom
   - Check play/pause functionality
   - Test seek bar
   - Test volume control

5. **Test Persistence**:
   - Play a track
   - Navigate to another page (e.g., `/feed`)
   - Verify music continues playing
   - Reload the page
   - Verify track loads at last position (paused)

6. **Test Mobile**:
   - Open dev tools
   - Toggle device emulation
   - Test all controls on mobile viewport

## 🐛 Troubleshooting

**Music won't play**:
- Check browser console for errors
- Verify Piped.video API is accessible
- Try a different search query

**Player doesn't appear**:
- Ensure MusicPlayerProvider wraps App
- Check that MusicPlayer is rendered in App.jsx

**Persistence not working**:
- Check localStorage in browser dev tools
- Verify `lastVideoId` and `lastTime` are saved

**Search returns no results**:
- Verify internet connection
- Try a more specific query
- Check Piped.video API status

## 📝 Code Quality

- ✅ No external dependencies (except React)
- ✅ All inline CSS (no Tailwind)
- ✅ Clean component structure
- ✅ Proper error handling
- ✅ localStorage management
- ✅ Responsive design
- ✅ Accessible controls

## 🎯 Future Enhancements

Potential improvements:
- Playlist support
- Shuffle and repeat modes
- Keyboard shortcuts
- Lyrics display
- Queue management
- History tracking
- Favorites/bookmarks

## 📄 License

Part of the Ryuha Alliance project.

---

**Built with ❤️ using React and Piped.video API**
