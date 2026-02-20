import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';
import EntryCard from '../components/EntryCard';

export default function EventSpecificEntries() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            setLoading(true);
            const [eventRes, entriesRes] = await Promise.all([
                client.get(`/events/${id}`),
                client.get('/event-entries', { params: { eventId: id } })
            ]);
            setEvent(eventRes.data.event);
            setEntries(entriesRes.data || []);
        } catch (error) {
            console.error('Error loading event entries:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy link:', err);
        });
    };

    if (loading && !event) {
        return <div className="container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>;
    }

    if (!event) {
        return (
            <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
                <h3 className="hdr">Event not found</h3>
                <button className="btn" onClick={() => navigate('/events')} style={{ marginTop: '1rem' }}>Back to Events</button>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem', minHeight: '80vh' }}>
            <div style={{ marginBottom: '2rem' }}>
                <button
                    className="btn"
                    onClick={() => navigate('/events')}
                    style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)', marginBottom: '1.5rem' }}
                >
                    ← Back to Events
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="hdr" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{event.title}</h1>
                        <p style={{ color: 'var(--muted)', maxWidth: '800px' }}>{event.description}</p>
                    </div>
                    <button
                        className="btn"
                        onClick={handleShare}
                        style={{ background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span>🔗</span> Share Event Entries
                    </button>
                </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '2rem' }}>
                <h2 className="hdr" style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Submissions</h2>

                {entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                        <h3>No entries found</h3>
                        <p>Be the first to participate in this event!</p>
                    </div>
                ) : (
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                        {entries.map(entry => (
                            <EntryCard
                                key={entry._id}
                                entry={entry}
                                onUpdate={loadData}
                            // onEdit/onDelete only for admin/moderator and usually done on the main EventEntries page
                            // but we can add them here too if needed
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
