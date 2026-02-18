import { useState } from 'react';
import { useAuth } from '../store/auth';
import client from '../api/client';

export default function EntryCard({ entry, onUpdate, onEdit, onDelete }) {
    const { user } = useAuth();
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [visitorReacted, setVisitorReacted] = useState({ heart: false, laugh: false, thumbsUp: false });
    const [reacting, setReacting] = useState(false);

    const isVisitor = !user;

    // Registered user reaction logic
    const userReaction = user ? (entry.reactions || []).find(r => r.user === user._id) : null;

    async function handleReaction(type) {
        if (reacting) return;
        if (isVisitor && visitorReacted[type]) return;
        try {
            setReacting(true);
            if (isVisitor) {
                await client.post(`/event-entries/${entry._id}/react`, { type, isVisitor: true });
                setVisitorReacted(prev => ({ ...prev, [type]: true }));
                onUpdate();
            } else {
                await client.post(`/event-entries/${entry._id}/react`, { type, isVisitor: false });
                onUpdate();
            }
        } catch (error) {
            console.error('Reaction failed:', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Reaction failed: ${msg}`);
        } finally {
            setReacting(false);
        }
    }

    async function handleCommentSubmit(e) {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            setSubmittingComment(true);
            await client.post(`/event-entries/${entry._id}/comment`, { content: comment });
            setComment('');
            onUpdate();
        } catch (error) {
            console.error('Comment failed:', error);
        } finally {
            setSubmittingComment(false);
        }
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Media Section */}
            <div style={{ position: 'relative', width: '100%', backgroundColor: '#000' }}>
                {entry.mediaType === 'video' ? (
                    <video
                        src={entry.mediaUrl}
                        controls
                        style={{ width: '100%', maxHeight: '500px', display: 'block' }}
                    />
                ) : entry.mediaType === 'audio' ? (
                    <div style={{ width: '100%', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
                        <audio
                            src={entry.mediaUrl}
                            controls
                            style={{ width: '100%' }}
                        />
                    </div>
                ) : (
                    <img
                        src={entry.mediaUrl}
                        alt={entry.memberName}
                        style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain', display: 'block' }}
                    />
                )}
            </div>

            {/* Content Section */}
            <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className="hdr" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{entry.memberName}</h3>
                    {user?.role === 'admin' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => onEdit(entry)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--muted)'
                                }}
                                title="Edit"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => onDelete(entry._id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#ef4444'
                                }}
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </div>
                    )}
                </div>
                {entry.description && (
                    <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>
                        {entry.description}
                    </p>
                )}

                {/* Reactions Bar */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem 0',
                    borderTop: '1px solid rgba(148,163,184,0.1)',
                    borderBottom: '1px solid rgba(148,163,184,0.1)',
                    marginBottom: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    {isVisitor ? (
                        <>
                            <button
                                onClick={() => handleReaction('heart')}
                                disabled={visitorReacted.heart || reacting}
                                className="btn-reaction"
                                style={{ opacity: visitorReacted.heart || reacting ? 0.5 : 1 }}
                            >
                                ❤️ <span style={{ marginLeft: 4 }}>{entry.visitorReactions?.heart || 0}</span>
                            </button>
                            <button
                                onClick={() => handleReaction('laugh')}
                                disabled={visitorReacted.laugh || reacting}
                                className="btn-reaction"
                                style={{ opacity: visitorReacted.laugh || reacting ? 0.5 : 1 }}
                            >
                                😂 <span style={{ marginLeft: 4 }}>{entry.visitorReactions?.laugh || 0}</span>
                            </button>
                            <button
                                onClick={() => handleReaction('thumbsUp')}
                                disabled={visitorReacted.thumbsUp || reacting}
                                className="btn-reaction"
                                style={{ opacity: visitorReacted.thumbsUp || reacting ? 0.5 : 1 }}
                            >
                                👍 <span style={{ marginLeft: 4 }}>{entry.visitorReactions?.thumbsUp || 0}</span>
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>React:</span>
                            {['🔥', '❤️', '👏', '😂', '😮'].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    disabled={reacting}
                                    style={{
                                        background: userReaction?.type === emoji ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        border: userReaction?.type === emoji ? '1px solid var(--primary)' : '1px solid transparent',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        cursor: reacting ? 'not-allowed' : 'pointer',
                                        fontSize: '1.2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        opacity: reacting ? 0.5 : 1
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                <div>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        💬 {entry.comments?.length || 0} Comments {showComments ? '▼' : '▶'}
                    </button>

                    {showComments && (
                        <div style={{ marginTop: '1rem', animation: 'fadeIn 0.3s ease' }}>
                            {entry.comments?.map((c, i) => (
                                <div key={i} style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: c.user?.photoUrl ? `url(${c.user.photoUrl}) center/cover` : '#333',
                                        flexShrink: 0
                                    }} />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 2 }}>{c.user?.username || 'Unknown'}</div>
                                        <div style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                                    </div>
                                </div>
                            ))}

                            {!isVisitor && (
                                <form onSubmit={handleCommentSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        style={{
                                            flex: 1,
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(148,163,184,0.2)',
                                            borderRadius: '20px',
                                            padding: '0.5rem 1rem',
                                            color: '#fff',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !comment.trim()}
                                        style={{
                                            background: 'var(--primary)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '20px',
                                            padding: '0.5rem 1rem',
                                            cursor: 'pointer',
                                            opacity: submittingComment || !comment.trim() ? 0.5 : 1
                                        }}
                                    >
                                        Send
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
        .btn-reaction {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 0.4rem 0.8rem;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .btn-reaction:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
        </div>
    );
}
