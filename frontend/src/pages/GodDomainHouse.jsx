import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';
import { getErrorMessage } from '../utils/error';

function getHouseImageSrc(houseName) {
    if (!houseName) return '/assets/pendragon.jpeg';
    const houseMap = {
        'Pendragon': 'pendragon',
        'Phantomhive': 'phantomhive',
        'Tempest': 'tempest',
        'Zoldyck': 'zoldyck',
        'Fritz': 'fritz',
        'Elric': 'elric',
        'Dragneel': 'dragneel',
        'Hellsing': 'hellsing',
        'Von Einzbern': 'von_einzbern'
    };
    const fileName = houseMap[houseName] || houseName.toLowerCase().replace(' ', '_');
    return `/assets/${fileName}.jpeg`;
}

const houseGods = {
    'Pendragon': { name: 'Asgorath', image: 'Asgorath_Pendragon.jpg' },
    'Phantomhive': { name: 'Morgana', image: 'MORGANA_Phantomhive.jpg' },
    'Tempest': { name: 'Kaelith', image: 'KAELITH_Tempest.jpg' },
    'Zoldyck': { name: 'Lycan', image: '𝐋𝐲𝐜𝐚𝐧_Zoldyck.jpg' },
    'Fritz': { name: 'Soro Von Lumintaria', image: 'Soro_Von_Lumintaria_Fritz.jpg' },
    'Elric': { name: 'Thalessara Elyndra', image: '𝐓𝐡𝐚𝐥𝐞𝐬𝐬𝐚𝐫𝐚_𝐄𝐥𝐲𝐧𝐝𝐫𝐚_Elric.jpg' },
    'Hellsing': { name: 'Aethernox', image: 'Aethernox_Hellsing.jpg' },
    'Von Einzbern': { name: 'Morglyia Noctfrost', image: 'Morglyia_Noctfrost_VON_EINZBERN.jpg' },
    'Dragneel': { name: 'Unknown Patron', image: null }
};

const slugToNameMap = {
    'pendragon': 'Pendragon',
    'phantomhive': 'Phantomhive',
    'tempest': 'Tempest',
    'zoldyck': 'Zoldyck',
    'fritz': 'Fritz',
    'elric': 'Elric',
    'dragneel': 'Dragneel',
    'hellsing': 'Hellsing',
    'von-einzbern': 'Von Einzbern'
};

export default function GodDomainHouse() {
    const { houseSlug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [house, setHouse] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState(null);
    const [isMember, setIsMember] = useState(false);

    // New Post Form
    const [postContent, setPostContent] = useState('');
    const [postImage, setPostImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef();

    // Admin Blessing Points
    const [showAdminEdit, setShowAdminEdit] = useState(false);
    const [newBlessingPoints, setNewBlessingPoints] = useState(0);

    // Edit State
    const [editingPostId, setEditingPostId] = useState(null);
    const [editPostContent, setEditPostContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState('');

    const houseName = slugToNameMap[houseSlug] || houseSlug;

    useEffect(() => {
        loadHouseAndPosts();
    }, [houseSlug]);

    useEffect(() => {
        if (user && houseName) {
            setIsMember(user.house === houseName || user.role === 'admin');
        }
    }, [user, houseName]);

    async function loadHouseAndPosts() {
        try {
            setLoading(true);
            const [houseRes, postsRes] = await Promise.all([
                client.get('/god-domain/houses'),
                client.get(`/god-domain/posts/${houseName}`)
            ]);

            const houseDoc = houseRes.data.houses.find(h => h.name === houseName);
            setHouse(houseDoc);
            setPosts(postsRes.data.posts || []);
            setNextCursor(postsRes.data.nextCursor);
            setNewBlessingPoints(houseDoc?.blessingPoints || 0);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handlePostSubmit(e) {
        e.preventDefault();
        if (!postContent.trim() && !postImage) return;

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('house', houseName);
            formData.append('content', postContent);
            if (postImage) formData.append('image', postImage);

            await client.post('/god-domain/posts', formData);
            setPostContent('');
            setPostImage(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadHouseAndPosts();
        } catch (error) {
            alert(getErrorMessage(error, 'Failed to create post'));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleUpdatePost(postId) {
        try {
            await client.patch(`/god-domain/posts/${postId}`, { content: editPostContent });
            setEditingPostId(null);
            loadHouseAndPosts();
        } catch (error) {
            alert(getErrorMessage(error, 'Failed to update post'));
        }
    }

    async function handleDeletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await client.delete(`/god-domain/posts/${postId}`);
            setPosts(posts.filter(p => p._id !== postId));
        } catch (error) {
            alert(getErrorMessage(error, 'Failed to delete post'));
        }
    }

    async function handleAddComment(postId, content) {
        try {
            await client.post(`/god-domain/posts/${postId}/comments`, { content });
            loadHouseAndPosts();
        } catch (error) {
            alert(getErrorMessage(error, 'Failed to add comment'));
        }
    }

    async function handleUpdateComment(postId, commentId) {
        try {
            await client.patch(`/god-domain/posts/${postId}/comments/${commentId}`, { content: editCommentContent });
            setEditingCommentId(null);
            loadHouseAndPosts();
        } catch (error) {
            alert(getErrorMessage(error, 'Failed to update comment'));
        }
    }

    async function handleDeleteComment(postId, commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            await client.delete(`/god-domain/posts/${postId}/comments/${commentId}`);
            loadHouseAndPosts();
        } catch (error) {
            alert(getErrorMessage(error, 'Failed to delete comment'));
        }
    }

    async function handleUpdateBlessingPoints() {
        try {
            await client.patch('/god-domain/blessing-points', { houseName, points: newBlessingPoints });
            setHouse({ ...house, blessingPoints: newBlessingPoints });
            setShowAdminEdit(false);
        } catch (error) {
            alert(getErrorMessage(error, 'Failed to update blessing points'));
        }
    }

    if (loading && !house) return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Loading Domain...</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => navigate('/god')} className="btn" style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--muted)', color: 'var(--muted)' }}>
                &larr; Back to Realms
            </button>

            {/* House Header */}
            <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative' }}>
                <img
                    src={getHouseImageSrc(houseName)}
                    alt={houseName}
                    style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: '1rem', borderRadius: '12px' }}
                />
                <h2 className="hdr" style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{houseName} God Domain</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.5rem' }}>
                        ✨ {house?.blessingPoints || 0} Blessing Points
                    </div>
                    {user?.role === 'admin' && (
                        <button className="btn" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setShowAdminEdit(!showAdminEdit)}>
                            {showAdminEdit ? 'Cancel' : 'Edit'}
                        </button>
                    )}
                </div>

                {showAdminEdit && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <input
                            type="number"
                            className="input"
                            value={newBlessingPoints}
                            onChange={(e) => setNewBlessingPoints(parseInt(e.target.value) || 0)}
                            style={{ width: '100px' }}
                        />
                        <button className="btn" onClick={handleUpdateBlessingPoints}>Save</button>
                    </div>
                )}
            </div>

            {/* God Section */}
            {houseGods[houseName] && (
                <div className="card god-details-card" style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                }}>
                    {houseGods[houseName].image ? (
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img
                                src={`/assets/gods/${houseGods[houseName].image}`}
                                alt={houseGods[houseName].name}
                                style={{
                                    width: '180px',
                                    height: '240px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '2px solid rgba(255, 215, 0, 0.3)'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
                                pointerEvents: 'none'
                            }}></div>
                        </div>
                    ) : (
                        <div style={{
                            width: '180px',
                            height: '240px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            color: 'var(--muted)'
                        }}>
                            No Image
                        </div>
                    )}
                    <div className="god-details-content" style={{ flex: 1 }}>
                        <div style={{
                            color: 'var(--primary)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '3px',
                            marginBottom: '0.5rem',
                            opacity: 0.8
                        }}>
                            Patron God of {houseName}
                        </div>
                        <h2 className="hdr" style={{
                            fontSize: '2.2rem',
                            margin: '0 0 1rem 0',
                            background: 'linear-gradient(to right, #fff, var(--primary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontFamily: "'Cinzel', serif"
                        }}>
                            {houseGods[houseName].name}
                        </h2>
                        <p style={{
                            color: 'var(--muted)',
                            fontStyle: 'italic',
                            lineHeight: 1.6,
                            fontSize: '1rem',
                            maxWidth: '400px'
                        }}>
                            The divine presence that oversees the sacred halls of {houseName}.
                            Followers of {houseGods[houseName].name} are granted strength and wisdom within this domain.
                        </p>
                    </div>
                </div>
            )}

            {/* Post Form */}
            {isMember && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 className="hdr" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Share with your House</h3>
                    <form onSubmit={handlePostSubmit}>
                        <textarea
                            className="input"
                            placeholder="What's on your mind?"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            style={{ width: '100%', minHeight: '80px', marginBottom: '1rem' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => setPostImage(e.target.files[0])}
                                style={{ display: 'none' }}
                                accept="image/*"
                            />
                            <button
                                type="button"
                                className="btn"
                                style={{ background: 'transparent', border: '1px solid #1f2937' }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                {postImage ? '✓ Image Selected' : '📷 Add Image'}
                            </button>
                            <button type="submit" className="btn" disabled={submitting || (!postContent.trim() && !postImage)}>
                                {submitting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Posts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {posts.map((post) => (
                    <div key={post._id} className="card">
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <img
                                src={post.author?.photoUrl || '/assets/default-avatar.png'}
                                alt={post.author?.username}
                                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>
                                    {post.author?.username}
                                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 400 }}>
                                        {post.author?.memberStatus}
                                    </span>
                                </div>
                                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(post.createdAt).toLocaleString()}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {(user?.id === post.author?._id || user?.role === 'admin' || (user?.house === houseName && user?.memberStatus === 'Lord of the House')) && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingPostId(post._id);
                                                setEditPostContent(post.content);
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeletePost(post._id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {editingPostId === post._id ? (
                            <div style={{ marginBottom: '1rem' }}>
                                <textarea
                                    className="input"
                                    value={editPostContent}
                                    onChange={(e) => setEditPostContent(e.target.value)}
                                    style={{ width: '100%', minHeight: '80px', marginBottom: '0.5rem' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn" onClick={() => handleUpdatePost(post._id)}>Update</button>
                                    <button className="btn" style={{ background: 'transparent' }} onClick={() => setEditingPostId(null)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ lineHeight: 1.6, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{post.content}</div>
                        )}

                        {post.image && (
                            <img
                                src={post.image}
                                alt="Post content"
                                style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #1f2937' }}
                            />
                        )}

                        {/* Comments */}
                        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '1rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {post.comments?.map((comment) => (
                                    <div key={comment._id} style={{ display: 'flex', gap: '0.75rem' }}>
                                        <img
                                            src={comment.author?.photoUrl || '/assets/default-avatar.png'}
                                            alt={comment.author?.username}
                                            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{comment.author?.username}</span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {(user?.id === comment.author?._id || user?.role === 'admin' || (user?.house === houseName && user?.memberStatus === 'Lord of the House')) && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingCommentId(comment._id);
                                                                setEditCommentContent(comment.content);
                                                            }}
                                                            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {(user?.id === comment.author?._id || user?.role === 'admin' || user?.id === post.author?._id || (user?.house === houseName && user?.memberStatus === 'Lord of the House')) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(post._id, comment._id)}
                                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {editingCommentId === comment._id ? (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <input
                                                        className="input"
                                                        value={editCommentContent}
                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                        style={{ width: '100%', marginBottom: '0.4rem', fontSize: '0.9rem' }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                        <button className="btn" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => handleUpdateComment(post._id, comment._id)}>Update</button>
                                                        <button className="btn" style={{ padding: '2px 8px', fontSize: '0.8rem', background: 'transparent' }} onClick={() => setEditingCommentId(null)}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.9rem' }}>{comment.content}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isMember && (
                                <CommentInput onAdd={(content) => handleAddComment(post._id, content)} />
                            )}
                        </div>
                    </div>
                ))}

                {posts.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                        The sacred halls are silent. Be the first to grace them with your presence.
                    </div>
                )}
            </div>
        </div>
    );
}

function CommentInput({ onAdd }) {
    const [content, setContent] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        onAdd(content);
        setContent('');
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <input
                className="input"
                placeholder="Add a comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
            />
            <button className="btn" type="submit" style={{ padding: '0 1rem' }}>Add</button>
        </form>
    );
}
