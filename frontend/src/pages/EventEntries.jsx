import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../store/auth';
import EntryCard from '../components/EntryCard';

export default function EventEntries() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        memberName: '',
        description: '',
        mediaType: 'image'
    });
    const [mediaFile, setMediaFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            loadEntries();
        } else {
            setEntries([]);
        }
    }, [selectedEventId]);

    async function loadEvents() {
        try {
            const { data } = await client.get('/events');
            setEvents(data.events || []);
            if (data.events && data.events.length > 0) {
                setSelectedEventId(data.events[0].id);
            }
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadEntries() {
        if (!selectedEventId) return;
        try {
            setLoading(true);
            const { data } = await client.get('/event-entries', {
                params: { eventId: selectedEventId }
            });
            setEntries(data || []);
        } catch (error) {
            console.error('Error loading entries:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e) {
        e.preventDefault();
        if (!selectedEventId) return;

        try {
            setUploading(true);
            console.log('Starting upload for event:', selectedEventId);
            console.log('Form data:', uploadForm);

            if (editingEntry) {
                console.log('Updating entry:', editingEntry._id);
                await client.put(`/event-entries/${editingEntry._id}`, {
                    memberName: uploadForm.memberName,
                    description: uploadForm.description
                });
            } else {
                if (!mediaFile) {
                    alert('Please select a file to upload');
                    return;
                }
                const formData = new FormData();
                formData.append('eventId', selectedEventId);
                formData.append('memberName', uploadForm.memberName);
                formData.append('description', uploadForm.description);
                formData.append('mediaType', uploadForm.mediaType);
                formData.append('media', mediaFile);

                console.log('Posting new entry...');
                const response = await client.post('/event-entries', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log('Upload successful:', response.data);
            }

            setShowUploadModal(false);
            setUploadForm({ memberName: '', description: '', mediaType: 'image' });
            setMediaFile(null);
            setEditingEntry(null);
            loadEntries();
            alert('Entry saved successfully!');
        } catch (error) {
            console.error('Operation failed:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to save entry: ${errorMsg}`);
        } finally {
            setUploading(false);
        }
    }

    async function handleDeleteEntry(entryId) {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            await client.delete(`/event-entries/${entryId}`);
            loadEntries();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete entry');
        }
    }

    function openEditModal(entry) {
        setEditingEntry(entry);
        setUploadForm({
            memberName: entry.memberName,
            description: entry.description || '',
            mediaType: entry.mediaType
        });
        setShowUploadModal(true);
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem', minHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="hdr" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Event Entries</h1>
                    <p style={{ color: 'var(--muted)' }}>Browse submissions from our community events</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#1e1e1e',
                            color: '#fff',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            outline: 'none',
                            minWidth: '200px',
                            flex: '1 1 auto'
                        }}
                    >
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {ev.title} {ev.inactive ? '(Inactive)' : ''}
                            </option>
                        ))}
                    </select>

                    {(user?.role === 'admin' || user?.role === 'moderator') && (
                        <button
                            className="btn"
                            onClick={() => {
                                setEditingEntry(null);
                                setUploadForm({ memberName: '', description: '', mediaType: 'image' });
                                setMediaFile(null);
                                setShowUploadModal(true);
                            }}
                            style={{ background: 'var(--primary)', border: 'none', whiteSpace: 'nowrap' }}
                        >
                            + Upload Entry
                        </button>
                    )}
                </div>
            </div>

            {loading && entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>Loading...</div>
            ) : entries.length === 0 ? (
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
                            onUpdate={loadEntries}
                            onEdit={openEditModal}
                            onDelete={handleDeleteEntry}
                        />
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem'
                }} onClick={() => setShowUploadModal(false)}>
                    <div style={{
                        background: '#1e1e1e', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px',
                        border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 className="hdr" style={{ marginBottom: '1.5rem' }}>
                            {editingEntry ? 'Edit Entry' : 'Upload Entry'}
                        </h3>

                        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Member Name</label>
                                <input
                                    type="text"
                                    required
                                    value={uploadForm.memberName}
                                    onChange={e => setUploadForm({ ...uploadForm, memberName: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: '#2d2d2d', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Description</label>
                                <textarea
                                    value={uploadForm.description}
                                    onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '0.75rem', background: '#2d2d2d', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                                />
                            </div>

                            {!editingEntry && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Media Type</label>
                                    <select
                                        value={uploadForm.mediaType}
                                        onChange={e => setUploadForm({ ...uploadForm, mediaType: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: '#2d2d2d', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                                    >
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                        <option value="audio">Audio (MP3)</option>
                                    </select>
                                </div>
                            )}

                            {!editingEntry && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>File</label>
                                    <input
                                        type="file"
                                        required
                                        accept={uploadForm.mediaType === 'video' ? 'video/*' : uploadForm.mediaType === 'audio' ? 'audio/*' : 'image/*'}
                                        onChange={e => setMediaFile(e.target.files[0])}
                                        style={{ width: '100%', padding: '0.5rem', background: '#2d2d2d', border: '1px solid #444', borderRadius: '6px', color: '#fff' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #444', color: '#ccc', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    style={{ flex: 1, padding: '0.75rem', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '6px', cursor: uploading ? 'not-allowed' : 'pointer' }}
                                >
                                    {uploading ? 'Saving...' : (editingEntry ? 'Update' : 'Upload')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
