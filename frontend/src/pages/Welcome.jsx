import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../store/auth';
import client from '../api/client';
import { getErrorMessage } from '../utils/error';
import { Camera, Loader2, User } from 'lucide-react';

export default function Welcome() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const observer = useRef();
    const lastPostRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        loadPosts();
    }, [page]);

    async function loadPosts() {
        try {
            setLoading(true);
            const { data } = await client.get(`/welcome?page=${page}`);
            if (page === 1) {
                setPosts(data.posts);
            } else {
                setPosts(prev => [...prev, ...data.posts]);
            }
            setHasMore(data.hasMore);
        } catch (error) {
            console.error('Error loading welcome posts:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!imageFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const { data } = await client.post('/welcome', formData);
            setPosts(prev => [data, ...prev]);
            setImageFile(null);
            setPreviewUrl(null);
        } catch (error) {
            alert(getErrorMessage(error, 'Failed to upload image'));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await client.delete(`/welcome/${id}`);
            setPosts(prev => prev.filter(p => p._id !== id));
        } catch (error) {
            alert(getErrorMessage(error, 'Failed to delete post'));
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', minHeight: '80vh' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="hdr" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome to Ryuha Alliance</h1>
                <p style={{ color: 'var(--muted)' }}>A space for our members to share their journey</p>
            </div>

            {user && (
                <div className="card" style={{ maxWidth: 600, margin: '0 auto 3rem auto', padding: '1.5rem' }}>
                    <h3 className="hdr" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Share an Image</h3>
                    <form onSubmit={handleUpload}>
                        <div
                            style={{
                                border: '2px dashed var(--border)',
                                borderRadius: '12px',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                background: 'rgba(255,255,255,0.02)',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => document.getElementById('welcome-upload').click()}
                        >
                            <input
                                id="welcome-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8 }}
                                />
                            ) : (
                                <div style={{ color: 'var(--muted)' }}>
                                    <Camera size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>Click to select or drag and drop an image</p>
                                    <p style={{ fontSize: '0.8rem' }}>JPG, PNG, WEBP only</p>
                                </div>
                            )}
                        </div>

                        {imageFile && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button
                                    type="submit"
                                    className="btn"
                                    disabled={uploading}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    {uploading ? <Loader2 className="animate-spin" size={18} /> : 'Post to Ryuha Alliance'}
                                </button>
                                <button
                                    type="button"
                                    className="btn outline"
                                    onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            )}

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {posts.map((post, index) => (
                    <div
                        key={post._id}
                        ref={index === posts.length - 1 ? lastPostRef : null}
                        className="card"
                        style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}
                    >
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => handleDelete(post._id)}
                                style={{
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    zIndex: 10,
                                    background: 'rgba(220, 38, 38, 0.8)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        )}
                        <div
                            style={{
                                position: 'relative',
                                aspectRatio: '1/1',
                                backgroundColor: '#000',
                                cursor: 'pointer'
                            }}
                            onClick={() => window.open(post.imageUrl, '_blank')}
                        >
                            <img
                                src={post.imageUrl}
                                alt="Welcome post"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                            />
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                backgroundColor: 'var(--border)',
                                flexShrink: 0
                            }}>
                                {post.author?.photoUrl ? (
                                    <img src={post.author.photoUrl} alt={post.author.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={16} color="var(--muted)" />
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.author?.username || 'Unknown User'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                    {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                </div>
            )}

            {!loading && posts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--muted)' }}>
                    <p>No images shared yet. Be the first!</p>
                </div>
            )}
        </div>
    );
}
