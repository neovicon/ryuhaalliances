import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';
import Reactions from '../components/Reactions';
import ShareButton from '../components/ShareButton';

export default function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentContent, setCommentContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadPost();
    }, [id]);

    async function loadPost() {
        try {
            setLoading(true);
            // We can reuse the list endpoint or fetch single if available. 
            // Since we don't have a single post endpoint in the routes shown, 
            // we might need to add one or filter from list (inefficient) or just use the list endpoint with ID if supported?
            // Wait, the backend routes didn't show GET /posts/:id. 
            // I should add GET /posts/:id to backend or use existing list with filter?
            // The user didn't ask for a new backend endpoint for single post, but it's needed.
            // Actually, I can use the list endpoint and filter client side if I have to, but that's bad.
            // Let's check post.routes.js again. 
            // It has router.get('/', requireAuth, listPosts);
            // It DOES NOT have router.get('/:id').
            // I should add it.

            // For now, assuming I will add it or use a workaround. 
            // Let's add the route to backend first/concurrently.
            const { data } = await client.get(`/posts/${id}`);
            setPost(data.post);
        } catch (err) {
            console.error('Failed to load post:', err);
            setError('Failed to load post');
        } finally {
            setLoading(false);
        }
    }

    async function handleCommentSubmit(e) {
        e.preventDefault();
        if (!commentContent.trim()) return;

        try {
            setSubmitting(true);
            await client.post(`/posts/${id}/comments`, { content: commentContent });
            setCommentContent('');
            await loadPost(); // Reload to see new comment
        } catch (err) {
            console.error('Failed to post comment:', err);
            alert('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeletePost() {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await client.delete(`/posts/${id}`);
            navigate('/feed');
        } catch (err) {
            console.error('Failed to delete post:', err);
            alert('Failed to delete post');
        }
    }

    async function handleDeleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            await client.delete(`/posts/${id}/comments/${commentId}`);
            await loadPost();
        } catch (err) {
            console.error('Failed to delete comment:', err);
            alert('Failed to delete comment');
        }
    }

    if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>;
    if (error || !post) return <div className="container" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Post not found</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} className="btn" style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid var(--muted)', color: 'var(--muted)' }}>
                &larr; Back
            </button>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <img
                        src={post.author?.photoUrl || '/default-avatar.png'}
                        alt={post.author?.username}
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{post.author?.username}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{new Date(post.createdAt).toLocaleString()}</div>
                    </div>
                    {(user?.id === post.author?._id || user?.role === 'admin') && (
                        <button
                            onClick={handleDeletePost}
                            className="btn"
                            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        >
                            Delete
                        </button>
                    )}
                </div>

                <div style={{ fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                    {post.content}
                </div>

                {post.image && (
                    <img
                        src={post.image}
                        alt="Post content"
                        style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #1f2937' }}
                    />
                )}

                <div style={{ borderTop: '1px solid #1f2937', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        {post.comments?.length || 0} Comments
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Reactions
                            contentType="posts"
                            contentId={post._id || post.id}
                            reactions={post.reactions || []}
                            user={user}
                            onReactionUpdate={loadPost}
                        />
                        <ShareButton
                            url={window.location.href}
                            title={post.content?.substring(0, 100) || 'Check out this post'}
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 className="hdr" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Comments</h3>

                <form onSubmit={handleCommentSubmit} style={{ marginBottom: '2rem' }}>
                    <textarea
                        className="input"
                        placeholder="Write a comment..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        style={{ width: '100%', minHeight: 80, marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn" type="submit" disabled={submitting || !commentContent.trim()}>
                            {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {post.comments?.map((comment, index) => (
                        <div key={index} className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <img
                                    src={comment.author?.photoUrl || '/default-avatar.png'}
                                    alt={comment.author?.username}
                                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{comment.author?.username}</div>
                                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{new Date(comment.createdAt).toLocaleString()}</div>
                                </div>
                                {(user?.id === comment.author?._id || user?.role === 'admin') && (
                                    <button
                                        onClick={() => handleDeleteComment(comment._id)}
                                        style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                            <div style={{ fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                {comment.content}
                            </div>
                        </div>
                    ))}
                    {(!post.comments || post.comments.length === 0) && (
                        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>
                            No comments yet. Be the first to share your thoughts!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
