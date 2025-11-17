import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';

export default function Announcements() {
  const navigate = useNavigate();
  const { user, loadUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', image: null, isActive: true });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const isAdmin = user && user.role === 'admin';
  const showEmailVerification = user && !user.emailVerified;

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

  const handleSendVerificationCode = async () => {
    setVerificationLoading(true);
    setVerificationError('');
    try {
      await client.post('/auth/send-verification-code');
      setShowCodeInput(true);
    } catch (error) {
      setVerificationError(error?.response?.data?.error || 'Failed to send verification code');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Please enter a 6-digit code');
      return;
    }

    setVerificationLoading(true);
    setVerificationError('');
    try {
      const { data } = await client.post('/auth/verify-email-code', { code: verificationCode });
      setVerificationSuccess(true);
      await loadUser();
      setTimeout(() => {
        setShowCodeInput(false);
        setVerificationSuccess(false);
        setVerificationCode('');
      }, 2000);
    } catch (error) {
      setVerificationError(error?.response?.data?.error || 'Invalid verification code');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationLoading(true);
    setVerificationError('');
    try {
      await client.post('/auth/send-verification-code');
      setVerificationError('');
      alert('Verification code resent to your email');
    } catch (error) {
      setVerificationError(error?.response?.data?.error || 'Failed to resend verification code');
    } finally {
      setVerificationLoading(false);
    }
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

      {/* Email Verification Box */}
      {showEmailVerification && (
        <div className="card" style={{ 
          marginBottom: '1.5rem', 
          background: 'rgba(177, 15, 46, 0.1)',
          border: '1px solid rgba(177, 15, 46, 0.3)'
        }}>
          {!showCodeInput ? (
            <div>
              <h3 className="hdr" style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                📧 Email Verification
              </h3>
              <p style={{ marginBottom: '1rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                Would you like to get updates on your mail? Verify your email to receive announcements and important notifications.
              </p>
              <button
                className="btn"
                onClick={handleSendVerificationCode}
                disabled={verificationLoading}
                style={{ fontSize: '0.9rem' }}
              >
                {verificationLoading ? 'Sending...' : 'Yes, Verify Email'}
              </button>
              {verificationError && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: 'rgba(239, 68, 68, 1)', fontSize: '0.9rem' }}>
                  {verificationError}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="hdr" style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                Enter Verification Code
              </h3>
              <p style={{ marginBottom: '1rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                We've sent a 6-digit verification code to <strong>{user.email}</strong>. Please enter it below.
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setVerificationError('');
                  }}
                  style={{ 
                    fontSize: '1.2rem', 
                    textAlign: 'center', 
                    letterSpacing: '0.3rem',
                    fontFamily: 'monospace',
                    width: '100%',
                    maxWidth: '300px'
                  }}
                  maxLength={6}
                  disabled={verificationLoading || verificationSuccess}
                />
              </div>

              {verificationSuccess && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px', color: 'rgba(34, 197, 94, 1)', fontSize: '0.9rem' }}>
                  ✓ Email verified successfully!
                </div>
              )}

              {verificationError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: 'rgba(239, 68, 68, 1)', fontSize: '0.9rem' }}>
                  {verificationError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn"
                  onClick={() => {
                    setShowCodeInput(false);
                    setVerificationCode('');
                    setVerificationError('');
                    setVerificationSuccess(false);
                  }}
                  style={{ background: 'transparent', border: '1px solid #1f2937', fontSize: '0.9rem' }}
                  disabled={verificationLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleResendCode}
                  style={{ background: 'transparent', border: '1px solid #1f2937', fontSize: '0.9rem' }}
                  disabled={verificationLoading || verificationSuccess}
                >
                  Resend Code
                </button>
                <button
                  className="btn"
                  onClick={handleVerifyCode}
                  disabled={verificationLoading || verificationSuccess || verificationCode.length !== 6}
                  style={{ fontSize: '0.9rem' }}
                >
                  {verificationLoading ? 'Verifying...' : verificationSuccess ? 'Verified!' : 'Verify'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          No announcements yet. {isAdmin && 'Create one to get started!'}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {announcements.map(announcement => (
            <div key={announcement.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/announcements/${announcement.id}`)}>
              {announcement.imageUrl && (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 10',
                    background: `url(${announcement.imageUrl}) center/cover no-repeat`,
                    backgroundSize: 'cover',
                    borderBottom: '1px solid rgba(148,163,184,0.12)'
                  }}
                />
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
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 10',
                      background: `url(${imagePreview}) center/cover no-repeat`,
                      backgroundSize: 'cover',
                      borderRadius: '8px',
                      border: '1px solid rgba(148,163,184,0.2)'
                    }} />
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                      Recommended: 3088x1890 (16:10 ratio)
                    </div>
                  </div>
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
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 10',
                      background: `url(${imagePreview}) center/cover no-repeat`,
                      backgroundSize: 'cover',
                      borderRadius: '8px',
                      border: '1px solid rgba(148,163,184,0.2)'
                    }} />
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                      Recommended: 3088x1890 (16:10 ratio)
                    </div>
                  </div>
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

