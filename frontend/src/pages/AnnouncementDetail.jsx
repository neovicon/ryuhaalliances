import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';
import RichContent from '../components/RichContent';
import Reactions from '../components/Reactions';
import ShareButton from '../components/ShareButton';
import SEO from '../components/SEO';

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => { loadAnnouncement() }, [id]);

  async function loadAnnouncement() {
    try { setLoading(true); setError(null); const { data } = await client.get(`/announcements/${id}`); setAnnouncement(data.announcement); } catch (err) { console.error('Error loading announcement:', err); setError(err?.response?.data?.error || 'Failed to load announcement'); } finally { setLoading(false); }
  }

  const handleAddComment = async () => {
    if (!commentContent.trim() || !user) return;
    setSubmittingComment(true);
    try { await client.post(`/announcements/${id}/comments`, { content: commentContent.trim() }); setCommentContent(''); await loadAnnouncement(); } catch (err) { console.error('Error adding comment:', err); alert(err?.response?.data?.error || 'Failed to add comment'); } finally { setSubmittingComment(false); }
  };

  if (loading) return <div className="container" style={{ padding: '2rem 1rem' }}><div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading announcement...</div></div>;
  if (error || !announcement) return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
        {error || 'Announcement not found'}
        <div style={{ marginTop: '1rem' }}>
          <button className="btn" onClick={() => navigate('/announcements')}>Back to Announcements</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
      <SEO
        title={announcement.title}
        description={announcement.content?.substring(0, 200).replace(/<[^>]*>/g, '') || 'Read this announcement on Ryuha Alliance'}
        image={announcement.imageUrl}
        url={`/announcements/${id}`}
        type="article"
      />
      <button className="btn" onClick={() => navigate('/announcements')} style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}>← Back to Announcements</button>

      <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', padding: 0, overflow: 'hidden' }}>
        {announcement.imageUrl && (
          <div style={{ width: '100%', aspectRatio: '16 / 10', background: `url(${announcement.imageUrl}) center/cover no-repeat`, backgroundSize: 'cover', borderBottom: '1px solid rgba(148,163,184,0.12)' }} />
        )}
        <div style={{ padding: '2.5rem' }}>
          <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(177, 15, 46, 0.15)', border: '1px solid rgba(177, 15, 46, 0.3)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '1.5rem' }}>📢 ANNOUNCEMENT</div>
          <h1 className="hdr" style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: '1.2' }}>{announcement.title}</h1>
          <div style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
            {announcement.createdAt && <div>📅 {new Date(announcement.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>}
            {announcement.createdBy && <div>✍️ {announcement.createdBy?.displayName || announcement.createdBy?.username || 'Unknown'}</div>}
          </div>

          <div style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            <RichContent content={announcement.content} />
          </div>

          <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <Reactions
              contentType="announcements"
              contentId={announcement.id || announcement._id}
              reactions={announcement.reactions || []}
              user={user}
              onReactionUpdate={loadAnnouncement}
            />
            <ShareButton
              url={window.location.href}
              title={announcement.title}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)' }}>
        <h3 className="hdr" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Comments ({announcement.comments?.length || 0})</h3>

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

        {announcement.comments && announcement.comments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {announcement.comments.map((comment, idx) => (
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
