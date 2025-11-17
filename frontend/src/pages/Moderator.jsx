import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';

export default function Moderator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const moderatorType = user?.moderatorType;
  
  // Gatekeeper state
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  
  // Artisan & Arbiter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserFull, setSelectedUserFull] = useState(null); // Full user data with heroCardUrl and certificates
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingUserFull, setLoadingUserFull] = useState(false);
  
  // File upload states
  const [uploadingHeroCard, setUploadingHeroCard] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [uploadingWarning, setUploadingWarning] = useState(false);
  const [heroCardFile, setHeroCardFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [warningFile, setWarningFile] = useState(null);
  const [warningText, setWarningText] = useState('');

  useEffect(() => {
    if (moderatorType === 'Gatekeeper') {
      loadPendingUsers();
    }
  }, [moderatorType]);

  async function loadPendingUsers() {
    try {
      setLoadingPending(true);
      const { data } = await client.get('/admin/pending-users');
      setPendingUsers(data.users || []);
    } catch (error) {
      console.error('Error loading pending users:', error);
      alert(error?.response?.data?.error || 'Failed to load pending users');
    } finally {
      setLoadingPending(false);
    }
  }

  async function searchUsers() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoadingSearch(true);
      const { data } = await client.get('/users/search', { params: { q: searchQuery } });
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      alert(error?.response?.data?.error || 'Failed to search users');
    } finally {
      setLoadingSearch(false);
    }
  }

  async function loadUserFullProfile(userId) {
    try {
      setLoadingUserFull(true);
      // Use the public profile endpoint to get full user data
      const user = searchResults.find(u => (u.id || u._id) === userId);
      if (!user) return;
      
      // Try to get full profile using username or id
      const identifier = user.username || userId;
      const { data } = await client.get('/users/public/profile', { params: { identifier } });
      setSelectedUserFull(data.user);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If public profile fails, just use the search result data
      setSelectedUserFull(null);
    } finally {
      setLoadingUserFull(false);
    }
  }

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSelectedUserFull(null);
    setHeroCardFile(null);
    setCertificateFile(null);
    setWarningFile(null);
    setWarningText('');
    // Load full profile for Artisan to show existing heroCardUrl and certificates
    if (moderatorType === 'Artisan') {
      loadUserFullProfile(user.id || user._id);
    } else if (moderatorType === 'Arbiter') {
      loadUserFullProfile(user.id || user._id);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await client.post('/admin/approve-user', { userId });
      await loadPendingUsers();
      alert('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      alert(error?.response?.data?.error || 'Failed to approve user');
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user? This action cannot be undone.')) return;
    
    try {
      await client.delete(`/admin/user/${userId}`);
      setSearchResults(searchResults.filter(u => (u.id || u._id) !== userId));
      setSelectedUser(null);
      alert('User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      alert(error?.response?.data?.error || 'Failed to remove user');
    }
  };

  const handleUploadHeroCard = async () => {
    if (!selectedUser || !heroCardFile) return;
    
    setUploadingHeroCard(true);
    try {
      const form = new FormData();
      form.append('heroCard', heroCardFile);
      await client.post(`/users/${selectedUser.id || selectedUser._id}/hero-card`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Hero License updated successfully');
      setHeroCardFile(null);
      await searchUsers(); // Refresh search results
      if (selectedUser) {
        await loadUserFullProfile(selectedUser.id || selectedUser._id);
      }
    } catch (error) {
      console.error('Error uploading hero card:', error);
      alert(error?.response?.data?.error || 'Failed to upload hero license');
    } finally {
      setUploadingHeroCard(false);
    }
  };

  const handleUploadCertificate = async () => {
    if (!selectedUser || !certificateFile) return;
    
    setUploadingCertificate(true);
    try {
      const form = new FormData();
      form.append('certificate', certificateFile);
      await client.post(`/users/${selectedUser.id || selectedUser._id}/certificate`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Certificate uploaded successfully');
      setCertificateFile(null);
      await searchUsers(); // Refresh search results
      if (selectedUser) {
        await loadUserFullProfile(selectedUser.id || selectedUser._id);
      }
    } catch (error) {
      console.error('Error uploading certificate:', error);
      alert(error?.response?.data?.error || 'Failed to upload certificate');
    } finally {
      setUploadingCertificate(false);
    }
  };

  const handleUploadWarning = async () => {
    if (!selectedUser) return;
    if (!warningFile && !warningText.trim()) {
      alert('Please provide either warning text or warning image');
      return;
    }
    
    setUploadingWarning(true);
    try {
      const form = new FormData();
      if (warningFile) {
        form.append('warningNotice', warningFile);
      }
      if (warningText.trim()) {
        form.append('warningText', warningText.trim());
      }
      await client.post(`/users/${selectedUser.id || selectedUser._id}/warning-notice`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Warning notice updated successfully');
      setWarningFile(null);
      setWarningText('');
      await searchUsers(); // Refresh search results
      if (selectedUser) {
        await loadUserFullProfile(selectedUser.id || selectedUser._id);
      }
    } catch (error) {
      console.error('Error uploading warning notice:', error);
      alert(error?.response?.data?.error || 'Failed to upload warning notice');
    } finally {
      setUploadingWarning(false);
    }
  };

  if (!user || user.role !== 'moderator') {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 className="hdr">Access Denied</h2>
          <p style={{ color: 'var(--muted)' }}>You must be a moderator to access this page.</p>
        </div>
      </div>
    );
  }

  const getModeratorTitle = () => {
    const titles = {
      'Aesther': 'Event Manager',
      'Vigil': 'Content Moderator',
      'Artisan': 'Profile Manager',
      'Arbiter': 'Discipline Officer',
      'Overseer': 'Announcement Manager',
      'Gatekeeper': 'Membership Officer'
    };
    return titles[moderatorType] || 'Moderator';
  };

  const getModeratorDescription = () => {
    const descriptions = {
      'Aesther': 'Manage events and announcements for the alliance.',
      'Vigil': 'Manage announcements and blog posts.',
      'Artisan': 'Manage member profiles: update Hero Licenses and upload Certificates.',
      'Arbiter': 'Remove members and upload warning notices.',
      'Overseer': 'Manage announcements for the alliance.',
      'Gatekeeper': 'Approve new member applications.'
    };
    return descriptions[moderatorType] || 'Moderate content and manage members.';
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="hdr">{getModeratorTitle()}</h2>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>{getModeratorDescription()}</p>
        <div style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.85rem',
          fontWeight: 600,
          background: 'rgba(177, 15, 46, 0.2)',
          color: 'var(--primary)',
          marginTop: '0.5rem'
        }}>
          {moderatorType}
        </div>
      </div>

      {/* Aesther: Events & Announcements */}
      {(moderatorType === 'Aesther' || moderatorType === 'Overseer') && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="hdr" style={{ marginBottom: '1rem' }}>
            {moderatorType === 'Aesther' ? 'Events & Announcements' : 'Announcements'}
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => navigate('/events')}>
              Manage Events
            </button>
            <button className="btn" onClick={() => navigate('/announcements')}>
              Manage Announcements
            </button>
          </div>
        </div>
      )}

      {/* Vigil: Announcements & Blogs */}
      {moderatorType === 'Vigil' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="hdr" style={{ marginBottom: '1rem' }}>Content Management</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => navigate('/announcements')}>
              Manage Announcements
            </button>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Blog management is available through the API. Use the blog endpoints to manage blog posts.
            </div>
          </div>
        </div>
      )}

      {/* Gatekeeper: Approve Members */}
      {moderatorType === 'Gatekeeper' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="hdr" style={{ marginBottom: '1rem' }}>Pending Members</h3>
          {loadingPending ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
              Loading pending users...
            </div>
          ) : pendingUsers.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
              No pending users
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingUsers.map((u) => (
                <div
                  key={u.id || u._id}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {u.username} {u.displayName && `(${u.displayName})`}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {u.email} • {u.house}
                    </div>
                  </div>
                  <button
                    className="btn"
                    onClick={() => handleApproveUser(u.id || u._id)}
                    style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.4)'
                    }}
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Artisan: Manage Hero Licenses & Certificates */}
      {moderatorType === 'Artisan' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="hdr" style={{ marginBottom: '1rem' }}>Member Profile Management</h3>
          
          {/* Search Users */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                className="input"
                placeholder="Search by username, display name, or sigil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                style={{ flex: 1 }}
              />
              <button className="btn" onClick={searchUsers} disabled={loadingSearch}>
                {loadingSearch ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {searchResults.map((u) => (
                  <div
                    key={u.id || u._id}
                    className="card"
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      border: selectedUser?.id === u.id || selectedUser?._id === u._id
                        ? '2px solid var(--primary)'
                        : '1px solid #1f2937'
                    }}
                    onClick={() => handleUserSelect(u)}
                  >
                    <div style={{ fontWeight: 600 }}>{u.username} {u.displayName && `(${u.displayName})`}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{u.house}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected User Actions */}
            {selectedUser && (
              <div className="card" style={{ background: 'rgba(177, 15, 46, 0.05)' }}>
                <h4 style={{ marginBottom: '1rem' }}>Manage: {selectedUser.username}</h4>
                
                {loadingUserFull ? (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>
                    Loading user profile...
                  </div>
                ) : (
                  <>
                    {/* Current Hero License */}
                    {selectedUserFull?.heroCardUrl && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                          Current Hero License
                        </label>
                        <img
                          src={selectedUserFull.heroCardUrl}
                          alt="Hero License"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 300,
                            borderRadius: '8px',
                            border: '1px solid #1f2937',
                            marginBottom: '0.5rem'
                          }}
                        />
                      </div>
                    )}

                    {/* Hero License Upload */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        {selectedUserFull?.heroCardUrl ? 'Update Hero License' : 'Upload Hero License'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const maxSize = 30 * 1024 * 1024; // 30MB
                            if (file.size > maxSize) {
                              alert('File is too large, only 30MB is accepted');
                              e.target.value = '';
                              return;
                            }
                            setHeroCardFile(file);
                          } else {
                            setHeroCardFile(null);
                          }
                        }}
                        style={{ marginBottom: '0.5rem' }}
                      />
                      {heroCardFile && (
                        <button
                          className="btn"
                          onClick={handleUploadHeroCard}
                          disabled={uploadingHeroCard}
                          style={{ fontSize: '0.9rem' }}
                        >
                          {uploadingHeroCard ? 'Uploading...' : 'Upload Hero License'}
                        </button>
                      )}
                    </div>

                    {/* Current Certificates */}
                    {selectedUserFull?.certificates && selectedUserFull.certificates.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                          Current Certificates ({selectedUserFull.certificates.length})
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {selectedUserFull.certificates.map((cert, index) => (
                            <img
                              key={index}
                              src={cert}
                              alt={`Certificate ${index + 1}`}
                              style={{
                                maxWidth: '100%',
                                maxHeight: 200,
                                borderRadius: '8px',
                                border: '1px solid #1f2937'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certificate Upload */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Upload Certificate
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const maxSize = 30 * 1024 * 1024; // 30MB
                            if (file.size > maxSize) {
                              alert('File is too large, only 30MB is accepted');
                              e.target.value = '';
                              return;
                            }
                            setCertificateFile(file);
                          } else {
                            setCertificateFile(null);
                          }
                        }}
                        style={{ marginBottom: '0.5rem' }}
                      />
                      {certificateFile && (
                        <button
                          className="btn"
                          onClick={handleUploadCertificate}
                          disabled={uploadingCertificate}
                          style={{ fontSize: '0.9rem' }}
                        >
                          {uploadingCertificate ? 'Uploading...' : 'Upload Certificate'}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Arbiter: Remove Members & Upload Warnings */}
      {moderatorType === 'Arbiter' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="hdr" style={{ marginBottom: '1rem' }}>Member Discipline</h3>
          
          {/* Search Users */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                className="input"
                placeholder="Search by username, display name, or sigil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                style={{ flex: 1 }}
              />
              <button className="btn" onClick={searchUsers} disabled={loadingSearch}>
                {loadingSearch ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {searchResults.map((u) => (
                  <div
                    key={u.id || u._id}
                    className="card"
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      border: selectedUser?.id === u.id || selectedUser?._id === u._id
                        ? '2px solid var(--primary)'
                        : '1px solid #1f2937'
                    }}
                    onClick={() => handleUserSelect(u)}
                  >
                    <div style={{ fontWeight: 600 }}>{u.username} {u.displayName && `(${u.displayName})`}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{u.house}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected User Actions */}
            {selectedUser && (
              <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                <h4 style={{ marginBottom: '1rem' }}>Manage: {selectedUser.username}</h4>
                
                {loadingUserFull ? (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>
                    Loading user profile...
                  </div>
                ) : (
                  <>
                    {/* Current Warning Notice */}
                    {selectedUserFull?.warningNotice && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                          Current Warning Notice (Image)
                        </label>
                        <img
                          src={selectedUserFull.warningNotice}
                          alt="Warning Notice"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 300,
                            borderRadius: '8px',
                            border: '1px solid #1f2937',
                            marginBottom: '0.5rem'
                          }}
                        />
                      </div>
                    )}

                    {/* Current Warning Text */}
                    {selectedUserFull?.warningText && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                          Current Warning Text
                        </label>
                        <div style={{
                          padding: '0.75rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          color: 'var(--text)',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {selectedUserFull.warningText}
                        </div>
                      </div>
                    )}

                    {/* Warning Notice Text */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Warning Text
                      </label>
                      <textarea
                        className="input"
                        placeholder="Enter warning text..."
                        value={warningText}
                        onChange={(e) => setWarningText(e.target.value)}
                        style={{ minHeight: 100, resize: 'vertical', width: '100%' }}
                      />
                    </div>

                    {/* Warning Notice Image Upload */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Warning Notice Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const maxSize = 30 * 1024 * 1024; // 30MB
                            if (file.size > maxSize) {
                              alert('File is too large, only 30MB is accepted');
                              e.target.value = '';
                              return;
                            }
                            setWarningFile(file);
                          } else {
                            setWarningFile(null);
                          }
                        }}
                        style={{ marginBottom: '0.5rem' }}
                      />
                    </div>

                    {/* Submit Warning */}
                    {(warningFile || warningText.trim()) && (
                      <div style={{ marginBottom: '1rem' }}>
                        <button
                          className="btn"
                          onClick={handleUploadWarning}
                          disabled={uploadingWarning}
                          style={{ fontSize: '0.9rem' }}
                        >
                          {uploadingWarning ? 'Updating...' : 'Update Warning Notice'}
                        </button>
                      </div>
                    )}

                    {/* Remove User */}
                    <div>
                      <button
                        className="btn"
                        onClick={() => handleRemoveUser(selectedUser.id || selectedUser._id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        Remove Member
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

