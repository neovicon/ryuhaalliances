import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';
import { getRankImageSrc, calculateRank } from '../utils/rank';

export default function Profile() {
  const { user: authUser, loadUser } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [file, setFile] = useState(null);
  const [pfpFile, setPfpFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPfp, setUploadingPfp] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  async function load() {
    setLoading(true);
    try {
      // First try to load user from auth store
      if (!authUser) {
        await loadUser();
      }
      
      // Then fetch fresh data from API
      const { data } = await client.get('/users/me');
      setMe(data.user);
    } catch (error) {
      console.error('Failed to load profile:', error);
      // If 401, redirect to login
      if (error?.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => { 
    // Check if we have a token, if not redirect to login
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    load(); 
  }, []);
  
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('heroCard', file);
      await client.post('/users/me/hero-card', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      await load();
    } catch (error) {
      console.error('Failed to upload hero card:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleHeroCardClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = (e) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    };
    input.click();
  };

  const handlePfpUpload = async () => {
    if (!pfpFile) return;
    setUploadingPfp(true);
    try {
      const form = new FormData();
      form.append('photo', pfpFile);
      await client.post('/users/me/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPfpFile(null);
      await load();
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
    } finally {
      setUploadingPfp(false);
    }
  };

  const handlePfpClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = (e) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setPfpFile(selectedFile);
      }
    };
    input.click();
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    setChangingPassword(true);
    try {
      await client.post('/users/me/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error) {
      setPasswordError(error?.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading profile...</div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="hdr" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Profile</h2>
        <p style={{ color: 'var(--muted)' }}>Manage your account information and preferences</p>
      </div>

      {/* Status Banner */}
      {me.status === 'pending' && (
        <div className="card" style={{ 
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>⏳</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Your account is pending approval</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Your account is waiting for admin approval. You will be able to access all features once approved.
                {me.adminMessage && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                    <strong>Admin Message:</strong> {me.adminMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {me.status === 'declined' && (
        <div className="card" style={{ 
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>❌</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Your account has been declined</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {me.adminMessage ? (
                  <div>
                    <strong>Reason:</strong> {me.adminMessage}
                  </div>
                ) : (
                  'Your account request has been declined. Please contact an administrator for more information.'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Card Section */}
      <div className="card" style={{ 
        padding: 0,
        marginBottom: '1.5rem',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        border: '2px solid rgba(177,15,46,0.2)'
      }}
      onClick={handleHeroCardClick}
      onMouseEnter={(e) => {
        if (!uploading) {
          e.currentTarget.style.borderColor = 'rgba(177,15,46,0.5)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(177,15,46,0.2)';
      }}
      >
        {me.heroCardUrl ? (
          <img 
            src={me.heroCardUrl} 
            alt={`${me.username}'s hero card`}
            style={{
              width: '100%',
              aspectRatio: '16/9',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          background: 'linear-gradient(135deg, rgba(177,15,46,0.3) 0%, rgba(177,15,46,0.1) 100%)',
          display: me.heroCardUrl ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          color: 'var(--muted)'
        }}>
          <div style={{ fontSize: '3rem' }}>🛡️</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Click to upload hero card</div>
          <div style={{ fontSize: '0.9rem' }}>16:9 ratio recommended</div>
        </div>
        {uploading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            Uploading...
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(177,15,46,0.1) 0%, rgba(177,15,46,0.05) 100%)',
        border: '1px solid rgba(177,15,46,0.2)',
        padding: '2rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar Section */}
          <div style={{ position: 'relative' }}>
            {me.photoUrl ? (
              <img 
                src={me.photoUrl} 
                alt={me.username}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: '4px solid rgba(177,15,46,0.3)',
                  boxShadow: '0 8px 24px rgba(177,15,46,0.2)',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, #8b0d26 100%)',
              border: '4px solid rgba(177,15,46,0.3)',
              boxShadow: '0 8px 24px rgba(177,15,46,0.2)',
              display: me.photoUrl ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              color: 'white',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {me.username?.[0] || 'U'}
            </div>
            <button
              className="btn"
              onClick={handlePfpClick}
              disabled={uploadingPfp}
              style={{
                marginTop: '0.75rem',
                width: '100%',
                fontSize: '0.9rem',
                padding: '0.5rem',
                opacity: uploadingPfp ? 0.6 : 1,
                cursor: uploadingPfp ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadingPfp ? 'Uploading...' : 'Change PFP'}
            </button>
          </div>

          {/* User Info Section */}
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 className="hdr" style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>
                {me.displayName || me.username}
              </h3>
              <div style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                @{me.username}
              </div>
              {me.email && (
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  {me.email}
                </div>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1.5rem', 
              flexWrap: 'wrap',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Rank</div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <img 
                    src={getRankImageSrc(me.rank || calculateRank(me.points || 0))}
                    alt={me.rank || calculateRank(me.points || 0)}
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.target.style.display = 'none';
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      objectFit: 'contain'
                    }}
                  />
                  <div style={{ 
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {me.rank || calculateRank(me.points || 0)}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Group</div>
                <div style={{ 
                  display: 'inline-block',
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(177,15,46,0.2)',
                  border: '1px solid rgba(177,15,46,0.4)',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  {me.group}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Points</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {me.points || 0}
                </div>
              </div>
              {me.sigil && (
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Sigil</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                    {me.sigil}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Details Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h4 className="hdr" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Account Details</h4>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Rank</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img 
                src={getRankImageSrc(me.rank || calculateRank(me.points || 0))}
                alt={me.rank || calculateRank(me.points || 0)}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                style={{
                  width: 24,
                  height: 24,
                  objectFit: 'contain'
                }}
              />
              <span style={{ fontSize: '1rem', fontWeight: '500' }}>
                {me.rank || calculateRank(me.points || 0)}
              </span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Username</div>
            <div style={{ fontSize: '1rem', fontWeight: '500' }}>{me.username}</div>
          </div>
          {me.displayName && (
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Display Name</div>
              <div style={{ fontSize: '1rem', fontWeight: '500' }}>{me.displayName}</div>
            </div>
          )}
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Group</div>
            <div style={{ fontSize: '1rem', fontWeight: '500' }}>{me.group}</div>
          </div>
          {me.sigil && (
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Sigil Code</div>
              <div style={{ fontSize: '1rem', fontWeight: '500' }}>{me.sigil}</div>
            </div>
          )}
          {me.createdAt && (
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Member Since</div>
              <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                {new Date(me.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Picture Upload Card */}
      {pfpFile && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h4 className="hdr" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Upload Profile Picture</h4>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Selected: <strong>{pfpFile.name}</strong>
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Profile pictures should be square format for best results. Supported formats: PNG, JPEG, WebP
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn" 
              onClick={handlePfpUpload}
              disabled={uploadingPfp}
              style={{ 
                opacity: uploadingPfp ? 0.6 : 1,
                cursor: uploadingPfp ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadingPfp ? 'Uploading...' : 'Upload Profile Picture'}
            </button>
            <button 
              className="btn" 
              onClick={() => {
                setPfpFile(null);
              }}
              disabled={uploadingPfp}
              style={{ 
                background: 'transparent',
                border: '1px solid #1f2937'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hero Card Upload Card */}
      {file && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h4 className="hdr" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Upload Hero Card</h4>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Selected: <strong>{file.name}</strong>
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Hero cards should be in 16:9 aspect ratio. Supported formats: PNG, JPEG, WebP
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn" 
              onClick={handleUpload}
              disabled={uploading}
              style={{ 
                opacity: uploading ? 0.6 : 1,
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Hero Card'}
            </button>
            <button 
              className="btn" 
              onClick={() => {
                setFile(null);
              }}
              disabled={uploading}
              style={{ 
                background: 'transparent',
                border: '1px solid #1f2937'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Change Password Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 className="hdr" style={{ margin: 0, fontSize: '1.25rem' }}>Change Password</h4>
          <button 
            className="btn" 
            onClick={() => {
              setShowPasswordChange(!showPasswordChange);
              setPasswordError(null);
              setPasswordSuccess(false);
              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }}
            style={{ 
              background: showPasswordChange ? 'transparent' : undefined,
              border: showPasswordChange ? '1px solid #1f2937' : undefined
            }}
          >
            {showPasswordChange ? 'Cancel' : 'Change Password'}
          </button>
        </div>
        
        {showPasswordChange && (
          <div>
            {passwordError && (
              <div style={{ 
                padding: '0.75rem', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '8px', 
                color: 'rgba(239, 68, 68, 1)',
                marginBottom: '1rem'
              }}>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div style={{ 
                padding: '0.75rem', 
                background: 'rgba(34, 197, 94, 0.1)', 
                border: '1px solid rgba(34, 197, 94, 0.3)', 
                borderRadius: '8px', 
                color: 'rgba(34, 197, 94, 1)',
                marginBottom: '1rem'
              }}>
                Password changed successfully!
              </div>
            )}
            <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Current Password
                </label>
                <input 
                  className="input"
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  New Password
                </label>
                <input 
                  className="input"
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Confirm New Password
                </label>
                <input 
                  className="input"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
              <button 
                className="btn" 
                onClick={handlePasswordChange}
                disabled={changingPassword}
                style={{ 
                  opacity: changingPassword ? 0.6 : 1,
                  cursor: changingPassword ? 'not-allowed' : 'pointer'
                }}
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
