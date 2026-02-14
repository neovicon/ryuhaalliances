import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';
import { Upload, Play, Eye } from 'lucide-react';
import { compressImage, shouldCompress } from '../utils/compression';
import { getErrorMessage } from '../utils/error';

export default function Dubbing() {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        loadVideos(true);
    }, []);

    async function loadVideos(reset = false) {
        try {
            setLoading(true);
            const currentPage = reset ? 1 : page;
            const { data } = await client.get('/dubbing', { params: { page: currentPage, limit: 12 } });

            if (reset) {
                setVideos(data.videos);
                setPage(2);
            } else {
                setVideos(prev => [...prev, ...data.videos]);
                setPage(prev => prev + 1);
            }

            setHasMore(currentPage < data.pagination.totalPages);
        } catch (error) {
            console.error('Error loading videos:', error);
        } finally {
            setLoading(false);
        }
    }

    const canUpload = user && (user.isDubber || user.role === 'admin');

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 className="hdr">Gacha Animations</h2>
                    <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0 0' }}>
                        Watch amazing gacha animations from our talented community
                    </p>
                </div>
                {canUpload && (
                    <button className="btn" onClick={() => setShowUploadModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={18} />
                        Upload Video
                    </button>
                )}
            </div>

            {loading && videos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                    Loading videos...
                </div>
            ) : videos.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--muted)', margin: 0 }}>No videos yet. {canUpload && 'Be the first to upload!'}</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {videos.map((video) => (
                            <Link key={video.id} to={`/dubbing/${video.id}`} className="card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
                                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                                    {video.thumbnailUrl ? (
                                        <img
                                            src={video.thumbnailUrl}
                                            alt={video.title}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}>
                                            <Play size={48} style={{ color: 'var(--primary)' }} />
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Eye size={12} />
                                        {video.views}
                                    </div>
                                </div>
                                <h3 className="hdr" style={{ fontSize: '1rem', margin: '0 0 0.5rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {video.title}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {video.uploader?.photoUrl && (
                                        <img src={video.uploader.photoUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                    )}
                                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                                        {video.uploader?.displayName || video.uploader?.username}
                                    </span>
                                </div>
                                {video.description && (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {video.description}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>

                    {hasMore && (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button className="btn" onClick={() => loadVideos()} disabled={loading}>
                                {loading ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={() => { setShowUploadModal(false); loadVideos(true); }} />}
        </div>
    );
}

function UploadModal({ onClose, onSuccess }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStage, setUploadStage] = useState(''); // 'video', 'thumbnail', 'creating'

    async function handleSubmit(e) {
        e.preventDefault();
        if (!title.trim() || !videoFile) {
            alert('Please provide a title and video file');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            // Upload video
            setUploadStage('video');
            const videoFormData = new FormData();
            videoFormData.append('file', videoFile);
            const { data: videoData } = await client.post('/upload', videoFormData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            // Upload thumbnail if provided
            let thumbnailKey = null;
            if (thumbnailFile) {
                setUploadStage('thumbnail');
                setUploadProgress(0);

                // Compress thumbnail if needed
                let fileToUpload = thumbnailFile;
                if (shouldCompress(thumbnailFile)) {
                    try {
                        fileToUpload = await compressImage(thumbnailFile, 1280, 720, 0.85);
                        console.log(`Thumbnail compressed: ${thumbnailFile.size} -> ${fileToUpload.size} bytes`);
                    } catch (error) {
                        console.error('Failed to compress thumbnail, using original:', error);
                    }
                }

                const thumbFormData = new FormData();
                thumbFormData.append('file', fileToUpload);
                const { data: thumbData } = await client.post('/upload', thumbFormData, {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                });
                thumbnailKey = thumbData.key;
            }

            // Create video entry
            setUploadStage('creating');
            setUploadProgress(100);

            const payload = {
                title: title.trim(),
                description: description.trim(),
                videoUrl: videoData.key
            };

            // Only include thumbnailUrl if it exists
            if (thumbnailKey) {
                payload.thumbnailUrl = thumbnailKey;
            }

            console.log('Sending payload to /dubbing:', payload);

            await client.post('/dubbing', payload);

            alert('Video uploaded successfully!');
            onSuccess();
        } catch (error) {
            console.error('Error uploading video:', error);
            alert(getErrorMessage(error, 'Failed to upload video'));
        } finally {
            setUploading(false);
            setUploadProgress(0);
            setUploadStage('');
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
            <div className="card" style={{ maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <h3 className="hdr" style={{ marginBottom: '1.5rem' }}>Upload Gacha Animation</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                            Title *
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter video title"
                            maxLength={200}
                            style={{ width: '100%' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                            Description
                        </label>
                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter video description"
                            maxLength={2000}
                            style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                            Video File *
                        </label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setVideoFile(e.target.files[0])}
                            style={{ width: '100%', color: 'var(--text)' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                            Thumbnail (optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setThumbnailFile(e.target.files[0])}
                            style={{ width: '100%', color: 'var(--text)' }}
                        />
                    </div>

                    {uploading && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                                    {uploadStage === 'video' && 'Uploading video...'}
                                    {uploadStage === 'thumbnail' && 'Uploading thumbnail...'}
                                    {uploadStage === 'creating' && 'Creating video entry...'}
                                </span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {uploadProgress}%
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(177,15,46,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${uploadProgress}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--primary) 0%, #d91d42 100%)',
                                    transition: 'width 0.3s ease',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn" onClick={onClose} style={{ background: 'transparent', border: '1px solid #1f2937' }} disabled={uploading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
