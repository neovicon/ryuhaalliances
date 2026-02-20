import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../store/auth';

export default function Stories() {
  const navigate = useNavigate();
  const { user, loadUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', image: null, isActive: true });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isVigil = user && (user.role === 'admin' || (user.role === 'moderator' && user.moderatorType === 'Vigil'));
  const isUser = !!user;

  useEffect(() => {
    loadItems();
  }, [user]);

  async function loadItems() {
    try {
      setLoading(true);
      const params = isVigil ? {} : { activeOnly: 'true' };
      const { data } = await client.get('/stories', { params });
      setItems(data.stories || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 30 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File is too large, only 30MB is accepted');
        e.target.value = '';
        return;
      }
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
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
      if (formData.image) form.append('image', formData.image);
      await client.post('/stories', form);
      setFormData({ title: '', content: '', image: null, isActive: true });
      setImagePreview(null);
      setShowCreateModal(false);
      await loadItems();
    } catch (err) {
      console.error('Error creating story:', err);
      alert(getErrorMessage(err, 'Failed to create story'));
    } finally { setUploading(false); }
  };

  const handleUpdate = async () => {
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
      if (formData.image) form.append('image', formData.image);
      await client.put(`/stories/${editingItem.id}`, form);
      setFormData({ title: '', content: '', image: null, isActive: true });
      setImagePreview(null);
      setEditingItem(null);
      await loadItems();
    } catch (err) {
      console.error('Error updating story:', err);
      alert(getErrorMessage(err, 'Failed to update story'));
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    try {
      await client.delete(`/stories/${id}`);
      await loadItems();
    } catch (err) {
      console.error('Error deleting story:', err);
      alert(getErrorMessage(err, 'Failed to delete story'));
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({ title: item.title, content: item.content, image: null, isActive: item.isActive });
    setImagePreview(item.imageUrl || null);
    setShowCreateModal(true);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setFormData({ title: '', content: '', image: null, isActive: true });
    setImagePreview(null);
    setShowCreateModal(false);
  };


  if (loading) return <div className="container" style={{ padding: '2rem 1rem' }}><div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading stories...</div></div>;

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="hdr">Stories</h2>
        {isVigil && (
          <button className="btn" onClick={() => { setShowCreateModal(true); setEditingItem(null); }}>
            Create Story
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>No stories yet.</div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/stories/${item.id}`)}>
              {item.imageUrl && (
                <div style={{ width: '100%', aspectRatio: '16 / 10', background: `url(${item.imageUrl}) center/cover no-repeat`, backgroundSize: 'cover', borderBottom: '1px solid rgba(148,163,184,0.12)' }} />
              )}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 className="hdr" style={{ margin: 0, fontSize: '1.25rem' }}>{item.title}</h3>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.content}</div>
                <div style={{ borderTop: '1px solid #1f2937', paddingTop: '0.75rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--muted)' }}>{item.createdAt && <div>{new Date(item.createdAt).toLocaleDateString()}</div>}</div>
                {isVigil && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn" onClick={() => startEdit(item)} style={{ flex: 1 }}>Edit</button>
                    <button className="btn" onClick={() => handleDelete(item.id)} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h4 className="hdr" style={{ marginBottom: '1rem' }}>{editingItem ? 'Edit Story' : 'Create Story'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="input" placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              <textarea className="input" placeholder="Content" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} style={{ minHeight: 150, resize: 'vertical' }} />
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Image (optional)</label>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '0.5rem' }} />
                {imagePreview && (<div style={{ marginTop: '0.5rem' }}><div style={{ width: '100%', aspectRatio: '16 / 10', background: `url(${imagePreview}) center/cover no-repeat`, backgroundSize: 'cover', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.2)' }} /></div>)}
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Active</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={cancelEdit} disabled={uploading}>Cancel</button>
                <button className="btn" onClick={editingItem ? handleUpdate : handleCreate} disabled={uploading}>{uploading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentBox({ onSubmit, loading }) {
  const [text, setText] = useState('');
  return (
    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
      <input className="input" placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn" onClick={() => { onSubmit(text); setText(''); }} disabled={loading || !text.trim()}>{loading ? 'Posting...' : 'Post'}</button>
    </div>
  );
}
