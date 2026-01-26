import { useState } from 'react';
import client from '../api/client';

const REACTION_EMOJIS = [
    { key: 'like', emoji: '👍', label: 'Like' },
    { key: 'love', emoji: '❤️', label: 'Love' },
    { key: 'fire', emoji: '🔥', label: 'Fire' },
    { key: 'clap', emoji: '👏', label: 'Clap' },
    { key: 'thinking', emoji: '🤔', label: 'Thinking' },
];

export default function Reactions({ contentType, contentId, reactions = [], user, onReactionUpdate }) {
    const [reacting, setReacting] = useState(false);

    const handleReact = async (key) => {
        if (!user || reacting) return;

        setReacting(true);
        try {
            const endpoint = `/${contentType}/${contentId}/react`;
            await client.post(endpoint, { key });

            // Call the callback to refresh the content
            if (onReactionUpdate) {
                await onReactionUpdate();
            }
        } catch (error) {
            console.error('Error reacting:', error);
            alert('Failed to react. Please try again.');
        } finally {
            setReacting(false);
        }
    };

    const getUserReaction = () => {
        if (!user) return null;
        for (const reaction of reactions) {
            if (reaction.userIds && reaction.userIds.some(id => String(id) === String(user.id || user._id))) {
                return reaction.key;
            }
        }
        return null;
    };

    const userReaction = getUserReaction();

    return (
        <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            padding: '0.75rem 0'
        }}>
            {REACTION_EMOJIS.map(({ key, emoji, label }) => {
                const reaction = reactions.find(r => r.key === key);
                const count = reaction?.userIds?.length || 0;
                const isActive = userReaction === key;

                return (
                    <button
                        key={key}
                        onClick={() => handleReact(key)}
                        disabled={!user || reacting}
                        title={user ? label : 'Sign in to react'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '20px',
                            border: isActive ? '2px solid var(--primary)' : '1px solid rgba(148,163,184,0.3)',
                            background: isActive ? 'rgba(177, 15, 46, 0.1)' : 'rgba(255,255,255,0.02)',
                            color: isActive ? 'var(--primary)' : 'var(--text)',
                            fontSize: '0.9rem',
                            cursor: user ? 'pointer' : 'not-allowed',
                            opacity: !user ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        }}
                        onMouseEnter={(e) => {
                            if (user) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.background = isActive ? 'rgba(177, 15, 46, 0.2)' : 'rgba(255,255,255,0.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1)';
                            e.currentTarget.style.background = isActive ? 'rgba(177, 15, 46, 0.1)' : 'rgba(255,255,255,0.02)';
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
                        {count > 0 && (
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: isActive ? '600' : '400',
                                minWidth: '1rem',
                                textAlign: 'center'
                            }}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
