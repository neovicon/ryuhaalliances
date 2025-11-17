import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';
import { getRankImageSrc, calculateRank } from '../utils/rank';

function getHouseImageSrc(houseName) {
  if (!houseName) return '/assets/pendragon.jpeg';
  const houseMap = {
    Pendragon: 'pendragon',
    Phantomhive: 'phantomhive',
    Tempest: 'tempest',
    Zoldyck: 'zoldyck',
    Fritz: 'fritz',
    Elric: 'elric',
    Dragneel: 'dragneel',
    Hellsing: 'hellsing',
    'Obsidian Order': 'obsidian_order',
    'Council of IV': 'counsil_of_iv',
    'Abyssal IV': 'abyssal_iv',
  };
  const fileName = houseMap[houseName] || houseName.toLowerCase().replace(/\s+/g, '_');
  return `../../assets/${fileName}.jpeg`;
}

export default function Profile() {
  const { user: authUser, loadUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q')?.trim() || '';
  });

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  const [heroFile, setHeroFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingHero, setDeletingHero] = useState(false);


  const viewerId = authUser?.id || authUser?._id;
  const profileId = profile?.id || profile?._id;
  const isSelf = Boolean(viewerId && profileId && String(viewerId) === String(profileId));

  const rankName = profile?.rank || calculateRank(profile?.points || 0);
  const memberStatusLabel = profile?.memberStatus || 'Not assigned';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  const detailRows = useMemo(() => {
    if (!profile) return [];
    let roleValue = profile.role ? profile.role[0].toUpperCase() + profile.role.slice(1) : 'User';
    if (profile.role === 'moderator' && profile.moderatorType) {
      roleValue = `${profile.moderatorType} (Moderator)`;
    }
    const rows = [
      { label: 'Role', value: roleValue },
      { label: 'House', value: profile.house },
      { label: 'Rank', value: rankName },
      { label: 'Points', value: profile.points ?? 0 },
      { label: 'Sigil', value: profile.sigil },
      { label: 'Member Status', value: memberStatusLabel },
      { label: 'Member Since', value: memberSince },
    ];
    return rows.filter((row) => row.value !== undefined && row.value !== null && row.value !== '');
  }, [profile, memberSince, rankName, memberStatusLabel]);

  useEffect(() => {
    if (!authUser && localStorage.getItem('token')) {
      loadUser();
    }
  }, [authUser, loadUser]);

  const loadPostsForIdentifier = useCallback(async (identifier) => {
    if (!identifier) {
      setPosts([]);
      return;
    }
    setPostsLoading(true);
    try {
      const { data } = await client.get(`/posts/user/${encodeURIComponent(identifier)}`);
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const loadSelfProfile = useCallback(async () => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      if (!authUser) {
        await loadUser();
      }
      const { data } = await client.get('/users/me');
      setProfile(data.user);
      setSearchTerm(data.user.username || '');
      await loadPostsForIdentifier(data.user.username || data.user.sigil || data.user.id);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
      setPosts([]);
      setProfileError(error?.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  }, [authUser, loadUser, loadPostsForIdentifier]);

  const loadPublicProfile = useCallback(async (identifier) => {
    const trimmed = identifier?.trim();
    if (!trimmed) return;
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const { data } = await client.get('/users/public/profile', { params: { identifier: trimmed } });
      const viewer = authUser?.id || authUser?._id;
      if (viewer && data.user.id && String(viewer) === String(data.user.id)) {
        await loadSelfProfile();
        navigate('/profile', { replace: true });
        return;
      }
      setProfile(data.user);
      setSearchTerm(trimmed);
      await loadPostsForIdentifier(data.user.username || trimmed);
    } catch (error) {
      console.error('Failed to load public profile:', error);
      setProfile(null);
      setPosts([]);
      setProfileError(error?.response?.data?.error || 'Profile not found');
    } finally {
      setLoadingProfile(false);
    }
  }, [authUser, loadPostsForIdentifier, loadSelfProfile, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const identifierParam = params.get('q')?.trim();
    if (identifierParam) {
      loadPublicProfile(identifierParam);
    } else if (authUser) {
      loadSelfProfile();
    } else {
      setProfile(null);
      setPosts([]);
      setProfileError(null);
    }
  }, [location.search, authUser, loadPublicProfile, loadSelfProfile]);

  const viewerIsAdminOrArbiter = authUser && (authUser.role === 'admin' || authUser.moderatorType === 'Arbiter');

  const handleRemoveWarning = async () => {
    if (!profile?.id) return;
    if (!confirm('Remove the warning notice for this member?')) return;
    try {
      await client.delete(`/users/${profile.id}/warning-notice`);
      // Reload the profile
      if (isSelf) await loadSelfProfile(); else await loadPublicProfile(profile.username || profile.sigil || profile.id);
    } catch (error) {
      console.error('Failed to remove warning:', error);
      alert(error?.response?.data?.error || 'Failed to remove warning');
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchTerm.trim();
    if (!value) {
      if (authUser) {
        navigate('/profile', { replace: true });
        loadSelfProfile();
      } else {
        setProfileError('Enter a sigil, username, or display name to search.');
      }
      return;
    }
    navigate(`/profile?q=${encodeURIComponent(value)}`);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setCreatingPost(true);
    try {
      await client.post('/posts', { content: newPostContent.trim() });
      setNewPostContent('');
      if (profile?.username) {
        await loadPostsForIdentifier(profile.username);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(error?.response?.data?.error || 'Failed to create post');
    } finally {
      setCreatingPost(false);
    }
  };

  const selectHeroFile = () => {
    if (!isSelf) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = (e) => {
      const selected = e.target.files?.[0];
      if (selected) {
        const maxSize = 30 * 1024 * 1024; // 30MB
        if (selected.size > maxSize) {
          alert('File is too large, only 30MB is accepted');
          input.value = '';
          return;
        }
        setHeroFile(selected);
      }
    };
    input.click();
  };

  const selectAvatarFile = () => {
    if (!isSelf) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = (e) => {
      const selected = e.target.files?.[0];
      if (selected) {
        const maxSize = 30 * 1024 * 1024; // 30MB
        if (selected.size > maxSize) {
          alert('File is too large, only 30MB is accepted');
          input.value = '';
          return;
        }
        setAvatarFile(selected);
      }
    };
    input.click();
  };

  const handleHeroUpload = async () => {
    if (!isSelf || !heroFile) return;
    setUploadingHero(true);
    try {
      const form = new FormData();
      form.append('heroCard', heroFile);
      await client.post('/users/me/hero-card', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setHeroFile(null);
      await loadSelfProfile();
    } catch (error) {
      console.error('Failed to upload hero card:', error);
      alert(error?.response?.data?.error || 'Failed to upload hero card');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!isSelf || !avatarFile) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('photo', avatarFile);
      await client.post('/users/me/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatarFile(null);
      await loadSelfProfile();
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      alert(error?.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteHero = async () => {
    if (!isSelf || !profile.heroCardUrl) return;
    if (!confirm('Are you sure you want to delete your hero license? This action cannot be undone.')) {
      return;
    }
    setDeletingHero(true);
    try {
      await client.delete('/users/me/hero-card');
      await loadSelfProfile();
    } catch (error) {
      console.error('Failed to delete hero license:', error);
      alert(error?.response?.data?.error || 'Failed to delete hero license');
    } finally {
      setDeletingHero(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem 3rem' }}>
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          padding: '1.75rem',
          border: '1px solid rgba(148,163,184,0.2)',
        }}
      >
        <h2 className="hdr" style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Find a Warrior</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
          Search by sigil code, username, or display name. Use the format <code>RA–########–###</code> for sigils.
        </p>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <input
            className="input"
            placeholder="RA–12345678–123, username, or display name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '1 1 260px' }}
          />
          <button className="btn" type="submit" style={{ flex: '0 0 auto' }}>
            Search
          </button>
          {authUser && (
            <button
              className="btn"
              type="button"
              onClick={() => {
                navigate('/profile', { replace: true });
                loadSelfProfile();
              }}
              style={{ flex: '0 0 auto', background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}
            >
              View my profile
            </button>
          )}
        </form>
        {profileError && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: 'rgba(239, 68, 68, 1)',
            }}
          >
            {profileError}
          </div>
        )}
      </div>

      {loadingProfile ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          Loading profile...
        </div>
      ) : !profile ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          Enter a sigil, username, or display name to view a profile.
        </div>
      ) : (
        <>
          {isSelf && profile.status === 'pending' && (
            <div
              className="card"
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                background: 'rgba(251, 191, 36, 0.1)',
              }}
            >
              <strong>Your account is pending approval.</strong> You will gain full access after an admin review.
              {profile.adminMessage && (
                <div style={{ marginTop: '0.5rem', color: 'var(--text)' }}><strong>Admin Message:</strong> {profile.adminMessage}</div>
              )}
            </div>
          )}

          {isSelf && profile.status === 'declined' && (
            <div
              className="card"
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
              }}
            >
              <strong>Your account was declined.</strong> Contact an administrator if you need more information.
              {profile.adminMessage && (
                <div style={{ marginTop: '0.5rem', color: 'var(--text)' }}><strong>Reason:</strong> {profile.adminMessage}</div>
              )}
            </div>
          )}

          {/* Warning notice (if any) */}
          { (profile.warningNotice || profile.warningText) && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid rgba(239,68,68,0.3)', background: 'linear-gradient(90deg, rgba(239,68,68,0.06), rgba(239,68,68,0.03))' }}>
                <div className="warning-notice-inner" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {profile.warningNotice ? (
                    <img src={profile.warningNotice} alt="Warning" className="warning-notice-img" />
                ) : null}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'rgba(239,68,68,1)' }}>Warning notice</div>
                  {profile.warningText ? (
                    <div style={{ color: 'var(--muted)', marginTop: 6, whiteSpace: 'pre-wrap' }}>{profile.warningText}</div>
                  ) : (
                    <div style={{ color: 'var(--muted)', marginTop: 6 }}>There is a warning on this account.</div>
                  )}
                </div>
                {viewerIsAdminOrArbiter && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button className="btn" onClick={handleRemoveWarning} style={{ background: 'rgba(239,68,68,0.9)', border: '1px solid rgba(239,68,68,0.5)' }}>Remove Warning</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className="card"
            style={{
              padding: 0,
              marginBottom: '1.5rem',
              border: '1px solid rgba(148,163,184,0.2)',
              overflow: 'hidden',
              cursor: isSelf ? 'pointer' : 'default',
              position: 'relative',
            }}
            onClick={isSelf && !profile.heroCardUrl ? selectHeroFile : undefined}
          >
            {profile.heroCardUrl ? (
              <img
                src={profile.heroCardUrl}
                alt={`${profile.username}'s hero banner`}
                style={{ 
                  width: '100%', 
                  aspectRatio: '16/9', 
                  objectFit: 'contain', 
                  display: 'block',
                  background: 'var(--surface)'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  backgroundImage: `url(${getHouseImageSrc(profile.house)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted)',
                  fontWeight: 600,
                }}
              >
                {isSelf ? 'Click to upload your hero license' : 'No hero license yet'}
              </div>
            )}
            {isSelf && (
              <div
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  display: 'flex',
                  gap: '0.5rem',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn"
                  onClick={selectHeroFile}
                  disabled={uploadingHero || deletingHero}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148,163,184,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    position: 'relative',
                  }}
                >
                  {uploadingHero && (
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  )}
                  {profile.heroCardUrl ? 'Change' : 'Upload'}
                </button>
                <button
                  className="btn"
                  onClick={handleDeleteHero}
                  disabled={uploadingHero || deletingHero || !profile.heroCardUrl}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.75rem',
                    background: profile.heroCardUrl ? 'rgba(239, 68, 68, 0.9)' : 'rgba(148, 163, 184, 0.5)',
                    border: profile.heroCardUrl ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(148, 163, 184, 0.3)',
                    opacity: profile.heroCardUrl ? 1 : 0.6,
                    cursor: profile.heroCardUrl ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {deletingHero && (
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  )}
                  {deletingHero ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
            {uploadingHero && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                }}
              >
                Uploading...
              </div>
            )}
            {deletingHero && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                }}
              >
                Deleting...
              </div>
            )}
          </div>

          <div
            className="card"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              alignItems: 'flex-start',
              border: '1px solid rgba(148,163,184,0.2)',
              marginBottom: '1.5rem',
              backgroundImage: `linear-gradient(rgba(15,23,42,0.82), rgba(15,23,42,0.82)), url(${getHouseImageSrc(profile.house)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.username}
                  style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(148,163,184,0.3)' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), #8b0d26)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    fontWeight: '700',
                  }}
                >
                  {profile.username?.[0] || 'U'}
                </div>
              )}
              {isSelf && (
                <button
                  className="btn"
                  onClick={selectAvatarFile}
                  disabled={uploadingAvatar}
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {uploadingAvatar && (
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  )}
                  Change picture
                </button>
              )}
            </div>

            <div style={{ flex: '1 1 260px' }}>
              <h2 className="hdr" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                {profile.displayName || profile.username}
              </h2>
              <div style={{ color: 'var(--muted)', marginBottom: '0.75rem' }}>@{profile.username}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem' }}>
                {detailRows.map((row) => (
                  <div key={row.label} style={{ minWidth: 140 }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>{row.label}</div>
                    <div style={{ fontWeight: 600 }}>{row.label === 'Rank' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <img
                          src={getRankImageSrc(rankName)}
                          alt={rankName}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          style={{ width: 26, height: 26, objectFit: 'contain' }}
                        />
                        {row.value}
                      </span>
                    ) : row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Certificates section */}
          <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(148,163,184,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="hdr" style={{ margin: 0, fontSize: '1.2rem' }}>Certificates</h3>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{profile.certificates?.length || 0} item{(profile.certificates?.length || 0) !== 1 ? 's' : ''}</div>
            </div>
            {(!profile.certificates || profile.certificates.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>No certificates uploaded.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {profile.certificates.map((cert, idx) => (
                  <a key={idx} href={cert} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 8, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ width: '100%', aspectRatio: '16/10', background: `url(${cert}) center/cover no-repeat`, backgroundSize: 'cover' }} />
                    <div style={{ padding: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>View certificate</div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {heroFile && (
            <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(148,163,184,0.2)' }}>
              <h4 className="hdr" style={{ marginBottom: '0.5rem' }}>Upload hero license</h4>
              <div style={{ color: 'var(--muted)', marginBottom: '0.75rem' }}>Selected file: <strong>{heroFile.name}</strong></div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn" onClick={handleHeroUpload} disabled={uploadingHero} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {uploadingHero && (
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  )}
                  {uploadingHero ? 'Uploading...' : 'Upload license'}
                </button>
                <button
                  className="btn"
                  onClick={() => setHeroFile(null)}
                  disabled={uploadingHero}
                  style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {avatarFile && (
            <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(148,163,184,0.2)' }}>
              <h4 className="hdr" style={{ marginBottom: '0.5rem' }}>Upload profile picture</h4>
              <div style={{ color: 'var(--muted)', marginBottom: '0.75rem' }}>Selected file: <strong>{avatarFile.name}</strong></div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn" onClick={handleAvatarUpload} disabled={uploadingAvatar} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {uploadingAvatar && (
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  )}
                  {uploadingAvatar ? 'Uploading...' : 'Upload picture'}
                </button>
                <button
                  className="btn"
                  onClick={() => setAvatarFile(null)}
                  disabled={uploadingAvatar}
                  style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(148,163,184,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="hdr" style={{ margin: 0, fontSize: '1.2rem' }}>
                {isSelf ? 'Your Posts' : `${profile.displayName || profile.username}'s Posts`}
              </h3>
              {!postsLoading && (
                <button
                  className="btn"
                  onClick={() => {
                    if (profile?.username) {
                      loadPostsForIdentifier(profile.username);
                    }
                  }}
                  style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}
                >
                  Refresh
                </button>
              )}
            </div>

            {isSelf && (
              <div style={{ marginBottom: '1rem' }}>
                <textarea
                  className="input"
                  placeholder="Share an update..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value.slice(0, 500))}
                  style={{ minHeight: 100, resize: 'vertical', marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{newPostContent.length}/500</span>
                  <button className="btn" onClick={handleCreatePost} disabled={creatingPost || !newPostContent.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {creatingPost && (
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                    )}
                    {creatingPost ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            )}

            {postsLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>Loading posts...</div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>No posts to show.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {posts.map((post) => {
                  const postId = post._id || post.id;
                  return (
                    <div
                      key={postId}
                      style={{
                        border: '1px solid rgba(148,163,184,0.25)',
                        borderRadius: '12px',
                        padding: '1rem',
                        background: 'rgba(15,23,42,0.4)',
                      }}
                    >
                      <div style={{ marginBottom: '0.35rem', fontWeight: 600 }}>
                        {post.author?.displayName || post.author?.username || profile.username}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        {new Date(post.createdAt).toLocaleString()}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{post.content}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
