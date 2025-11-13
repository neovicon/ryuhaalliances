export default function Events() {
  const items = [
    { id: 1, title: 'Pendragon Training Summit', date: '2025-12-02', desc: 'Advanced discipline drills and leadership practice.' },
    { id: 2, title: 'Tempest Strategy Jam', date: '2025-12-10', desc: 'Rapid-fire rounds on execution and team cohesion.' },
    { id: 3, title: 'Elric Research Night', date: '2025-12-18', desc: 'Deep dive into tactics and data-backed improvements.' },
  ];
  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h2 className="hdr">Events</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {items.map(e => (
          <div key={e.id} className="card">
            <div style={{ fontWeight: 700 }}>{e.title}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{new Date(e.date).toLocaleDateString()}</div>
            <div style={{ marginTop: 6 }}>{e.desc}</div>
            <div style={{ marginTop: 8 }}>
              <a className="link" href="#">Details</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


