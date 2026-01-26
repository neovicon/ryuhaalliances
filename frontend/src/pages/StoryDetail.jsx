import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../store/auth';
import RichContent from '../components/RichContent';
import Reactions from '../components/Reactions';
import ShareButton from '../components/ShareButton';
import SEO from '../components/SEO';

export default function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => { loadStory() }, [id]);

  async function loadStory() {
    try { setLoading(true); setError(null); const { data } = await client.get(`/stories/${id}`); setStory(data.story); } catch (err) { console.error('Error loading story:', err); setError(getErrorMessage(err, 'Failed to load story')); } finally { setLoading(false); }
  }

  const handleAddComment = async () => {
    if (!commentContent.trim() || !user) return;
    setSubmittingComment(true);
    try { await client.post(`/stories/${id}/comments`, { content: commentContent.trim() }); setCommentContent(''); await loadStory(); } catch (err) { console.error('Error adding comment:', err); alert(getErrorMessage(err, 'Failed to add comment')); } finally { setSubmittingComment(false); }
  };

  if (loading) return <div className="container" style={{ padding: '2rem 1rem' }}><div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading story...</div></div>;
  if (error || !story) return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
        {error || 'Story not found'}
        <div style={{ marginTop: '1rem' }}>
          <button className="btn" onClick={() => navigate('/stories')}>Back to Stories</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
      <SEO
        title={story.title}
        description={story.content?.substring(0, 200).replace(/<[^>]*>/g, '') || 'Read this story on Ryuha Alliance'}
        image={story.imageUrl}
        url={`/stories/${id}`}
        type="article"
      />
      <button className="btn" onClick={() => navigate('/stories')} style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}>← Back to Stories</button>

      <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', padding: 0, overflow: 'hidden' }}>
        {story.imageUrl && (
          <img
            src={story.imageUrl}
            alt={story.title}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderBottom: '1px solid rgba(148,163,184,0.12)'
            }}
          />
        )}
        <div style={{ padding: '2.5rem' }}>
          <h1 className="hdr" style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: '1.2' }}>{story.title}</h1>
          <div style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
            {story.createdAt && <div>📅 {new Date(story.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>}
            {story.createdBy && <div>✍️ {story.createdBy?.displayName || story.createdBy?.username || 'Unknown'}</div>}
          </div>

          <div style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            <RichContent content={story.content} />
          </div>

          {/* Reactions and Share */}
          <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <Reactions
              contentType="stories"
              contentId={story.id || story._id}
              reactions={story.reactions || []}
              user={user}
              onReactionUpdate={loadStory}
            />
            <ShareButton
              url={window.location.href}
              title={story.title}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)' }}>
        <h3 className="hdr" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Comments ({story.comments?.length || 0})</h3>

        {user && (
          <div style={{ marginBottom: '2rem' }}>
            <textarea className="input" placeholder="Add a comment..." value={commentContent} onChange={(e) => setCommentContent(e.target.value.slice(0, 1000))} style={{ minHeight: 100, resize: 'vertical', marginBottom: '0.75rem' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{commentContent.length}/1000</span>
              <button className="btn" onClick={handleAddComment} disabled={submittingComment || !commentContent.trim()}>{submittingComment ? 'Posting...' : 'Post Comment'}</button>
            </div>
          </div>
        )}

        {!user && (
          <div style={{ padding: '1.5rem', background: 'rgba(148,163,184,0.05)', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Please sign in to comment</div>
        )}

        {story.comments && story.comments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {story.comments.map((comment, idx) => (
              <div key={comment._id || idx} style={{ border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px', padding: '1.25rem', background: 'rgba(15,23,42,0.3)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15,23,42,0.4)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15,23,42,0.3)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {comment.author?.photoUrl ? (
                    <img src={comment.author.photoUrl} alt={comment.author.username} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(148,163,184,0.2)' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #8b0d26)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: '700', border: '2px solid rgba(148,163,184,0.2)' }}>{comment.author?.username?.[0]?.toUpperCase() || 'U'}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{comment.author?.displayName || comment.author?.username || 'Unknown'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</div>
                  </div>
                </div>
                <div style={{ fontSize: '1rem', lineHeight: 1.6, paddingLeft: '3.5rem' }}>
                  <RichContent content={comment.content} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem', fontSize: '1.05rem' }}>No comments yet. Be the first to share your thoughts!</div>
        )}
      </div>
    </div>
  );
}
