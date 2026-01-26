import React from 'react';
import SearchBar from '../components/SearchBar';
import { useMusicPlayer } from '../context/MusicPlayerContext';

const Music = () => {
    const { history, playTrack } = useMusicPlayer();

    const handleDownload = (videoId, title) => {
        // Open YouTube video in new tab for download (user can use browser extensions)
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#0a0a0a',
                paddingTop: '80px',
                paddingBottom: '100px',
            }}
        >
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: '48px',
                    }}
                >
                    <h1
                        style={{
                            color: '#fff',
                            fontSize: '48px',
                            fontWeight: '700',
                            marginBottom: '16px',
                            backgroundImage: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Music Player
                    </h1>
                    <p
                        style={{
                            color: '#aaa',
                            fontSize: '18px',
                            maxWidth: '600px',
                            margin: '0 auto',
                        }}
                    >
                        Search and play music from YouTube. Your playback continues across all pages.
                    </p>
                </div>

                {/* Search Bar */}
                <div
                    style={{
                        marginBottom: '48px',
                    }}
                >
                    <SearchBar />
                </div>

                {/* Listening History */}
                {history && history.length > 0 && (
                    <div style={{ marginTop: '64px' }}>
                        <h2
                            style={{
                                color: '#fff',
                                fontSize: '32px',
                                fontWeight: '600',
                                marginBottom: '24px',
                            }}
                        >
                            Listening History
                        </h2>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '16px',
                            }}
                        >
                            {history.map((track, index) => (
                                <div
                                    key={track.videoId + index}
                                    style={{
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '1px solid #333',
                                        transition: 'transform 0.2s, border-color 0.2s',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = '#1db954';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#333';
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <div
                                        onClick={() => playTrack(track.videoId)}
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            paddingBottom: '56.25%',
                                            backgroundColor: '#333',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {track.thumbnail && (
                                            <img
                                                src={track.thumbnail}
                                                alt={track.title}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        )}
                                        {/* Play overlay */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: 'rgba(0,0,0,0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0,
                                                transition: 'opacity 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = '0';
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#1db954',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '24px',
                                                    color: '#fff',
                                                }}
                                            >
                                                ▶
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding: '16px' }}>
                                        <h3
                                            style={{
                                                color: '#fff',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                marginBottom: '8px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {track.title}
                                        </h3>
                                        <p
                                            style={{
                                                color: '#aaa',
                                                fontSize: '14px',
                                                marginBottom: '8px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {track.channel}
                                        </p>
                                        <p
                                            style={{
                                                color: '#888',
                                                fontSize: '12px',
                                                marginBottom: '12px',
                                            }}
                                        >
                                            Played {formatDate(track.playedAt)}
                                        </p>

                                        {/* Action Buttons */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                            }}
                                        >
                                            <button
                                                onClick={() => playTrack(track.videoId)}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#1db954',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '20px',
                                                    padding: '8px 16px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#1ed760';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#1db954';
                                                }}
                                            >
                                                ▶ Play
                                            </button>
                                            <button
                                                onClick={() => handleDownload(track.videoId, track.title)}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#333',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '20px',
                                                    padding: '8px 16px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#444';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#333';
                                                }}
                                            >
                                                ⬇ Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Cards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '24px',
                        marginTop: '48px',
                    }}
                >
                    {/* Feature 1 */}
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '1px solid #333',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '32px',
                                marginBottom: '12px',
                            }}
                        >
                            🎵
                        </div>
                        <h3
                            style={{
                                color: '#fff',
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '8px',
                            }}
                        >
                            Persistent Playback
                        </h3>
                        <p
                            style={{
                                color: '#aaa',
                                fontSize: '14px',
                                lineHeight: '1.6',
                            }}
                        >
                            Music continues playing as you navigate between pages. The player stays fixed at the bottom.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '1px solid #333',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '32px',
                                marginBottom: '12px',
                            }}
                        >
                            💾
                        </div>
                        <h3
                            style={{
                                color: '#fff',
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '8px',
                            }}
                        >
                            Auto Resume
                        </h3>
                        <p
                            style={{
                                color: '#aaa',
                                fontSize: '14px',
                                lineHeight: '1.6',
                            }}
                        >
                            Your last played track and position are saved. Reload the page and pick up right where you left off.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '1px solid #333',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '32px',
                                marginBottom: '12px',
                            }}
                        >
                            📜
                        </div>
                        <h3
                            style={{
                                color: '#fff',
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '8px',
                            }}
                        >
                            Listening History
                        </h3>
                        <p
                            style={{
                                color: '#aaa',
                                fontSize: '14px',
                                lineHeight: '1.6',
                            }}
                        >
                            Track your recently played songs. Replay or download any track from your history.
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div
                    style={{
                        marginTop: '48px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '12px',
                        padding: '32px',
                        border: '1px solid #333',
                    }}
                >
                    <h2
                        style={{
                            color: '#fff',
                            fontSize: '24px',
                            fontWeight: '600',
                            marginBottom: '16px',
                        }}
                    >
                        How to Use
                    </h2>
                    <ol
                        style={{
                            color: '#aaa',
                            fontSize: '16px',
                            lineHeight: '1.8',
                            paddingLeft: '24px',
                        }}
                    >
                        <li style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#1db954' }}>Search:</strong> Type a song name, artist, or album in the search bar above
                        </li>
                        <li style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#1db954' }}>Play:</strong> Click on any result to start playing
                        </li>
                        <li style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#1db954' }}>Control:</strong> Use the player at the bottom to pause, seek, or adjust volume
                        </li>
                        <li style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#1db954' }}>Navigate:</strong> Go to any page - your music keeps playing!
                        </li>
                        <li>
                            <strong style={{ color: '#1db954' }}>Download:</strong> Click the download button on any history item to open in YouTube
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Music;
