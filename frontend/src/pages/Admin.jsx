import { useEffect, useState } from 'react';
import client from '../api/client';
import { getRankImageSrc, calculateRank, RANKS } from '../utils/rank';

export default function Admin() {
  const [q, setQ] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [messageModal, setMessageModal] = useState({ open: false, userId: null, message: '' });
  const [declineModal, setDeclineModal] = useState({ open: false, userId: null, message: '' });
  const [editingUser, setEditingUser] = useState({ userId: null, field: null });
  const [editValues, setEditValues] = useState({ points: '', rank: '' });
  
  async function loadAllUsers() {
    try {
      const { data } = await client.get('/admin/all-users');
      setAllUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error) {
      console.error('Error loading all users:', error);
    }
  }
  
  useEffect(() => {
    // Filter users based on search query
    if (!q.trim()) {
      setFilteredUsers(allUsers);
    } else {
      const query = q.toLowerCase();
      const filtered = allUsers.filter(u => 
        u.username?.toLowerCase().includes(query) ||
        u.displayName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.group?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [q, allUsers]);
  
  async function search() { 
    // Search is now handled by the filter effect above
    // This function is kept for backward compatibility but does nothing
  }
  
  async function loadPendingUsers() {
    try {
      const { data } = await client.get('/admin/pending-users');
      setPendingUsers(data.users);
    } catch (error) {
      console.error('Error loading pending users:', error);
    }
  }
  
  async function refreshBlogs() { 
    try {
      const { data } = await client.get('/blog'); 
      setBlogs(data.blogs); 
    } catch (error) {
      console.error('Error loading blogs:', error);
    }
  }
  
  useEffect(() => { 
    refreshBlogs(); 
    loadPendingUsers();
    loadAllUsers();
  }, []);
  
  const handleUpdatePoints = async (userId, newPoints) => {
    try {
      const currentUser = allUsers.find(u => (u.id || u._id) === userId);
      if (!currentUser) return;
      const delta = parseInt(newPoints) - (currentUser.points || 0);
      await client.post(`/users/${userId}/points`, { delta });
      await loadAllUsers();
      setEditingUser({ userId: null, field: null });
    } catch (error) {
      console.error('Error updating points:', error);
      alert(error?.response?.data?.error || 'Failed to update points');
    }
  };
  
  const handleUpdateRank = async (userId, newRank) => {
    try {
      await client.patch(`/users/${userId}/rank`, { rank: newRank });
      await loadAllUsers();
      setEditingUser({ userId: null, field: null });
    } catch (error) {
      console.error('Error updating rank:', error);
      alert(error?.response?.data?.error || 'Failed to update rank');
    }
  };
  
  const startEdit = (userId, field, currentValue) => {
    setEditingUser({ userId, field });
    setEditValues({ points: currentValue?.points || '', rank: currentValue?.rank || '' });
  };
  
  const cancelEdit = () => {
    setEditingUser({ userId: null, field: null });
    setEditValues({ points: '', rank: '' });
  };
  
  const handleApprove = async (userId) => {
    try {
      await client.post('/admin/approve-user', { userId });
      await loadPendingUsers();
      alert('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      alert(error?.response?.data?.error || 'Failed to approve user');
    }
  };
  
  const handleDecline = async () => {
    if (!declineModal.userId) return;
    try {
      await client.post('/admin/decline-user', { 
        userId: declineModal.userId, 
        message: declineModal.message || undefined 
      });
      await loadPendingUsers();
      setDeclineModal({ open: false, userId: null, message: '' });
      alert('User declined successfully');
    } catch (error) {
      console.error('Error declining user:', error);
      alert(error?.response?.data?.error || 'Failed to decline user');
    }
  };
  
  const handleSendMessage = async () => {
    if (!messageModal.userId || !messageModal.message.trim()) return;
    try {
      await client.post('/admin/send-message', { 
        userId: messageModal.userId, 
        message: messageModal.message 
      });
      setMessageModal({ open: false, userId: null, message: '' });
      alert('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error?.response?.data?.error || 'Failed to send message');
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingUsers.map((u) => (
              <div 
                key={u.id || u._id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem', 
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  background: 'rgba(177,15,46,0.05)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {u.displayName || u.username}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    @{u.username} • {u.email}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Group: {u.group} • Sigil: {u.sigil}
                  </div>
                  {u.createdAt && (
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Created: {new Date(u.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn" 
                    onClick={() => handleApprove(u.id || u._id)}
                    style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)' }}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => setDeclineModal({ open: true, userId: u.id || u._id, message: '' })}
                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                  >
                    Decline
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => setMessageModal({ open: true, userId: u.id || u._id, message: '' })}
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* All Users Section */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 className="hdr" style={{ margin: 0 }}>All Users ({filteredUsers.length})</h4>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              className="input" 
              placeholder="Search users..." 
              value={q} 
              onChange={e => setQ(e.target.value)}
              style={{ minWidth: '200px' }}
            />
            <button className="btn" onClick={loadAllUsers}>Refresh</button>
          </div>
        </div>
        {filteredUsers.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>
            {q ? 'No users found matching your search' : 'No users found'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1f2937' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--muted)', fontWeight: '600' }}>User</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--muted)', fontWeight: '600' }}>Group</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--muted)', fontWeight: '600' }}>Rank</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--muted)', fontWeight: '600' }}>Points</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--muted)', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--muted)', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const userId = u.id || u._id;
                  const isEditingPoints = editingUser.userId === userId && editingUser.field === 'points';
                  const isEditingRank = editingUser.userId === userId && editingUser.field === 'rank';
                  const userRank = u.rank || calculateRank(u.points || 0);
                  
                  return (
                    <tr key={userId} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{u.displayName || u.username}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>@{u.username}</div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{u.group}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {isEditingRank ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                              className="input"
                              value={editValues.rank}
                              onChange={e => setEditValues({ ...editValues, rank: e.target.value })}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                            >
                              {RANKS.map(rank => (
                                <option key={rank} value={rank}>{rank}</option>
                              ))}
                            </select>
                            <button 
                              className="btn" 
                              onClick={() => handleUpdateRank(userId, editValues.rank)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                            >
                              ✓
                            </button>
                            <button 
                              className="btn" 
                              onClick={cancelEdit}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #1f2937' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img 
                              src={getRankImageSrc(userRank)}
                              alt={userRank}
                              onError={(e) => e.target.style.display = 'none'}
                              style={{ width: 24, height: 24, objectFit: 'contain' }}
                            />
                            <span>{userRank}</span>
                            <button 
                              className="btn" 
                              onClick={() => startEdit(userId, 'rank', { rank: userRank })}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.5rem', background: 'transparent', border: '1px solid #1f2937' }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {isEditingPoints ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="number"
                              className="input"
                              value={editValues.points}
                              onChange={e => setEditValues({ ...editValues, points: e.target.value })}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', width: '100px' }}
                            />
                            <button 
                              className="btn" 
                              onClick={() => handleUpdatePoints(userId, editValues.points)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                            >
                              ✓
                            </button>
                            <button 
                              className="btn" 
                              onClick={cancelEdit}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #1f2937' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{u.points || 0}</span>
                            <button 
                              className="btn" 
                              onClick={() => startEdit(userId, 'points', { points: u.points || 0 })}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid #1f2937' }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          background: u.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 
                                      u.status === 'pending' ? 'rgba(251, 191, 36, 0.2)' : 
                                      'rgba(239, 68, 68, 0.2)',
                          color: u.status === 'approved' ? 'rgba(34, 197, 94, 1)' : 
                                 u.status === 'pending' ? 'rgba(251, 191, 36, 1)' : 
                                 'rgba(239, 68, 68, 1)'
                        }}>
                          {u.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn" 
                            onClick={async () => { 
                              await client.post(`/users/${userId}/points`, { delta: 1 }); 
                              await loadAllUsers(); 
                            }}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          >
                            +1
                          </button>
                          <button 
                            className="btn" 
                            onClick={async () => { 
                              await client.post(`/users/${userId}/points`, { delta: -1 }); 
                              await loadAllUsers(); 
                            }}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          >
                            -1
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Blog Section */}
      <div className="card">
        <h4 className="hdr">Blog</h4>
        <input className="input" placeholder="Title" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} />
        <textarea className="input" style={{ width: '100%', minHeight: 120, marginTop: 8 }} placeholder="Content" value={blogContent} onChange={e => setBlogContent(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn" onClick={async () => { await client.post('/blog', { title: blogTitle, content: blogContent }); setBlogTitle(''); setBlogContent(''); refreshBlogs(); }}>Publish</button>
        </div>
        <div style={{ marginTop: '.5rem' }}>
          {blogs.map(b => (
            <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid #1f2937' }}>
              <div>{b.title} <span style={{ color: 'var(--muted)' }}>{new Date(b.createdAt).toLocaleString()}</span></div>
              <button className="btn" onClick={async () => { await client.delete(`/blog/${b._id}`); refreshBlogs(); }}>Delete</button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Message Modal */}
      {messageModal.open && (
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
              <button className="btn" onClick={handleSendMessage} disabled={!messageModal.message.trim()}>
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Decline Modal */}
      {declineModal.open && (
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
              >
                Decline User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


