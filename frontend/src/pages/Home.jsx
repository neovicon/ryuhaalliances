import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';

export default function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [stories, setStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [leadershipMembers, setLeadershipMembers] = useState([]);
  const [loadingLeadership, setLoadingLeadership] = useState(true);
  const [showLeadershipModal, setShowLeadershipModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [leadershipForm, setLeadershipForm] = useState({ category: 'Creators', name: '', description: '', order: 0 });
  const [leadershipImage, setLeadershipImage] = useState(null);
  const [submittingLeadership, setSubmittingLeadership] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadEvents();
    loadAnnouncements();
    loadBlogs();
    loadArticles();
    loadStories();
    loadLeadership();
  }, []);;

  async function loadEvents() {
    try {
      setLoadingEvents(true);
      const { data } = await client.get('/events');
      // Backend already filters if not admin, but we'll double check here
      const isAdmin = user && user.role === 'admin';
      const filteredEvents = isAdmin
        ? data.events
        : data.events.filter(e => !e.inactive);
      setEvents(filteredEvents.slice(0, 3)); // Show only first 3 events
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function loadAnnouncements() {
    try {
      setLoadingAnnouncements(true);
      const { data } = await client.get('/announcements', { params: { activeOnly: 'true' } });
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoadingAnnouncements(false);
    }
  }

  async function loadBlogs() {
    try {
      setLoadingBlogs(true);
      const { data } = await client.get('/blogs', { params: { activeOnly: 'true' } });
      setBlogs(data.blogs || []);
    } catch (err) {
      console.error('Error loading blogs:', err);
    } finally {
      setLoadingBlogs(false);
    }
  }

  async function loadArticles() {
    try {
      setLoadingArticles(true);
      const { data } = await client.get('/articles', { params: { activeOnly: 'true' } });
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setLoadingArticles(false);
    }
  }

  async function loadStories() {
    try {
      setLoadingStories(true);
      const { data } = await client.get('/stories', { params: { activeOnly: 'true' } });
      setStories(data.stories || []);
    } catch (err) {
      console.error('Error loading stories:', err);
    } finally {
      setLoadingStories(false);
    }
  }

  async function loadLeadership() {
    try {
      setLoadingLeadership(true);
      const { data } = await client.get('/leadership');
      setLeadershipMembers(data.members || []);
    } catch (err) {
      console.error('Error loading leadership:', err);
    } finally {
      setLoadingLeadership(false);
    }
  }

  async function handleLeadershipSubmit(e) {
    e.preventDefault();
    setSubmittingLeadership(true);

    try {
      const formData = new FormData();
      formData.append('category', leadershipForm.category);
      formData.append('name', leadershipForm.name);
      formData.append('description', leadershipForm.description);
      formData.append('order', leadershipForm.order);

      if (leadershipImage) {
        formData.append('image', leadershipImage);
      }

      if (editingMember) {
        await client.put(`/leadership/${editingMember._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await client.post('/leadership', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowLeadershipModal(false);
      setEditingMember(null);
      setLeadershipForm({ category: 'Creators', name: '', description: '', order: 0 });
      setLeadershipImage(null);
      loadLeadership();
    } catch (error) {
      console.error('Error saving leadership member:', error);
      alert('Failed to save leadership member');
    } finally {
      setSubmittingLeadership(false);
    }
  }

  async function handleDeleteLeadershipMember(id) {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      await client.delete(`/leadership/${id}`);
      loadLeadership();
    } catch (error) {
      console.error('Error deleting leadership member:', error);
      alert('Failed to delete leadership member');
    }
  }

  return (
    <div>
      <section style={{
        background: 'url(/assets/cover.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundBlendMode: 'darken', backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0,0,0,.6)',
        padding: '5rem 1rem',
        borderBottom: '1px solid #1f2937'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 className="hdr" style={{ fontSize: 42, letterSpacing: 2 }}>Ryuha Alliance</h1>
          <p style={{ maxWidth: 800, margin: '1rem auto', color: 'var(--muted)', lineHeight: 1.6 }}>
            a legendary gathering of warriors, dreamers, and adventurers from all walks of anime fandom.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <span className="card">Honor</span>
            <span className="card">Discipline</span>
            <span className="card">Courage</span>
            <span className="card">Growth</span>
            <span className="card">Unity</span>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      {!loadingAnnouncements && announcements.length > 0 && (
        <section className="container" style={{ padding: '2rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="hdr" style={{ margin: 0 }}>Announcements</h3>
            <button className="btn" onClick={() => navigate('/announcements')} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}>
              View Announcements
            </button>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {announcements.slice(0, 3).map((announcement) => (
              <div key={announcement.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/announcements/${announcement.id}`)}>
                <h4 className="hdr" style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>{announcement.title}</h4>
                {announcement.imageUrl && (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 10',
                      maxWidth: 960,
                      maxHeight: 600,
                      margin: '0 auto',
                      background: `url(${announcement.imageUrl}) center/cover no-repeat`,
                      backgroundSize: 'cover',
                      borderBottom: '1px solid rgba(148,163,184,0.12)'
                    }}
                  />
                )}
                <div style={{
                  color: 'var(--muted)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {announcement.content}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Blogs Section */}
      {!loadingBlogs && blogs.length > 0 && (
        <section className="container" style={{ padding: '2rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="hdr" style={{ margin: 0 }}>Blogs</h3>
            <a className="btn" onClick={() => navigate('/blogs')} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}>
              View more
            </a>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {blogs.slice(0, 3).map((b) => (
              <div key={b.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/blogs/${b.id}`)}>
                <h4 className="hdr" style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{b.title}</h4>
                {b.imageUrl && (
                  <div style={{ width: '100%', aspectRatio: '16 / 10', background: `url(${b.imageUrl}) center/cover no-repeat`, backgroundSize: 'cover', borderBottom: '1px solid rgba(148,163,184,0.12)' }} />
                )}
                <div style={{ color: 'var(--muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.excerpt || b.content}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>{b.createdAt && new Date(b.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Articles Section */}
      {!loadingArticles && articles.length > 0 && (
        <section className="container" style={{ padding: '2rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="hdr" style={{ margin: 0 }}>Articles</h3>
            <a className="btn" onClick={() => navigate('/articles')} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}>
              View more
            </a>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {articles.slice(0, 3).map((it) => (
              <div key={it.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/articles/${it.id}`)}>
                <h4 className="hdr" style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{it.title}</h4>
                {it.imageUrl && (
                  <div style={{ width: '100%', aspectRatio: '16 / 10', background: `url(${it.imageUrl}) center/cover no-repeat`, backgroundSize: 'cover', borderBottom: '1px solid rgba(148,163,184,0.12)' }} />
                )}
                <div style={{ color: 'var(--muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.content}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>{it.createdAt && new Date(it.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stories Section */}
      {!loadingStories && stories.length > 0 && (
        <section className="container" style={{ padding: '2rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="hdr" style={{ margin: 0 }}>Stories</h3>
            <a className="btn" onClick={() => navigate('/stories')} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}>
              View more
            </a>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {stories.slice(0, 3).map((s) => (
              <div key={s.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/stories/${s.id}`)}>
                <h4 className="hdr" style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{s.title}</h4>
                {s.imageUrl && (
                  <div style={{ width: '100%', aspectRatio: '16 / 10', background: `url(${s.imageUrl}) center/cover no-repeat`, backgroundSize: 'cover', borderBottom: '1px solid rgba(148,163,184,0.12)' }} />
                )}
                <div style={{ color: 'var(--muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.content}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>{s.createdAt && new Date(s.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Leadership & Community Section */}
      <section className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="hdr">Leadership & Community</h3>
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setShowLeadershipModal(true);
                setEditingMember(null);
                setLeadershipForm({ category: 'Creators', name: '', description: '', order: 0 });
                setLeadershipImage(null);
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#b10f2e',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
            >
              + Add Member
            </button>
          )}
        </div>

        {loadingLeadership ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
            Loading leadership members...
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {['Creators', 'Abyssal', 'Council'].map(category => {
              const categoryMembers = leadershipMembers.filter(m => m.category === category);

              return (
                <div key={category} className="card" style={{ padding: '1.5rem' }}>
                  <h4 className="hdr" style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>{category}</h4>

                  {categoryMembers.length === 0 ? (
                    <div style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                      No members added yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {categoryMembers.map(member => (
                        <div key={member._id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)', paddingBottom: '1rem' }}>
                          {member.imageUrl && (
                            <img
                              src={member.imageUrl}
                              alt={member.name}
                              style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: '8px',
                                marginBottom: '0.5rem',
                                objectFit: 'contain',
                              }}
                            />
                          )}
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong style={{ color: 'var(--text)' }}>{member.name}</strong>
                          </div>
                          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                            {member.description}
                          </p>

                          {user?.role === 'admin' && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setLeadershipForm({
                                    category: member.category,
                                    name: member.name,
                                    description: member.description,
                                    order: member.order || 0
                                  });
                                  setLeadershipImage(null);
                                  setShowLeadershipModal(true);
                                }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#333',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLeadershipMember(member._id)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#dc2626',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Leadership Member Modal */}
      {showLeadershipModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={() => setShowLeadershipModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              border: '1px solid #333',
              animation: 'slideUp 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 className="hdr" style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(90deg, #fff, #ccc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <button
                onClick={() => setShowLeadershipModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  lineHeight: 1,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.color = '#fff'}
                onMouseLeave={(e) => e.target.style.color = '#888'}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleLeadershipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Category */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem', fontWeight: 500 }}>
                  Category
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={leadershipForm.category}
                    onChange={(e) => setLeadershipForm({ ...leadershipForm, category: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#2d2d2d',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      appearance: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Creators">Creators</option>
                    <option value="Abyssal">Abyssal</option>
                    <option value="Council">Council</option>
                  </select>
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem', fontWeight: 500 }}>
                  Name
                </label>
                <input
                  type="text"
                  value={leadershipForm.name}
                  onChange={(e) => setLeadershipForm({ ...leadershipForm, name: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="Enter member name"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#2d2d2d',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  value={leadershipForm.description}
                  onChange={(e) => setLeadershipForm({ ...leadershipForm, description: e.target.value })}
                  required
                  maxLength={1000}
                  rows={4}
                  placeholder="Enter description..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#2d2d2d',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '100px',
                  }}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem', fontWeight: 500 }}>
                  Image {editingMember && <span style={{ color: '#666', fontWeight: 400 }}>(Optional)</span>}
                </label>
                <div
                  style={{
                    border: '2px dashed #444',
                    borderRadius: '8px',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#252525',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => document.getElementById('leadership-image-input').click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#666'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#444'}
                >
                  <input
                    id="leadership-image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLeadershipImage(e.target.files[0])}
                    required={!editingMember}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                  <div style={{ color: '#fff', marginBottom: '0.25rem' }}>
                    {leadershipImage ? leadershipImage.name : 'Click to upload image'}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.8rem' }}>
                    Supports JPG, PNG, WEBP
                  </div>
                </div>
              </div>

              {/* Order */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem', fontWeight: 500 }}>
                  Order Priority
                </label>
                <input
                  type="number"
                  value={leadershipForm.order}
                  onChange={(e) => setLeadershipForm({ ...leadershipForm, order: parseInt(e.target.value) || 0 })}
                  min={0}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#2d2d2d',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
                <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Lower numbers appear first
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLeadershipModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    backgroundColor: 'transparent',
                    color: '#ccc',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = '#666'; e.target.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = '#444'; e.target.style.color = '#ccc'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeadership}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    backgroundColor: '#b10f2e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: submittingLeadership ? 'not-allowed' : 'pointer',
                    opacity: submittingLeadership ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => !submittingLeadership && (e.target.style.backgroundColor = '#8b0d26')}
                  onMouseLeave={(e) => !submittingLeadership && (e.target.style.backgroundColor = '#b10f2e')}
                >
                  {submittingLeadership ? 'Saving...' : (editingMember ? 'Update Member' : 'Add Member')}
                </button>
              </div>
            </form>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
          </div>
        </div>
      )}

      <section className="container" style={{ padding: '0 1rem 2rem' }}>
        <h3 className="hdr">Houses</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { name: 'Pendragon', img: '/assets/pendragon.jpeg' },
            { name: 'Phantomhive', img: '/assets/phantomhive.jpeg' },
            { name: 'Tempest', img: '/assets/tempest.jpeg' },
            { name: 'Zoldyck', img: '/assets/zoldyck.jpeg' },
            { name: 'Fritz', img: '/assets/fritz.jpeg' },
            { name: 'Elric', img: '/assets/elric.jpeg' },
            { name: 'Dragneel', img: '/assets/dragneel.jpeg' },
            { name: 'Hellsing', img: '/assets/hellsing.jpeg' },
            { name: 'Obsidian Order', img: '/assets/obsidian_order.jpeg' },
            { name: 'Council of IV', img: '/assets/counsil_of_iv.jpeg' },
            { name: 'Abyssal IV', img: '/assets/abyssal_iv.jpeg' },
            { name: 'Von Einzbern', img: '/assets/von_einzbern.jpeg' },
          ].map(d => (
            <div key={d.name} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/houses/${d.name.toLowerCase().replace(/\s+/g, '-')}`)}>
              <div style={{ position: 'relative', height: 150, background: `url(${d.img}) center/cover no-repeat` }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.0), rgba(0,0,0,.55))' }} />
                <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontWeight: 800 }}>{d.name}</div>
                  <span className="link" onClick={(e) => { e.stopPropagation(); navigate(`/houses/${d.name.toLowerCase().replace(/\s+/g, '-')}`); }}>
                    View more
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ padding: '0 1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
          <h3 className="hdr" style={{ margin: 0 }}>Upcoming Events</h3>
          <a className="link" href="/events">View all</a>
        </div>
        {loadingEvents ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No events yet.</div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {events.map((event) => (
              <div key={event.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${event.id}`)}>
                {event.imageUrl && (
                  <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: `url(${event.imageUrl}) center/cover no-repeat`,
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid rgba(148,163,184,0.1)'
                  }} />
                )}
                <div style={{ fontWeight: 700 }}>{event.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                  {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : ''}
                </div>
                <div style={{ marginTop: 6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {event.description}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span className="link" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}>
                    View more
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


