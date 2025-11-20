import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => { loadArticle() }, [id]);

  async function loadArticle() {
    try {
      setLoading(true); setError(null);
      const { data } = await client.get(`/articles/${id}`);
      setArticle(data.article);
    } catch (err) {
      console.error('Error loading article:', err);
      setError(err?.response?.data?.error || 'Failed to load article');
    } finally { setLoading(false); }
  }

  const handleAddComment = async () => {
    if (!commentContent.trim() || !user) return;
    setSubmittingComment(true);
    try {
      await client.post(`/articles/${id}/comments`, { content: commentContent.trim() });
      setCommentContent('');
      await loadArticle();
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(err?.response?.data?.error || 'Failed to add comment');
    } finally { setSubmittingComment(false); }
  };

  if (loading) return <div className="container" style={{ padding: '2rem 1rem' }}><div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading article...</div></div>;
  if (error || !article) return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
        {error || 'Article not found'}
        <div style={{ marginTop: '1rem' }}>
          <button className="btn" onClick={() => navigate('/articles')}>Back to Articles</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <button className="btn" onClick={() => navigate('/articles')} style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}>← Back to Articles</button>

      <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', padding: 0, overflow: 'hidden' }}>
        {article.imageUrl && (
          <div style={{ width: '100%', aspectRatio: '16 / 10', background: `url(${article.imageUrl}) center/cover no-repeat`, backgroundSize: 'cover', borderBottom: '1px solid rgba(148,163,184,0.12)' }} />
        )}
        <div style={{ padding: '2rem' }}>
          <h1 className="hdr" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{article.title}</h1>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {article.createdAt && (<div>Created: {new Date(article.createdAt).toLocaleDateString()}</div>)}
            {article.createdBy && (<div>By: {article.createdBy?.displayName || article.createdBy?.username || 'Unknown'}</div>)}
          </div>
          <div style={{ color: 'var(--text)', fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{article.content}</div>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)' }}>
        <h3 className="hdr" style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Comments ({article.comments?.length || 0})</h3>

        {user && (
          <div style={{ marginBottom: '1.5rem' }}>
            <textarea className="input" placeholder="Add a comment..." value={commentContent} onChange={(e) => setCommentContent(e.target.value.slice(0,1000))} style={{ minHeight: 100, resize: 'vertical', marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{commentContent.length}/1000</span>
              <button className="btn" onClick={handleAddComment} disabled={submittingComment || !commentContent.trim()}>{submittingComment ? 'Posting...' : 'Post Comment'}</button>
            </div>
          </div>
        )}

        {!user && (
          <div style={{ padding: '1rem', background: 'rgba(148,163,184,0.1)', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>Please sign in to comment</div>
        )}

        {article.comments && article.comments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {article.comments.map((comment, idx) => (
              <div key={comment._id || idx} style={{ border: '1px solid rgba(148,163,184,0.25)', borderRadius: '12px', padding: '1rem', background: 'rgba(15,23,42,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  {comment.author?.photoUrl ? (
                    <img src={comment.author.photoUrl} alt={comment.author.username} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #8b0d26)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '700' }}>{comment.author?.username?.[0] || 'U'}</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{comment.author?.displayName || comment.author?.username || 'Unknown'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</div>
                  </div>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginLeft: '3.25rem' }}>{comment.content}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No comments yet. Be the first to comment!</div>
        )}
      </div>
    </div>
  );
}
