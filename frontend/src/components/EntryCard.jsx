import { useState } from 'react';
import { useAuth } from '../store/auth';
import client from '../api/client';

export default function EntryCard({ entry, onUpdate, onEdit, onDelete }) {
    const { user } = useAuth();
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const [reacting, setReacting] = useState(false);

    // Reaction state from backend
    const [localActiveReaction, setLocalActiveReaction] = useState(entry.userActiveReaction || null);
    const [localReactionCounts, setLocalReactionCounts] = useState(entry.reactionCounts || {});

    async function handleReaction(type) {
        if (reacting) return;
        try {
            setReacting(true);

            // Optimistic update
            const oldReaction = localActiveReaction;
            const newReaction = oldReaction === type ? null : type;
            setLocalActiveReaction(newReaction);

            // Update local counts optimistically
            const newCounts = { ...localReactionCounts };
            if (oldReaction) newCounts[oldReaction] = Math.max(0, (newCounts[oldReaction] || 1) - 1);
            if (newReaction) newCounts[newReaction] = (newCounts[newReaction] || 0) + 1;
            setLocalReactionCounts(newCounts);

            const response = await client.post(`/event-entries/${entry._id}/react`, { type }, { withCredentials: true });

            // If the backend returns the updated entry, use its state
            if (response.data) {
                setLocalActiveReaction(response.data.userActiveReaction);
                setLocalReactionCounts(response.data.reactionCounts || {});
                onUpdate(); // Trigger parent refresh if needed, but local state is already updated
            }
        } catch (error) {
            console.error('Reaction failed:', error);
            // Revert optimistic update
            setLocalActiveReaction(entry.userActiveReaction || null);
            setLocalReactionCounts(entry.reactionCounts || {});
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
                    gap: '0.5rem',
                    padding: '1rem 0',
                    borderTop: '1px solid rgba(148,163,184,0.1)',
                    borderBottom: '1px solid rgba(148,163,184,0.1)',
                    marginBottom: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem', marginRight: '0.25rem' }}>React:</span>
                        {['🔥', '❤️', '👏', '😂', '😮'].map(emoji => {
                            const isActive = localActiveReaction === emoji;
                            const count = localReactionCounts[emoji] || 0;
                            return (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    disabled={reacting}
                                    title={count > 0 ? `${count} reaction${count !== 1 ? 's' : ''}` : ''}
                                    style={{
                                        background: isActive ? 'rgba(177,15,46,0.2)' : 'rgba(255,255,255,0.05)',
                                        border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '20px',
                                        padding: '0.3rem 0.6rem',
                                        cursor: reacting ? 'not-allowed' : 'pointer',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.15s',
                                        opacity: reacting ? 0.6 : 1,
                                        color: '#fff',
                                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                >
                                    {emoji}
                                    {count > 0 && (
                                        <span style={{ fontSize: '0.8rem', color: isActive ? 'var(--primary)' : 'var(--muted)' }}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
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
