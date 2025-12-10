import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', image: null, inactive: false });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isModeratorOrAdmin = user && (user.role === 'moderator' || user.role === 'admin');

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const { data } = await client.get('/events');
      setEvents(data.events);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (30MB = 30 * 1024 * 1024 bytes)
      const maxSize = 30 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File is too large, only 30MB is accepted');
        e.target.value = ''; // Clear the input
        return;
      }
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Title and description are required');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('inactive', formData.inactive);
      if (formData.image) {
        form.append('image', formData.image);
      }

      await client.post('/events', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ title: '', description: '', image: null, inactive: false });
      setImagePreview(null);
      setShowCreateModal(false);
      await loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error?.response?.data?.error || 'Failed to create event');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Title and description are required');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('inactive', formData.inactive);
      if (formData.image) {
        form.append('image', formData.image);
      }

      await client.put(`/events/${editingEvent.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ title: '', description: '', image: null, inactive: false });
      setImagePreview(null);
      setEditingEvent(null);
      await loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      alert(error?.response?.data?.error || 'Failed to update event');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await client.delete(`/events/${eventId}`);
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error?.response?.data?.error || 'Failed to delete event');
    }
  };

  const startEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      inactive: event.inactive || false,
      image: null
    });
    setImagePreview(event.imageUrl || null);
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setFormData({ title: '', description: '', image: null, inactive: false });
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading events...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="hdr">Events</h2>
        {isModeratorOrAdmin && (
          <button className="btn" onClick={() => setShowCreateModal(true)}>
            Create Event
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          No events yet. {isModeratorOrAdmin && 'Create one to get started!'}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {events.map(event => (
            <div key={event.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/events/${event.id}`)}>
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
              <div style={{ padding: '1.5rem' }}>
                <h3 className="hdr" style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
                  {event.title}
                </h3>
                <div style={{
                  color: 'var(--muted)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  lineHeight: '1.6',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {event.description}
                </div>
                <div style={{
                  borderTop: '1px solid #1f2937',
                  paddingTop: '0.75rem',
                  marginTop: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--muted)'
                }}>
                  {event.createdAt && (
                    <div>{new Date(event.createdAt).toLocaleDateString()}</div>
                  )}
                </div>
                {isModeratorOrAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn"
                      onClick={() => startEdit(event)}
                      style={{ flex: 1, fontSize: '0.9rem' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleDeleteEvent(event.id)}
                      style={{
                        flex: 1,
                        fontSize: '0.9rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h4 className="hdr" style={{ marginBottom: '1rem' }}>Create Event</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                className="input"
                placeholder="Event Title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Event Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ minHeight: 150, resize: 'vertical' }}
              />

              {user?.role === 'admin' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="create-inactive"
                    checked={formData.inactive}
                    onChange={e => setFormData({ ...formData, inactive: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="create-inactive" style={{ color: 'var(--text)', cursor: 'pointer' }}>
                    Mark as Inactive
                  </label>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Event Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ marginBottom: '0.5rem' }}
                />
                {imagePreview && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: '8px',
                        border: '1px solid rgba(148,163,184,0.2)'
                      }}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', description: '', image: null, inactive: false });
                    setImagePreview(null);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleCreateEvent}
                  disabled={uploading || !formData.title.trim() || !formData.description.trim()}
                >
                  {uploading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h4 className="hdr" style={{ marginBottom: '1rem' }}>Edit Event</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                className="input"
                placeholder="Event Title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Event Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ minHeight: 150, resize: 'vertical' }}
              />

              {user?.role === 'admin' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="edit-inactive"
                    checked={formData.inactive}
                    onChange={e => setFormData({ ...formData, inactive: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="edit-inactive" style={{ color: 'var(--text)', cursor: 'pointer' }}>
                    Mark as Inactive
                  </label>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Event Image (optional - leave empty to keep current)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ marginBottom: '0.5rem' }}
                />
                {imagePreview && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: '8px',
                        border: '1px solid rgba(148,163,184,0.2)'
                      }}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn"
                  onClick={cancelEdit}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleUpdateEvent}
                  disabled={uploading || !formData.title.trim() || !formData.description.trim()}
                >
                  {uploading ? 'Updating...' : 'Update Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
