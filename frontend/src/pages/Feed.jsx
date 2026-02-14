import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Reactions from '../components/Reactions';
import ShareButton from '../components/ShareButton';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../store/auth';

export default function Feed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [mentionEveryone, setMentionEveryone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const loadPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentCursor = reset ? null : cursor;
      const { data } = await client.get('/posts', { params: { cursor: currentCursor, limit: 10 } });

      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }

      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    loadPosts(true);
  }, []);

  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadPosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadPosts]);

  const handlePost = async () => {
    if (!content.trim() && !imageFile && !videoFile) return;
    setPosting(true);
    try {
      const form = new FormData();
      if (content.trim()) form.append('content', content.trim());
      if (imageFile) form.append('image', imageFile);
      if (videoFile) form.append('video', videoFile);
      if (isPrivate) form.append('isPrivate', 'true');
      if (mentionEveryone) form.append('mentionEveryone', 'true');

      await client.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setContent('');
      setImageFile(null);
      setVideoFile(null);
      setIsPrivate(false);
      setMentionEveryone(false);
      loadPosts(true); // Refresh feed
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(getErrorMessage(error, 'Failed to create post'));
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (e, postId) => {
    e.stopPropagation(); // Prevent navigation to detail page
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await client.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert(getErrorMessage(error, 'Failed to delete post'));
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <textarea
          className="input"
          style={{ width: '100%', minHeight: 80, marginBottom: '0.5rem' }}
          placeholder="Share something..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        {imageFile && (
          <div style={{ marginBottom: '0.5rem', position: 'relative', display: 'inline-block' }}>
            <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ maxHeight: 200, borderRadius: 8 }} />
            <button
              onClick={() => setImageFile(null)}
              style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {videoFile && (
          <div style={{ marginBottom: '0.5rem', position: 'relative', display: 'inline-block' }}>
            <video src={URL.createObjectURL(videoFile)} controls style={{ maxHeight: 200, borderRadius: 8, maxWidth: '100%' }} />
            <button
              onClick={() => setVideoFile(null)}
              style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
              📷 Add Image
            </label>
            <label style={{ cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="file"
                accept="video/*"
                onChange={e => setVideoFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
              🎥 Add Video
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={e => setIsPrivate(e.target.checked)}
              />
              Private
            </label>
            {user?.role === 'admin' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={mentionEveryone}
                  onChange={e => setMentionEveryone(e.target.checked)}
                />
                Mention Everyone
              </label>
            )}
          </div>
          <button className="btn" onClick={handlePost} disabled={posting || (!content.trim() && !imageFile && !videoFile)}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      <div className="grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts.map((p, index) => {
          const isLast = index === posts.length - 1;
          return (
            <div
              className="card"
              key={p._id || p.id}
              ref={isLast ? lastPostElementRef : null}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/post/${p._id || p.id}`)}
            >
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div
                  style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flex: 1, cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile?q=${encodeURIComponent(p.author?.username)}`);
                  }}
                >
                  <img
                    src={p.author?.photoUrl || '/default-avatar.png'}
                    alt={p.author?.username}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #1f2937' }}
                    onError={(e) => e.target.src = '/default-avatar.png'}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.author?.username}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(p.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                {(user?.id === p.author?._id || user?.role === 'admin') && (
                  <button
                    onClick={(e) => handleDeletePost(e, p._id || p.id)}
                    className="btn"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: 'none' }}
                  >
                    Delete
                  </button>
                )}
              </div>

              {p.content && <div style={{ marginBottom: '0.5rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{p.content}</div>}

              {p.image && (
                <img
                  src={p.image}
                  alt="Post content"
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid #1f2937' }}
                />
              )}

              {p.video && (
                <video
                  src={p.video}
                  controls
                  style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid #1f2937' }}
                />
              )}

              <div style={{ borderTop: '1px solid #1f2937', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <span>{p.comments?.length || 0} Comments</span>
                  {p.isPrivate && <span>🔒 Private</span>}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }} onClick={(e) => e.stopPropagation()}>
                  <Reactions
                    contentType="posts"
                    contentId={p._id || p.id}
                    reactions={p.reactions || []}
                    user={user}
                    onReactionUpdate={() => loadPosts(true)}
                  />
                  <ShareButton
                    url={`${window.location.origin}/post/${p._id || p.id}`}
                    title={p.content?.substring(0, 100) || 'Check out this post'}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          // Skeleton Loader
          Array.from({ length: 3 }).map((_, i) => (
            <div className="card" key={`skeleton-${i}`} style={{ opacity: 0.7 }}>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#374151' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '30%', height: 14, background: '#374151', marginBottom: 6, borderRadius: 4 }} />
                  <div style={{ width: '20%', height: 12, background: '#374151', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ width: '100%', height: 60, background: '#374151', borderRadius: 4 }} />
            </div>
          ))
        )}

        {!hasMore && posts.length > 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>No more posts</div>
        )}
      </div>
    </div >
  );
}
