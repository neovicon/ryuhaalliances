import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../store/auth';
import { Heart, Flame, Hand, Laugh, ThumbsUp, Share2, MessageCircle, Trash2, Send } from 'lucide-react';

const REACTION_ICONS = {
    like: ThumbsUp,
    love: Heart,
    fire: Flame,
    clap: Hand,
    laugh: Laugh
};

export default function DubbingVideoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        loadVideo();
    }, [id]);

    async function loadVideo() {
        try {
            setLoading(true);
            const { data } = await client.get(`/dubbing/${id}`);
            setVideo(data.video);
        } catch (error) {
            console.error('Error loading video:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleReaction(type) {
        if (!user) {
            alert('Please sign in to react to videos');
            return;
        }

        try {
            const userReaction = video.reactions?.find(r => r.user?.id === user.id || r.user?._id === user.id);

            if (userReaction?.type === type) {
                // Remove reaction if clicking the same type
                await client.delete(`/dubbing/${id}/reactions`);
            } else {
                // Add or change reaction
                await client.post(`/dubbing/${id}/reactions`, { type });
            }

            await loadVideo();
        } catch (error) {
            console.error('Error handling reaction:', error);
            alert(getErrorMessage(error, 'Failed to update reaction'));
        }
    }

    async function handleAddComment(e) {
        e.preventDefault();
        if (!user) {
            alert('Please sign in to comment');
            return;
        }
        if (!commentText.trim()) return;

        try {
            setSubmittingComment(true);
            await client.post(`/dubbing/${id}/comments`, { content: commentText });
            setCommentText('');
            await loadVideo();
        } catch (error) {
            console.error('Error adding comment:', error);
            alert(getErrorMessage(error, 'Failed to add comment'));
        } finally {
            setSubmittingComment(false);
        }
    }

    async function handleDeleteComment(commentId) {
        if (!confirm('Delete this comment?')) return;

        try {
            await client.delete(`/dubbing/${id}/comments/${commentId}`);
            await loadVideo();
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert(getErrorMessage(error, 'Failed to delete comment'));
        }
    }

    async function handleShare() {
        try {
            await client.post(`/dubbing/${id}/share`);
            if (navigator.share) {
                await navigator.share({
                    title: video.title,
                    text: video.description,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    }

    async function handleDelete() {
        if (!confirm('Delete this video? This action cannot be undone.')) return;

        try {
            await client.delete(`/dubbing/${id}`);
            alert('Video deleted successfully');
            navigate('/dubbing');
        } catch (error) {
            console.error('Error deleting video:', error);
            alert(getErrorMessage(error, 'Failed to delete video'));
        }
    }

    if (loading) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--muted)' }}>Loading video...</div>
            </div>
        );
    }

    if (!video) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--muted)' }}>Video not found</div>
            </div>
        );
    }

    const userReaction = video.reactions?.find(r => r.user?.id === user?.id || r.user?._id === user?.id);
    const reactionCounts = video.reactions?.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
    }, {}) || {};

    const canDelete = user && (user.id === video.uploader?.id || user._id === video.uploader?._id || user.role === 'admin');

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: 900 }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link to="/dubbing" className="link" style={{ fontSize: '0.9rem' }}>← Back to Gacha Animations</Link>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h2 className="hdr" style={{ margin: 0 }}>{video.title}</h2>
                        {canDelete && (
                            <button className="btn" onClick={handleDelete} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.4rem 0.8rem' }}>
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {video.uploader?.photoUrl && (
                                <img src={video.uploader.photoUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            )}
                            <span style={{ fontWeight: 600 }}>{video.uploader?.displayName || video.uploader?.username}</span>
                        </div>
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                            {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                            {video.views} views
                        </span>
                    </div>

                    {video.description && (
                        <p style={{ color: 'var(--muted)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{video.description}</p>
                    )}

                    <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                        <video
                            src={video.videoUrl}
                            controls
                            preload="metadata"
                            playsInline
                            crossOrigin="anonymous"
                            controlsList="nodownload"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            onError={(e) => {
                                // Try without crossOrigin on error (some servers don't support CORS headers)
                                if (e.target.crossOrigin) {
                                    e.target.crossOrigin = null;
                                    e.target.load();
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Reactions */}
                <div style={{ borderTop: '1px solid #1f2937', paddingTop: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {Object.entries(REACTION_ICONS).map(([type, Icon]) => {
                            const count = reactionCounts[type] || 0;
                            const isActive = userReaction?.type === type;
                            return (
                                <button
                                    key={type}
                                    className="btn"
                                    onClick={() => handleReaction(type)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        background: isActive ? 'rgba(177,15,46,0.2)' : 'transparent',
                                        border: `1px solid ${isActive ? 'var(--primary)' : '#1f2937'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.9rem'
                                    }}
                                    disabled={!user}
                                >
                                    <Icon size={16} />
                                    {count > 0 && <span>{count}</span>}
                                </button>
                            );
                        })}
                        <button
                            className="btn"
                            onClick={handleShare}
                            style={{
                                padding: '0.4rem 0.8rem',
                                background: 'transparent',
                                border: '1px solid #1f2937',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.9rem'
                            }}
                        >
                            <Share2 size={16} />
                            {video.shareCount > 0 && <span>{video.shareCount}</span>}
                        </button>
                    </div>
                </div>

                {/* Comments */}
                <div style={{ borderTop: '1px solid #1f2937', paddingTop: '1rem' }}>
                    <h3 className="hdr" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                        <MessageCircle size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Comments ({video.comments?.length || 0})
                    </h3>

                    {user && (
                        <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem' }}>
                            <textarea
                                className="input"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                style={{ width: '100%', minHeight: 80, marginBottom: '0.5rem', resize: 'vertical' }}
                                maxLength={1000}
                            />
                            <button
                                type="submit"
                                className="btn"
                                disabled={!commentText.trim() || submittingComment}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Send size={16} />
                                {submittingComment ? 'Posting...' : 'Post Comment'}
                            </button>
                        </form>
                    )}

                    {!user && (
                        <div style={{ padding: '1rem', background: 'rgba(177,15,46,0.05)', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <Link to="/login" className="link">Sign in</Link> to comment
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {video.comments?.length === 0 && (
                            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
                                No comments yet. Be the first to comment!
                            </div>
                        )}
                        {video.comments?.map((comment) => (
                            <div key={comment._id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {comment.user?.photoUrl && (
                                            <img src={comment.user.photoUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                {comment.user?.displayName || comment.user?.username}
                                            </div>
                                            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    {user && (user.id === comment.user?.id || user._id === comment.user?._id || user.role === 'admin') && (
                                        <button
                                            className="btn"
                                            onClick={() => handleDeleteComment(comment._id)}
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid #1f2937' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
