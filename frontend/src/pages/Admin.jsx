import { useEffect, useState, useRef, useCallback } from 'react';
import client from '../api/client';
import { getRankImageSrc, calculateRank, RANKS } from '../utils/rank';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../store/auth';

const HOUSES = ['Pendragon', 'Phantomhive', 'Tempest', 'Zoldyck', 'Fritz', 'Elric', 'Dragneel', 'Hellsing', 'Obsidian Order', 'Council of IV', 'Abyssal IV', 'Von Einzbern'];

const MEMBER_STATUSES = ['Creator of the Realm', 'Guardian', 'Lord of the House', 'General', 'Seeker', 'Herald', 'Watcher', 'Knight of Genesis', 'Knight of I', 'Knight of II', 'Knight of III', 'Knight of IV', 'Knight of V', 'Commoner', 'Shopkeeper', 'Blacksmith'];

const MODERATOR_TYPES = ['Arbiter', 'Artisan', 'Vigil', 'Aesther', 'Gatekeeper', 'Overseer', 'Emissary'];

export default function Admin() {
  const { user: authUser } = useAuth();
  const [q, setQ] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const observer = useRef();
  const [messageModal, setMessageModal] = useState({ open: false, userId: null, message: '' });
  const [declineModal, setDeclineModal] = useState({ open: false, userId: null, message: '' });
  const [editingUser, setEditingUser] = useState({ userId: null, field: null });
  const [editValues, setEditValues] = useState({ points: '', rank: '', house: '', memberStatus: '', username: '', displayName: '' });
  const [moderatorModal, setModeratorModal] = useState({ open: false, userId: null, moderatorType: 'Vigil' });
  const [houses, setHouses] = useState([]);
  const [selectedHouseName, setSelectedHouseName] = useState('');
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [loadingSelectedHouse, setLoadingSelectedHouse] = useState(false);
  const [houseEditValues, setHouseEditValues] = useState({ description: '', status: 'Active' });
  const [loadingAction, setLoadingAction] = useState(null);

  const loadAllUsers = useCallback(async (reset = false) => {
    if (loadingUsers) return;
    setLoadingUsers(true);
    try {
      const currentPage = reset ? 1 : page;
      const { data } = await client.get('/admin/all-users', { params: { page: currentPage, limit: 20 } });

      if (reset) {
        setAllUsers(data.users);
        setFilteredUsers(data.users);
        setPage(2);
      } else {
        setAllUsers(prev => [...prev, ...data.users]);
        setFilteredUsers(prev => [...prev, ...data.users]);
        setPage(prev => prev + 1);
      }

      setHasMore(currentPage < data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading all users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [loadingUsers, page]);

  const lastUserElementRef = useCallback(node => {
    if (loadingUsers) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !q) { // Only infinite scroll when not searching
        loadAllUsers();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingUsers, hasMore, loadAllUsers, q]);

  useEffect(() => {
    // Search users from backend when query changes
    const searchUsers = async () => {
      if (!q.trim()) {
        setFilteredUsers(allUsers);
        return;
      }

      try {
        const { data } = await client.get('/admin/search-users', { params: { q } });
        setFilteredUsers(data.users);
      } catch (error) {
        console.error('Error searching users:', error);
        // Fallback to client-side filtering if search fails
        const query = q.toLowerCase();
        const filtered = allUsers.filter(u =>
          u.username?.toLowerCase().includes(query) ||
          u.displayName?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.house?.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
      }
    };

    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [q, allUsers]);

  async function loadPendingUsers() {
    try {
      const { data } = await client.get('/admin/pending-users');
      setPendingUsers(data.users);
    } catch (error) {
      console.error('Error loading pending users:', error);
    }
  }

  async function loadHouses() {
    try {
      const { data } = await client.get('/admin/all-houses');
      setHouses(data.houses || []);
    } catch (error) {
      console.error('Error loading houses:', error);
    }
  }

  useEffect(() => {
    loadPendingUsers();
    loadAllUsers(true);
    loadHouses();
  }, []);

  const handleUpdatePoints = async (userId, newPoints) => {
    try {
      setLoadingAction(`update-points-${userId}`);
      const currentUser = allUsers.find(u => (u.id || u._id) === userId);
      if (!currentUser) return;
      const delta = parseInt(newPoints) - (currentUser.points || 0);
      await client.post(`/users/${userId}/points`, { delta });
      await loadAllUsers();
      setEditingUser({ userId: null, field: null });
    } catch (error) {
      console.error('Error updating points:', error);
      alert(getErrorMessage(error, 'Failed to update points'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateRank = async (userId, newRank) => {
    try {
      setLoadingAction(`update-rank-${userId}`);
      await client.patch(`/users/${userId}/rank`, { rank: newRank });
      await loadAllUsers();
      setEditingUser({ userId: null, field: null });
    } catch (error) {
      console.error('Error updating rank:', error);
      alert(getErrorMessage(error, 'Failed to update rank'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateHouse = async (userId, newHouse) => {
    try {
      setLoadingAction(`update-house-${userId}`);
      await client.post('/admin/update-house', { userId, house: newHouse });
      await loadAllUsers();
      setEditingUser({ userId: null, field: null });
      alert('House updated successfully');
    } catch (error) {
      console.error('Error updating house:', error);
      alert(getErrorMessage(error, 'Failed to update house'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateMemberStatus = async (userId, newMemberStatus) => {
    try {
      setLoadingAction(`update-memberStatus-${userId}`);
      await client.post('/admin/update-member-status', { userId, memberStatus: newMemberStatus || null });
      await loadAllUsers();
      setEditingUser({ userId: null, field: null });
      alert('Member status updated successfully');
    } catch (error) {
      console.error('Error updating member status:', error);
      alert(getErrorMessage(error, 'Failed to update member status'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateUsername = async (userId, newUsername) => {
    try {
      setLoadingAction(`update-username-${userId}`);
      await client.post('/admin/update-username', { userId, username: newUsername });
      await loadAllUsers();
      setEditingUser({ userId: null, field: null });
      alert('Username updated successfully');
    } catch (error) {
      console.error('Error updating username:', error);
      alert(getErrorMessage(error, 'Failed to update username'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateDisplayName = async (userId, newDisplayName) => {
    try {
      setLoadingAction(`update-displayName-${userId}`);
      await client.post('/admin/update-display-name', { userId, displayName: newDisplayName || null });
      await loadAllUsers();
      setEditingUser({ userId: null, field: null });
      alert('Display name updated successfully');
    } catch (error) {
      console.error('Error updating display name:', error);
      alert(getErrorMessage(error, 'Failed to update display name'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateEmail = async (userId, newEmail) => {
    try {
      setLoadingAction(`update-email-${userId}`);
      await client.post('/admin/update-email', { userId, email: newEmail });
      await loadAllUsers();
      setEditingUser({ userId: null, field: null });
      alert('Email updated successfully');
    } catch (error) {
      console.error('Error updating email:', error);
      alert(getErrorMessage(error, 'Failed to update email'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddModerator = async () => {
    if (!moderatorModal.userId || !moderatorModal.moderatorType) return;
    try {
      setLoadingAction('add-moderator');
      await client.post('/admin/add-moderator', { userId: moderatorModal.userId, moderatorType: moderatorModal.moderatorType });
      await loadAllUsers();
      setModeratorModal({ open: false, userId: null, moderatorType: 'Vigil' });
      alert('User promoted to moderator successfully');
    } catch (error) {
      console.error('Error adding moderator:', error);
      alert(getErrorMessage(error, 'Failed to add moderator'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemoveModerator = async (userId) => {
    if (!userId) return;
    const confirmed = window.confirm('Are you sure you want to remove the moderator role from this user?');
    if (!confirmed) return;
    try {
      setLoadingAction(`remove-moderator-${userId}`);
      await client.post('/admin/remove-moderator', { userId });
      await loadAllUsers();
      alert('Moderator role removed successfully');
    } catch (error) {
      console.error('Error removing moderator:', error);
      alert(getErrorMessage(error, 'Failed to remove moderator'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!userId) return;
    const currentUserId = authUser?.id || authUser?._id;
    if (currentUserId && String(currentUserId) === String(userId)) {
      alert('You cannot remove your own account.');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to remove this user? This action cannot be undone.');
    if (!confirmed) return;
    try {
      setLoadingAction(`remove-user-${userId}`);
      await client.delete(`/admin/user/${userId}`);
      await loadAllUsers();
      alert('User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      alert(getErrorMessage(error, 'Failed to remove user'));
    } finally {
      setLoadingAction(null);
    }
  };

  const startEdit = (userId, field, currentValue) => {
    setEditingUser({ userId, field });
    setEditValues({
      points: currentValue?.points || '',
      rank: currentValue?.rank || '',
      house: currentValue?.house || '',
      memberStatus: currentValue?.memberStatus || '',
      username: currentValue?.username || '',
      displayName: currentValue?.displayName || '',
      email: currentValue?.email || ''
    });
  };

  const cancelEdit = () => {
    setEditingUser({ userId: null, field: null });
    setEditValues({ points: '', rank: '', house: '', memberStatus: '', username: '', displayName: '', email: '' });
  };

  const handleApprove = async (userId) => {
    try {
      setLoadingAction(`approve-${userId}`);
      await client.post('/admin/approve-user', { userId });
      await loadPendingUsers();
      alert('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      alert(getErrorMessage(error, 'Failed to approve user'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDecline = async () => {
    if (!declineModal.userId) return;
    try {
      setLoadingAction('decline-user');
      await client.post('/admin/decline-user', {
        userId: declineModal.userId,
        message: declineModal.message || undefined
      });
      await loadPendingUsers();
      setDeclineModal({ open: false, userId: null, message: '' });
      alert('User declined successfully');
    } catch (error) {
      console.error('Error declining user:', error);
      alert(getErrorMessage(error, 'Failed to decline user'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendMessage = async () => {
    if (!messageModal.userId || !messageModal.message.trim()) return;
    try {
      setLoadingAction('send-message');
      await client.post('/admin/send-message', {
        userId: messageModal.userId,
        message: messageModal.message
      });
      setMessageModal({ open: false, userId: null, message: '' });
      alert('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(getErrorMessage(error, 'Failed to send message'));
    } finally {
      setLoadingAction(null);
    }
  };

  const loadSelectedHouse = async (houseName) => {
    if (!houseName) {
      setSelectedHouse(null);
      setHouseEditValues({ description: '', status: 'Active' });
      return;
    }
    try {
      setLoadingSelectedHouse(true);
      const { data } = await client.get('/admin/house', { params: { houseName } });
      const house = data.house;
      setSelectedHouse(house);
      setHouseEditValues({
        description: house.description || '',
        status: house.status || 'Active'
      });
    } catch (error) {
      console.error('Error loading house:', error);
      alert(getErrorMessage(error, 'Failed to load house'));
    } finally {
      setLoadingSelectedHouse(false);
    }
  };

  useEffect(() => {
    if (selectedHouseName) {
      loadSelectedHouse(selectedHouseName);
    } else {
      setSelectedHouse(null);
      setHouseEditValues({ description: '', status: 'Active' });
    }
  }, [selectedHouseName]);

  const handleUpdateHouseDetails = async () => {
    if (!selectedHouseName) return;
    try {
      setLoadingAction('update-house-details');
      await client.post('/admin/update-house-details', {
        houseName: selectedHouseName,
        description: houseEditValues.description,
        status: houseEditValues.status
      });
      await loadSelectedHouse(selectedHouseName);
      await loadHouses();
      alert('House details updated successfully');
    } catch (error) {
      console.error('Error updating house details:', error);
      alert(getErrorMessage(error, 'Failed to update house details'));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="container">
      <h3 className="hdr">Admin Dashboard</h3>

      {/* Pending Users Section */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 className="hdr" style={{ margin: 0 }}>Pending Users</h4>
          <button className="btn" onClick={loadPendingUsers}>Refresh</button>
        </div>
        {pendingUsers.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>
            No pending users
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {pendingUsers.map((u) => (
              <div
                key={u.id || u._id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                  padding: '1rem',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  background: 'rgba(177,15,46,0.05)',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: window.innerWidth < 600 ? '0.5rem' : '0.75rem 1.5rem',
                    flexDirection: window.innerWidth < 600 ? 'column' : 'row',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, minHeight: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '1rem', wordBreak: 'break-word' }}>
                      {u.displayName || u.username}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '0.19rem', wordBreak: 'break-word' }}>
                      @{u.username} • {u.email}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.82rem', wordBreak: 'break-word' }}>
                      House: {u.house} • Sigil: {u.sigil}
                    </div>
                    {u.createdAt && (
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.22rem', wordBreak: 'break-word' }}>
                        Created: {new Date(u.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.25rem',
                      flexShrink: 0,
                      flexWrap: 'wrap',
                      minWidth: 0,
                    }}
                  >
                    <button
                      className="btn"
                      onClick={() => handleApprove(u.id || u._id)}
                      style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.36)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.4rem',
                        minWidth: '32px',
                        minHeight: '32px',
                        fontSize: '1rem',
                        borderRadius: '6px',
                      }}
                      disabled={loadingAction === `approve-${u.id || u._id}`}
                    >
                      {loadingAction === `approve-${u.id || u._id}` ? <div className="spinner" style={{ width: '1.1rem', height: '1.1rem', border: '2px solid #22c55e', borderTopColor: 'transparent' }} /> : <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✅</span>}
                    </button>
                    <button
                      className="btn"
                      onClick={() => setDeclineModal({ open: true, userId: u.id || u._id, message: '' })}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.31)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.4rem',
                        minWidth: '32px',
                        minHeight: '32px',
                        fontSize: '1rem',
                        borderRadius: '6px',
                      }}
                      aria-label="Decline user"
                    >
                      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✖️</span>
                    </button>
                    <button
                      className="btn"
                      onClick={() => setMessageModal({ open: true, userId: u.id || u._id, message: '' })}
                      style={{
                        background: 'rgba(59, 130, 246, 0.07)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.4rem',
                        minWidth: '32px',
                        minHeight: '32px',
                        fontSize: '1rem',
                        borderRadius: '6px',
                      }}
                      aria-label="Message user"
                    >
                      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>💬</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <style>
              {`
              @media (max-width: 500px) {
                .admin-pending-user-flex {
                  flex-direction: column !important;
                  gap: 0.5rem !important;
                }
              }
              `}
            </style>
          </div>
        )}
      </div>

      {/* Houses Management Section */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 className="hdr" style={{ margin: 0 }}>Manage Houses</h4>
          <button className="btn" onClick={loadHouses}>Refresh</button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Select House to Edit
          </label>
          <select
            className="input"
            value={selectedHouseName}
            onChange={(e) => setSelectedHouseName(e.target.value)}
            style={{ width: '100%', maxWidth: '400px' }}
          >
            <option value="">-- Select a house --</option>
            {HOUSES.map((houseName) => (
              <option key={houseName} value={houseName}>
                {houseName}
              </option>
            ))}
          </select>
        </div>

        {loadingSelectedHouse ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
            Loading house details...
          </div>
        ) : selectedHouse ? (
          <div style={{
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '1.5rem',
            background: 'rgba(255,255,255,0.01)',
          }}>
            <h5 className="hdr" style={{ margin: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
              Editing: House {selectedHouse.name}
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Description
                </label>
                <textarea
                  className="input"
                  value={houseEditValues.description}
                  onChange={(e) => setHouseEditValues({ ...houseEditValues, description: e.target.value })}
                  style={{ width: '100%', minHeight: 150, resize: 'vertical' }}
                  placeholder="Enter house description..."
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Status
                </label>
                <select
                  className="input"
                  value={houseEditValues.status}
                  onChange={(e) => setHouseEditValues({ ...houseEditValues, status: e.target.value })}
                  style={{ width: '100%', maxWidth: '200px' }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn"
                  onClick={() => {
                    setSelectedHouseName('');
                    setSelectedHouse(null);
                    setHouseEditValues({ description: '', status: 'Active' });
                  }}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'transparent', border: '1px solid #1f2937' }}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleUpdateHouseDetails}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  disabled={loadingAction === 'update-house-details'}
                >
                  {loadingAction === 'update-house-details' ? <div className="spinner" style={{ width: '1rem', height: '1rem' }} /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        ) : selectedHouseName ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
            Loading house details...
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
            Select a house from the dropdown above to edit its details.
          </div>
        )}
      </div>

      {/* All Users Section */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: window.innerWidth < 600 ? '0.5rem' : '0.75rem 1.5rem',
            flexDirection: window.innerWidth < 600 ? 'column' : 'row',
          }}
        >
          <h4 className="hdr" style={{ margin: 0 }}>All Users ({filteredUsers.length})</h4>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              className="input"
              placeholder="Search users..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ minWidth: '200px' }}
            />
            <button className="btn" onClick={() => loadAllUsers(true)}>Refresh</button>
          </div>
        </div>
        {filteredUsers.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>
            {q ? 'No users found matching your search' : 'No users found'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredUsers.map((u, index) => {
              const userId = u.id || u._id;
              const isLast = index === filteredUsers.length - 1;

              // ... existing variables ...
              const isEditingPoints = editingUser.userId === userId && editingUser.field === 'points';
              const isEditingRank = editingUser.userId === userId && editingUser.field === 'rank';
              const isEditingHouse = editingUser.userId === userId && editingUser.field === 'house';
              const isEditingMemberStatus = editingUser.userId === userId && editingUser.field === 'memberStatus';
              const isEditingUsername = editingUser.userId === userId && editingUser.field === 'username';
              const isEditingDisplayName = editingUser.userId === userId && editingUser.field === 'displayName';
              const isEditingEmail = editingUser.userId === userId && editingUser.field === 'email';
              const userRank = u.rank || calculateRank(u.points || 0);
              const statusBadge = (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background:
                      u.status === 'approved'
                        ? 'rgba(34, 197, 94, 0.2)'
                        : u.status === 'pending'
                          ? 'rgba(251, 191, 36, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                    color:
                      u.status === 'approved'
                        ? 'rgba(34, 197, 94, 1)'
                        : u.status === 'pending'
                          ? 'rgba(251, 191, 36, 1)'
                          : 'rgba(239, 68, 68, 1)'
                  }}
                >
                  {u.status || 'pending'}
                </span>
              );
              const roleBadge = (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background:
                      u.role === 'admin'
                        ? 'rgba(177, 15, 46, 0.2)'
                        : u.role === 'moderator'
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(107, 114, 128, 0.2)',
                    color:
                      u.role === 'admin'
                        ? 'rgba(177, 15, 46, 1)'
                        : u.role === 'moderator'
                          ? 'rgba(59, 130, 246, 1)'
                          : 'rgba(107, 114, 128, 1)'
                  }}
                >
                  {u.role === 'moderator' && u.moderatorType ? `${u.moderatorType}` : (u.role || 'user')}
                </span>
              );

              return (
                <div
                  key={userId}
                  ref={isLast ? lastUserElementRef : null}
                  style={{
                    border: '1px solid #1f2937',
                    borderRadius: '12px',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{u.displayName || u.username}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>@{u.username}</div>
                      {isEditingEmail ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.2rem', marginBottom: '0.2rem' }}>
                          <input
                            type="email"
                            className="input"
                            value={editValues.email}
                            onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: 200 }}
                            placeholder="Enter email"
                          />
                          <button
                            className="btn"
                            onClick={() => handleUpdateEmail(userId, editValues.email)}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                            disabled={loadingAction === `update-email-${userId}`}
                          >
                            {loadingAction === `update-email-${userId}` ? <div className="spinner" style={{ width: '0.8rem', height: '0.8rem' }} /> : '✓'}
                          </button>
                          <button
                            className="btn"
                            onClick={cancelEdit}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{u.email}</div>
                          <button
                            className="btn"
                            onClick={() => startEdit(userId, 'email', { email: u.email })}
                            style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem', background: 'transparent', border: '1px solid #1f2937', marginLeft: '0.5rem' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Sigil: {u.sigil}</div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      {roleBadge}
                      {statusBadge}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Username</span>
                      {isEditingUsername ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="input"
                            value={editValues.username}
                            onChange={(e) => setEditValues({ ...editValues, username: e.target.value })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', width: 200 }}
                            placeholder="Enter username"
                          />
                          <button
                            className="btn"
                            onClick={() => handleUpdateUsername(userId, editValues.username)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                            disabled={loadingAction === `update-username-${userId}`}
                          >
                            {loadingAction === `update-username-${userId}` ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} /> : '✓'}
                          </button>
                          <button
                            className="btn"
                            onClick={cancelEdit}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span>@{u.username}</span>
                          <button
                            className="btn"
                            onClick={() => startEdit(userId, 'username', { username: u.username })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Display Name</span>
                      {isEditingDisplayName ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="input"
                            value={editValues.displayName}
                            onChange={(e) => setEditValues({ ...editValues, displayName: e.target.value })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', width: 200 }}
                            placeholder="Enter display name"
                          />
                          <button
                            className="btn"
                            onClick={() => handleUpdateDisplayName(userId, editValues.displayName)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                            disabled={loadingAction === `update-displayName-${userId}`}
                          >
                            {loadingAction === `update-displayName-${userId}` ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} /> : '✓'}
                          </button>
                          <button
                            className="btn"
                            onClick={cancelEdit}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span>{u.displayName || 'None'}</span>
                          <button
                            className="btn"
                            onClick={() => startEdit(userId, 'displayName', { displayName: u.displayName || '' })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>House</span>
                      {isEditingHouse ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <select
                            className="input"
                            value={editValues.house}
                            onChange={(e) => setEditValues({ ...editValues, house: e.target.value })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                          >
                            {HOUSES.map((house) => (
                              <option key={house} value={house}>
                                {house}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn"
                            onClick={() => handleUpdateHouse(userId, editValues.house)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                            disabled={loadingAction === `update-house-${userId}`}
                          >
                            {loadingAction === `update-house-${userId}` ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} /> : '✓'}
                          </button>
                          <button
                            className="btn"
                            onClick={cancelEdit}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span>{u.house}</span>
                          <button
                            className="btn"
                            onClick={() => startEdit(userId, 'house', { house: u.house })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Rank</span>
                      {isEditingRank ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <select
                            className="input"
                            value={editValues.rank}
                            onChange={(e) => setEditValues({ ...editValues, rank: e.target.value })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                          >
                            {RANKS.map((rank) => (
                              <option key={rank} value={rank}>
                                {rank}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn"
                            onClick={() => handleUpdateRank(userId, editValues.rank)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                            disabled={loadingAction === `update-rank-${userId}`}
                          >
                            {loadingAction === `update-rank-${userId}` ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} /> : '✓'}
                          </button>
                          <button
                            className="btn"
                            onClick={cancelEdit}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <img
                            src={getRankImageSrc(userRank)}
                            alt={userRank}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                            style={{ width: 24, height: 24, objectFit: 'contain' }}
                          />
                          <span>{userRank}</span>
                          <button
                            className="btn"
                            onClick={() => startEdit(userId, 'rank', { rank: userRank })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Points</span>
                      {isEditingPoints ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            type="number"
                            className="input"
                            value={editValues.points}
                            onChange={(e) => setEditValues({ ...editValues, points: e.target.value })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', width: 120 }}
                          />
                          <button
                            className="btn"
                            onClick={() => handleUpdatePoints(userId, editValues.points)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                            disabled={loadingAction === `update-points-${userId}`}
                          >
                            {loadingAction === `update-points-${userId}` ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} /> : '✓'}
                          </button>
                          <button
                            className="btn"
                            onClick={cancelEdit}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{u.points || 0}</span>
                          <button
                            className="btn"
                            onClick={() => startEdit(userId, 'points', { points: u.points || 0 })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Member Status</span>
                      {isEditingMemberStatus ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <select
                            className="input"
                            value={editValues.memberStatus}
                            onChange={(e) => setEditValues({ ...editValues, memberStatus: e.target.value })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                          >
                            <option value="">None</option>
                            {MEMBER_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn"
                            onClick={() => handleUpdateMemberStatus(userId, editValues.memberStatus)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                            disabled={loadingAction === `update-memberStatus-${userId}`}
                          >
                            {loadingAction === `update-memberStatus-${userId}` ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} /> : '✓'}
                          </button>
                          <button
                            className="btn"
                            onClick={cancelEdit}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span>{u.memberStatus || 'None'}</span>
                          <button
                            className="btn"
                            onClick={() => startEdit(userId, 'memberStatus', { memberStatus: u.memberStatus || '' })}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid #1f2937' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {u.role !== 'admin' && u.role !== 'moderator' && (
                      <button
                        className="btn"
                        onClick={() => setModeratorModal({ open: true, userId })}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                      >
                        Add Moderator
                      </button>
                    )}
                    {u.role === 'moderator' && (
                      <button
                        className="btn"
                        onClick={() => handleRemoveModerator(userId)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.4)' }}
                        disabled={loadingAction === `remove-moderator-${userId}`}
                      >
                        {loadingAction === `remove-moderator-${userId}` ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem', border: '2px solid #f59e0b', borderTopColor: 'transparent' }} /> : 'Remove Moderator'}
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button
                        className="btn"
                        onClick={() => handleRemoveUser(userId)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                        disabled={loadingAction === `remove-user-${userId}`}
                      >
                        {loadingAction === `remove-user-${userId}` ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem', border: '2px solid #ef4444', borderTopColor: 'transparent' }} /> : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {
        messageModal.open && (
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
            <div className="card" style={{ maxWidth: 500, width: '90%' }}>
              <h4 className="hdr" style={{ marginBottom: '1rem' }}>Send Message to User</h4>
              <textarea
                className="input"
                style={{ width: '100%', minHeight: 120, marginBottom: '1rem' }}
                placeholder="Enter your message..."
                value={messageModal.message}
                onChange={e => setMessageModal({ ...messageModal, message: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setMessageModal({ open: false, userId: null, message: '' })}>
                  Cancel
                </button>
                <button className="btn" onClick={handleSendMessage} disabled={!messageModal.message.trim() || loadingAction === 'send-message'}>
                  {loadingAction === 'send-message' ? <div className="spinner" style={{ width: '1rem', height: '1rem' }} /> : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Decline Modal */}
      {
        declineModal.open && (
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
            <div className="card" style={{ maxWidth: 500, width: '90%' }}>
              <h4 className="hdr" style={{ marginBottom: '1rem' }}>Decline User</h4>
              <textarea
                className="input"
                style={{ width: '100%', minHeight: 120, marginBottom: '1rem' }}
                placeholder="Optional: Enter a message explaining why the account was declined..."
                value={declineModal.message}
                onChange={e => setDeclineModal({ ...declineModal, message: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setDeclineModal({ open: false, userId: null, message: '' })}>
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleDecline}
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                  disabled={loadingAction === 'decline-user'}
                >
                  {loadingAction === 'decline-user' ? <div className="spinner" style={{ width: '1rem', height: '1rem', border: '2px solid #ef4444', borderTopColor: 'transparent' }} /> : 'Decline User'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Moderator Modal */}
      {
        moderatorModal.open && (
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
            <div className="card" style={{ maxWidth: 500, width: '90%' }}>
              <h4 className="hdr" style={{ marginBottom: '1rem' }}>Add Moderator</h4>
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                Select the moderator type for this user. Each type has different permissions.
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Moderator Type
                </label>
                <select
                  className="input"
                  value={moderatorModal.moderatorType}
                  onChange={(e) => setModeratorModal({ ...moderatorModal, moderatorType: e.target.value })}
                  style={{ width: '100%' }}
                >
                  {MODERATOR_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {moderatorModal.moderatorType === 'Vigil' && 'Can edit, create and delete posts'}
                  {moderatorModal.moderatorType === 'Arbiter' && 'Can remove users'}
                  {moderatorModal.moderatorType === 'Artisan' && 'Can upload others Hero license and change that'}
                  {moderatorModal.moderatorType === 'Aesther' && 'Moderator permissions'}
                  {moderatorModal.moderatorType === 'Gatekeeper' && 'Moderator permissions'}
                  {moderatorModal.moderatorType === 'Overseer' && 'Moderator permissions'}
                  {moderatorModal.moderatorType === 'Emissary' && 'Can CRUD Announcements, Events and Articles'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setModeratorModal({ open: false, userId: null, moderatorType: 'Vigil' })}>
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleAddModerator}
                  style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                  disabled={loadingAction === 'add-moderator'}
                >
                  {loadingAction === 'add-moderator' ? <div className="spinner" style={{ width: '1rem', height: '1rem', border: '2px solid #3b82f6', borderTopColor: 'transparent' }} /> : 'Add Moderator'}
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}
