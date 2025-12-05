import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

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

  useEffect(() => {
    loadEvents();
    loadAnnouncements();
    loadBlogs();
    loadArticles();
    loadStories();
  }, []);

  async function loadEvents() {
    try {
      setLoadingEvents(true);
      const { data } = await client.get('/events');
      setEvents(data.events.slice(0, 3)); // Show only first 3 events
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

      <section className="container" style={{ padding: '2rem 1rem' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="card"><h4 className="hdr">Our Motive</h4><p style={{ color: 'var(--muted)' }}></p></div>
          <div className="card"><h4 className="hdr">The Path</h4><p style={{ color: 'var(--muted)' }}></p></div>
          <div className="card"><h4 className="hdr">The Culture</h4><p style={{ color: 'var(--muted)' }}></p></div>
          <div className="card"><h4 className="hdr">The Houses</h4><p style={{ color: 'var(--muted)' }}></p></div>
        </div>
      </section>

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


