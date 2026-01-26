import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusicPlayer } from '../context/MusicPlayerContext';

const MusicPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    isLoading,
    togglePlay,
    seekTo,
    setVolume,
  } = useMusicPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format time in MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle seek bar drag
  const handleSeekMouseDown = () => {
    setIsDragging(true);
  };

  const handleSeekMouseUp = (e) => {
    setIsDragging(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(newTime);
  };

  const handleSeekMouseMove = (e) => {
    if (isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      seekTo(newTime);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  const seekPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #333',
        padding: isMobile ? '8px 12px' : '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '8px' : '16px',
        zIndex: 1000,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: isMobile ? '40px' : '56px',
          height: isMobile ? '40px' : '56px',
          borderRadius: '4px',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {currentTrack?.thumbnail ? (
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: isMobile ? '18px' : '24px' }}>🎵</span>
        )}
      </div>

      {/* Track Info - Clickable */}
      <div
        onClick={() => navigate('/music')}
        style={{
          flex: isMobile ? '1 1 100%' : '0 0 200px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          cursor: 'pointer',
          order: isMobile ? 3 : 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {currentTrack ? currentTrack.title : 'No track playing'}
        </div>
        <div
          style={{
            color: '#aaa',
            fontSize: isMobile ? '10px' : '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {currentTrack ? currentTrack.channel : 'Search for music to play'}
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        style={{
          width: isMobile ? '36px' : '40px',
          height: isMobile ? '36px' : '40px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#1db954',
          color: '#fff',
          fontSize: isMobile ? '14px' : '16px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.1s',
          opacity: isLoading ? 0.6 : 1,
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isLoading ? '...' : isPlaying ? '⏸' : '▶'}
      </button>

      {/* Music Controls - Hidden on mobile */}
      {!isMobile && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {/* Previous Button */}
          <button
            onClick={() => {
              // TODO: Implement previous track functionality when playlist is available
              console.log('Previous track');
            }}
            disabled={!currentTrack}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #444',
              backgroundColor: 'transparent',
              color: '#fff',
              fontSize: '14px',
              cursor: currentTrack ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: currentTrack ? 1 : 0.4,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (currentTrack) e.currentTarget.style.backgroundColor = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Previous Track"
          >
            ⏮
          </button>

          {/* Next Button */}
          <button
            onClick={() => {
              // TODO: Implement next track functionality when playlist is available
              console.log('Next track');
            }}
            disabled={!currentTrack}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #444',
              backgroundColor: 'transparent',
              color: '#fff',
              fontSize: '14px',
              cursor: currentTrack ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: currentTrack ? 1 : 0.4,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (currentTrack) e.currentTarget.style.backgroundColor = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Next Track"
          >
            ⏭
          </button>

          {/* Shuffle Button */}
          <button
            onClick={() => {
              // TODO: Implement shuffle functionality when playlist is available
              console.log('Toggle shuffle');
            }}
            disabled={!currentTrack}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #444',
              backgroundColor: 'transparent',
              color: '#fff',
              fontSize: '14px',
              cursor: currentTrack ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: currentTrack ? 1 : 0.4,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (currentTrack) e.currentTarget.style.backgroundColor = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Shuffle"
          >
            🔀
          </button>

          {/* Repeat Button */}
          <button
            onClick={() => {
              // TODO: Implement repeat functionality when playlist is available
              console.log('Toggle repeat');
            }}
            disabled={!currentTrack}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #444',
              backgroundColor: 'transparent',
              color: '#fff',
              fontSize: '14px',
              cursor: currentTrack ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: currentTrack ? 1 : 0.4,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (currentTrack) e.currentTarget.style.backgroundColor = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Repeat"
          >
            🔁
          </button>
        </div>
      )}

      {/* Mobile Menu Button (3 lines) */}
      <button
        onClick={() => navigate('/music')}
        style={{
          width: isMobile ? '36px' : '40px',
          height: isMobile ? '36px' : '40px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#333',
          color: '#fff',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          flexShrink: 0,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#333';
        }}
        title="Open Music Player"
      >
        <div style={{ width: '18px', height: '2px', backgroundColor: '#fff', borderRadius: '1px' }} />
        <div style={{ width: '18px', height: '2px', backgroundColor: '#fff', borderRadius: '1px' }} />
        <div style={{ width: '18px', height: '2px', backgroundColor: '#fff', borderRadius: '1px' }} />
      </button>

      {/* Seek Bar Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '6px' : '12px',
          minWidth: 0,
        }}
      >
        {/* Current Time */}
        <div
          style={{
            color: '#aaa',
            fontSize: isMobile ? '10px' : '12px',
            fontFamily: 'monospace',
            minWidth: isMobile ? '32px' : '40px',
            textAlign: 'right',
          }}
        >
          {formatTime(currentTime)}
        </div>

        {/* Seek Bar */}
        <div
          onMouseDown={handleSeekMouseDown}
          onMouseUp={handleSeekMouseUp}
          onMouseMove={handleSeekMouseMove}
          style={{
            flex: 1,
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#444',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${seekPercent}%`,
                backgroundColor: '#1db954',
                borderRadius: '2px',
                transition: isDragging ? 'none' : 'width 0.1s',
              }}
            />
          </div>
        </div>

        {/* Duration */}
        <div
          style={{
            color: '#aaa',
            fontSize: isMobile ? '10px' : '12px',
            fontFamily: 'monospace',
            minWidth: isMobile ? '32px' : '40px',
          }}
        >
          {formatTime(duration)}
        </div>
      </div>

      {/* Volume Control - Hidden on mobile */}
      {!isMobile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#aaa', fontSize: '16px' }}>🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
            style={{
              width: '80px',
              height: '4px',
              borderRadius: '2px',
              outline: 'none',
              background: `linear-gradient(to right, #1db954 0%, #1db954 ${volume * 100}%, #444 ${volume * 100}%, #444 100%)`,
              appearance: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
