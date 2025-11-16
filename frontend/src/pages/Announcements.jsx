import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';

export default function Announcements() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', image: null, isActive: true });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    loadAnnouncements();
  }, [user]);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      // Admins see all announcements, others see only active
      const params = (user && user.role === 'admin') ? {} : { activeOnly: 'true' };
      const { data } = await client.get('/announcements', { params });
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('content', formData.content);
      if (formData.image) {
        form.append('image', formData.image);
      }

      await client.post('/announcements', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ title: '', content: '', image: null, isActive: true });
      setImagePreview(null);
      setShowCreateModal(false);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert(error?.response?.data?.error || 'Failed to create announcement');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('content', formData.content);
      form.append('isActive', formData.isActive);
      if (formData.image) {
        form.append('image', formData.image);
      }

      await client.put(`/announcements/${editingAnnouncement.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ title: '', content: '', image: null, isActive: true });
      setImagePreview(null);
      setEditingAnnouncement(null);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert(error?.response?.data?.error || 'Failed to update announcement');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await client.delete(`/announcements/${announcementId}`);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert(error?.response?.data?.error || 'Failed to delete announcement');
    }
  };

  const startEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      image: null,
      isActive: announcement.isActive
    });
    setImagePreview(announcement.imageUrl || null);
  };

  const cancelEdit = () => {
    setEditingAnnouncement(null);
    setFormData({ title: '', content: '', image: null, isActive: true });
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="hdr">Announcements</h2>
        {isAdmin && (
          <button className="btn" onClick={() => setShowCreateModal(true)}>
            Create Announcement
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          No announcements yet. {isAdmin && 'Create one to get started!'}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {announcements.map(announcement => (
            <div key={announcement.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/announcements/${announcement.id}`)}>
              {announcement.imageUrl && (
                <div style={{
                  width: '100%',
                  height: 200,
                  background: `url(${announcement.imageUrl}) center/cover no-repeat`,
                  backgroundSize: 'cover'
                }} />
              )}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 className="hdr" style={{ margin: 0, fontSize: '1.25rem' }}>
                    {announcement.title}
                  </h3>
                  {isAdmin && !announcement.isActive && (
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', background: 'rgba(107, 114, 128, 0.2)', color: 'rgba(107, 114, 128, 1)' }}>
                      Inactive
                    </span>
                  )}
                </div>
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
                  {announcement.content}
                </div>
                <div style={{ 
                  borderTop: '1px solid #1f2937', 
                  paddingTop: '0.75rem', 
                  marginTop: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--muted)'
                }}>
                  {announcement.createdAt && (
                    <div>{new Date(announcement.createdAt).toLocaleDateString()}</div>
                  )}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn" 
                      onClick={() => startEdit(announcement)}
                      style={{ flex: 1, fontSize: '0.9rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn" 
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
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
            <h4 className="hdr" style={{ marginBottom: '1rem' }}>Create Announcement</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                className="input"
                placeholder="Announcement Title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Announcement Content"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                style={{ minHeight: 150, resize: 'vertical' }}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ marginBottom: '0.5rem' }}
                />
                {imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 200, 
                      borderRadius: '8px',
                      marginTop: '0.5rem'
                    }} 
                  />
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', content: '', image: null, isActive: true });
                    setImagePreview(null);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  className="btn" 
                  onClick={handleCreateAnnouncement}
                  disabled={uploading || !formData.title.trim() || !formData.content.trim()}
                >
                  {uploading ? 'Creating...' : 'Create Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAnnouncement && (
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
            <h4 className="hdr" style={{ marginBottom: '1rem' }}>Edit Announcement</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                className="input"
                placeholder="Announcement Title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Announcement Content"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                style={{ minHeight: 150, resize: 'vertical' }}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Image (optional - leave empty to keep current)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ marginBottom: '0.5rem' }}
                />
                {imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 200, 
                      borderRadius: '8px',
                      marginTop: '0.5rem'
                    }} 
                  />
                )}
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Active</span>
                </label>
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
                  onClick={handleUpdateAnnouncement}
                  disabled={uploading || !formData.title.trim() || !formData.content.trim()}
                >
                  {uploading ? 'Updating...' : 'Update Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

