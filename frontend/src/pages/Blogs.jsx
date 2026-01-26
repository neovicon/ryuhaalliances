import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../store/auth';

export default function Blogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isModeratorOrAdmin = user && (user.role === 'moderator' || user.role === 'admin');

  useEffect(() => {
    loadBlogs();
  }, []);

  async function loadBlogs() {
    try {
      setLoading(true);
      const { data } = await client.get('/blogs');
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
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
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBlog = async () => {
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

      await client.post('/blogs', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ title: '', content: '', image: null });
      setImagePreview(null);
      setShowCreateModal(false);
      await loadBlogs();
    } catch (error) {
      console.error('Error creating blog:', error);
      alert(getErrorMessage(error, 'Failed to create blog'));
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateBlog = async () => {
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

      await client.put(`/blogs/${editingBlog.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ title: '', content: '', image: null });
      setImagePreview(null);
      setEditingBlog(null);
      await loadBlogs();
    } catch (error) {
      console.error('Error updating blog:', error);
      alert(getErrorMessage(error, 'Failed to update blog'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      await client.delete(`/blogs/${blogId}`);
      await loadBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert(getErrorMessage(error, 'Failed to delete blog'));
    }
  };

  const startEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      image: null
    });
    setImagePreview(blog.imageUrl || null);
  };

  const cancelEdit = () => {
    setEditingBlog(null);
    setFormData({ title: '', content: '', image: null });
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading blogs...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="hdr">Blogs</h2>
        {isModeratorOrAdmin && (
          <button className="btn" onClick={() => setShowCreateModal(true)}>
            Create Blog
          </button>
        )}
      </div>

      {blogs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          No blogs yet. {isModeratorOrAdmin && 'Create one to get started!'}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {blogs.map(blog => (
            <div key={blog.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/blogs/${blog.id}`)}>
              {blog.imageUrl && (
                <img
                  src={blog.imageUrl}
                  alt={blog.title}
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
                  {blog.title}
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
                  {blog.content}
                </div>
                <div style={{
                  borderTop: '1px solid #1f2937',
                  paddingTop: '0.75rem',
                  marginTop: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--muted)'
                }}>
                  {blog.createdAt && (
                    <div>{new Date(blog.createdAt).toLocaleDateString()}</div>
                  )}
                </div>
                {isModeratorOrAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn"
                      onClick={() => startEdit(blog)}
                      style={{ flex: 1, fontSize: '0.9rem' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleDeleteBlog(blog.id)}
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
            <h4 className="hdr" style={{ marginBottom: '1rem' }}>Create Blog</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                className="input"
                placeholder="Blog Title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Blog Content"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                style={{ minHeight: 150, resize: 'vertical' }}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Blog Image (optional)
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
                    setFormData({ title: '', content: '', image: null });
                    setImagePreview(null);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleCreateBlog}
                  disabled={uploading || !formData.title.trim() || !formData.content.trim()}
                >
                  {uploading ? 'Creating...' : 'Create Blog'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBlog && (
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
            <h4 className="hdr" style={{ marginBottom: '1rem' }}>Edit Blog</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                className="input"
                placeholder="Blog Title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Blog Content"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                style={{ minHeight: 150, resize: 'vertical' }}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Blog Image (optional - leave empty to keep current)
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
                  onClick={handleUpdateBlog}
                  disabled={uploading || !formData.title.trim() || !formData.content.trim()}
                >
                  {uploading ? 'Updating...' : 'Update Blog'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
