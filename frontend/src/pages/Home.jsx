import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    loadEvents();
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
            { name: 'Zodlyck', img: '/assets/zodlyck.jpeg' },
            { name: 'Fritz', img: '/assets/fritz.jpeg' },
            { name: 'Elric', img: '/assets/elric.jpeg' },
            { name: 'Dragneel', img: '/assets/dragneel.jpeg' },
            { name: 'Hellsing', img: '/assets/hellsing.jpeg' },
            { name: 'Obsidian Order', img: '/assets/obsidian_order.jpeg' },
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


