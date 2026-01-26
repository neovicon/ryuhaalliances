import React, { useState } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const { playTrack } = useMusicPlayer();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setShowResults(true);

        try {
            const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

            if (!API_KEY) {
                throw new Error('YouTube API key not configured. Please add VITE_YOUTUBE_API_KEY to your .env file.');
            }

            // Use YouTube Data API v3 for search
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' music')}&type=video&maxResults=20&key=${API_KEY}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Map YouTube API results to our format
            const videoResults = data.items.map(item => ({
                url: `/watch?v=${item.id.videoId}`,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.medium.url,
                uploaderName: item.snippet.channelTitle,
                duration: null, // YouTube search API doesn't include duration
                views: null, // YouTube search API doesn't include views
                type: 'stream'
            }));

            setResults(videoResults);
        } catch (error) {
            console.error('Search error:', error);
            alert(`Search failed: ${error.message}`);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleResultClick = (videoId) => {
        playTrack(videoId);
        setShowResults(false);
        setQuery('');
        setResults([]);
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            {/* Search Form */}
            <form onSubmit={handleSearch} style={{ width: '100%' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#2a2a2a',
                        borderRadius: '24px',
                        padding: '8px 16px',
                        border: '2px solid #444',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1db954';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#444';
                    }}
                >
                    <span style={{ color: '#aaa', fontSize: '18px', marginRight: '12px' }}>🔍</span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for music..."
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isSearching || !query.trim()}
                        style={{
                            backgroundColor: '#1db954',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '6px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: isSearching || !query.trim() ? 'not-allowed' : 'pointer',
                            opacity: isSearching || !query.trim() ? 0.5 : 1,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {/* Results Dropdown */}
            {showResults && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        backgroundColor: '#1a1a1a',
                        borderRadius: '12px',
                        border: '1px solid #333',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        zIndex: 1000,
                    }}
                >
                    {isSearching ? (
                        <div
                            style={{
                                padding: '24px',
                                textAlign: 'center',
                                color: '#aaa',
                                fontSize: '14px',
                            }}
                        >
                            Searching...
                        </div>
                    ) : results.length === 0 ? (
                        <div
                            style={{
                                padding: '24px',
                                textAlign: 'center',
                                color: '#aaa',
                                fontSize: '14px',
                            }}
                        >
                            No results found
                        </div>
                    ) : (
                        results.map((item, index) => (
                            <div
                                key={item.url || index}
                                onClick={() => {
                                    const videoId = item.url?.replace('/watch?v=', '') || '';
                                    if (videoId) handleResultClick(videoId);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    borderBottom: index < results.length - 1 ? '1px solid #2a2a2a' : 'none',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                {/* Thumbnail */}
                                <div
                                    style={{
                                        width: '80px',
                                        height: '45px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        backgroundColor: '#333',
                                        position: 'relative',
                                    }}
                                >
                                    {item.thumbnail && (
                                        <img
                                            src={item.thumbnail}
                                            alt={item.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    )}
                                    {item.duration && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: '4px',
                                                right: '4px',
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                color: '#fff',
                                                fontSize: '10px',
                                                padding: '2px 4px',
                                                borderRadius: '2px',
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            {formatDuration(item.duration)}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                    }}
                                >
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {item.title}
                                    </div>
                                    <div
                                        style={{
                                            color: '#aaa',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {item.uploaderName || 'Unknown Channel'}
                                    </div>
                                    {item.views && (
                                        <div
                                            style={{
                                                color: '#888',
                                                fontSize: '11px',
                                            }}
                                        >
                                            {item.views.toLocaleString()} views
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Close results when clicking outside */}
            {showResults && (
                <div
                    onClick={() => setShowResults(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999,
                    }}
                />
            )}
        </div>
    );
};

export default SearchBar;
