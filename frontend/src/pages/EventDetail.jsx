import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../store/auth';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isModeratorOrAdmin = user && (user.role === 'moderator' || user.role === 'admin');

  useEffect(() => {
    loadEvent();
  }, [id]);

  async function loadEvent() {
    try {
      setLoading(true);
      setError(null);
      const { data } = await client.get(`/events/${id}`);
      setEvent(data.event);
    } catch (error) {
      console.error('Error loading event:', error);
      setError(getErrorMessage(error, 'Failed to load event'));
    } finally {
      setLoading(false);
    }
  }

  const handleAddComment = async () => {
    if (!commentContent.trim() || !user) return;

    setSubmittingComment(true);
    try {
      await client.post(`/events/${id}/comments`, { content: commentContent.trim() });
      setCommentContent('');
      await loadEvent();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(getErrorMessage(error, 'Failed to add comment'));
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          {error || 'Event not found'}
          <div style={{ marginTop: '1rem' }}>
            <button className="btn" onClick={() => navigate('/events')}>
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <button
        className="btn"
        onClick={() => navigate('/events')}
        style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}
      >
        ← Back to Events
      </button>

      <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', padding: 0, overflow: 'hidden' }}>
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderBottom: '1px solid rgba(148,163,184,0.12)'
            }}
          />
        )}
        <div style={{ padding: '2rem' }}>
          <h1 className="hdr" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {event.title}
            {event.inactive && (
              <span style={{
                fontSize: '0.8rem',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: '600'
              }}>
                Inactive
              </span>
            )}
          </h1>
          <div style={{
            color: 'var(--muted)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {event.createdAt && (
              <div>Created: {new Date(event.createdAt).toLocaleDateString()}</div>
            )}
            {event.createdBy && (
              <div>By: {event.createdBy?.displayName || event.createdBy?.username || 'Unknown'}</div>
            )}
          </div>
          <div style={{
            color: 'var(--text)',
            fontSize: '1rem',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.8'
          }}>
            {event.description}
          </div>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)' }}>
        <h3 className="hdr" style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
          Comments ({event.comments?.length || 0})
        </h3>

        {user && (
          <div style={{ marginBottom: '1.5rem' }}>
            <textarea
              className="input"
              placeholder="Add a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value.slice(0, 1000))}
              style={{ minHeight: 100, resize: 'vertical', marginBottom: '0.5rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{commentContent.length}/1000</span>
              <button
                className="btn"
                onClick={handleAddComment}
                disabled={submittingComment || !commentContent.trim()}
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        )}

        {!user && (
          <div style={{
            padding: '1rem',
            background: 'rgba(148,163,184,0.1)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: 'var(--muted)'
          }}>
            Please sign in to comment
          </div>
        )}

        {event.comments && event.comments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {event.comments.map((comment, index) => (
              <div
                key={comment._id || index}
                style={{
                  border: '1px solid rgba(148,163,184,0.25)',
                  borderRadius: '12px',
                  padding: '1rem',
                  background: 'rgba(15,23,42,0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  {comment.author?.photoUrl ? (
                    <img
                      src={comment.author.photoUrl}
                      alt={comment.author.username}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), #8b0d26)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: '700',
                      }}
                    >
                      {comment.author?.username?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {comment.author?.displayName || comment.author?.username || 'Unknown'}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginLeft: '3.25rem' }}>
                  {comment.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}

