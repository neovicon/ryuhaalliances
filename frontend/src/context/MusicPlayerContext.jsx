import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const MusicPlayerContext = createContext();

export const useMusicPlayer = () => {
    const context = useContext(MusicPlayerContext);
    if (!context) {
        throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
    }
    return context;
};

export const MusicPlayerProvider = ({ children }) => {
    const playerRef = useRef(null); // YouTube IFrame Player
    const playerContainerRef = useRef(null);

    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolumeState] = useState(100);
    const [isLoading, setIsLoading] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [history, setHistory] = useState([]);

    // Load history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('musicHistory');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (err) {
                console.error('Failed to parse history:', err);
            }
        }
    }, []);

    // Add track to history
    const addToHistory = (track) => {
        setHistory(prev => {
            // Remove duplicate if exists
            const filtered = prev.filter(item => item.videoId !== track.videoId);
            // Add to beginning
            const newHistory = [{ ...track, playedAt: new Date().toISOString() }, ...filtered].slice(0, 50); // Keep last 50
            // Save to localStorage
            localStorage.setItem('musicHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    // Load YouTube IFrame API
    useEffect(() => {
        // Check if API is already loaded
        if (window.YT && window.YT.Player) {
            initializePlayer();
            return;
        }

        // Load the IFrame Player API code asynchronously
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // API will call this function when ready
        window.onYouTubeIframeAPIReady = initializePlayer;

        return () => {
            window.onYouTubeIframeAPIReady = null;
        };
    }, []);

    const initializePlayer = () => {
        if (!playerContainerRef.current) return;

        playerRef.current = new window.YT.Player(playerContainerRef.current, {
            height: '0',
            width: '0',
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                playsinline: 1,
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
            },
        });
    };

    const onPlayerReady = () => {
        setPlayerReady(true);
        playerRef.current.setVolume(volume);

        // Load last played track
        const lastVideoId = localStorage.getItem('lastVideoId');
        const lastTime = parseFloat(localStorage.getItem('lastTime') || '0');

        if (lastVideoId) {
            loadTrackMetadata(lastVideoId, lastTime);
        }
    };

    const onPlayerStateChange = (event) => {
        // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
        if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setIsLoading(false);
        } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
        } else if (event.data === window.YT.PlayerState.BUFFERING) {
            setIsLoading(true);
        } else if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
        }
    };

    // Update current time and duration
    useEffect(() => {
        if (!playerReady || !playerRef.current) return;

        const interval = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const current = playerRef.current.getCurrentTime();
                const total = playerRef.current.getDuration();

                setCurrentTime(current);
                setDuration(total);

                // Save current time to localStorage
                if (currentTrack) {
                    localStorage.setItem('lastTime', current.toString());
                }
            }
        }, 500);

        return () => clearInterval(interval);
    }, [playerReady, currentTrack]);

    const loadTrackMetadata = async (videoId, seekTime = 0) => {
        try {
            const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

            if (API_KEY) {
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.items && data.items.length > 0) {
                        const videoData = data.items[0];
                        const track = {
                            videoId,
                            title: videoData.snippet.title,
                            channel: videoData.snippet.channelTitle,
                            thumbnail: videoData.snippet.thumbnails.medium.url,
                        };
                        setCurrentTrack(track);

                        // Cue the video and seek to position
                        if (playerRef.current && playerRef.current.cueVideoById) {
                            playerRef.current.cueVideoById(videoId);
                            if (seekTime > 0) {
                                setTimeout(() => {
                                    playerRef.current.seekTo(seekTime, true);
                                }, 500);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading track metadata:', error);
        }
    };

    const playTrack = async (videoId) => {
        try {
            setIsLoading(true);

            const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

            // Fetch video metadata from YouTube API
            let videoData = null;
            if (API_KEY) {
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.items && data.items.length > 0) {
                        videoData = data.items[0];
                    }
                }
            }

            if (!videoData) {
                throw new Error('Failed to fetch video metadata');
            }

            const track = {
                videoId,
                title: videoData.snippet.title,
                channel: videoData.snippet.channelTitle,
                thumbnail: videoData.snippet.thumbnails.medium.url,
            };

            setCurrentTrack(track);

            // Add to history
            addToHistory(track);

            // Load and play video using YouTube IFrame Player
            if (playerRef.current && playerRef.current.loadVideoById) {
                playerRef.current.loadVideoById(videoId);
            }

            // Save to localStorage
            localStorage.setItem('lastVideoId', videoId);
            localStorage.setItem('lastTime', '0');

        } catch (error) {
            console.error('Error playing track:', error);
            setIsLoading(false);
            alert(`Failed to play track: ${error.message}`);
        }
    };

    const togglePlay = () => {
        if (!currentTrack || !playerRef.current) return;

        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const seekTo = (time) => {
        if (!currentTrack || !playerRef.current) return;
        playerRef.current.seekTo(time, true);
        setCurrentTime(time);
    };

    const setVolume = (vol) => {
        const clampedVolume = Math.max(0, Math.min(100, vol));
        if (playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(clampedVolume);
        }
        setVolumeState(clampedVolume);
    };

    const value = {
        currentTrack,
        isPlaying,
        duration,
        currentTime,
        volume: volume / 100, // Convert to 0-1 range for compatibility
        isLoading,
        playTrack,
        togglePlay,
        seekTo,
        setVolume: (vol) => setVolume(vol * 100), // Convert from 0-1 to 0-100
        history,
        getHistory: () => history,
    };

    return (
        <MusicPlayerContext.Provider value={value}>
            {/* Hidden YouTube Player */}
            <div
                ref={playerContainerRef}
                style={{
                    position: 'fixed',
                    bottom: '-1000px',
                    left: '-1000px',
                    width: '1px',
                    height: '1px',
                    pointerEvents: 'none',
                }}
            />
            {children}
        </MusicPlayerContext.Provider>
    );
};
