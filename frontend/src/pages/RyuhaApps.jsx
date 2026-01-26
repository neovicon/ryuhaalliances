import { Link } from 'react-router-dom';
import '../styles/theme.css';

const RyuhaApps = () => {
    const apps = [
        {
            name: "Coinflip",
            description: "Test your luck with a flip of a coin. Heads or Tails?",
            thumbnail: "/assets/coinflip.png",
            path: "/ryuha-apps/coinflip"
        }
    ];

    return (
        <div className="container" style={{ paddingTop: '100px', minHeight: '80vh' }}>
            <div className="hdr-group">
                <h1 className="hdr" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>RyuhaApps</h1>
                <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
                    Exclusive tools and mini-games for the Ryuha Alliance community.
                </p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
                {apps.map((app, index) => (
                    <Link to={app.path} key={index} className="card" style={{ textDecoration: 'none', transition: 'transform 0.3s ease', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', paddingTop: '56.25%', background: '#111' }}>
                            <img
                                src={app.thumbnail}
                                alt={app.name}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <h3 className="hdr" style={{ margin: '0 0 0.5rem 0' }}>{app.name}</h3>
                            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>{app.description}</p>
                            <div style={{ marginTop: '1.5rem', color: 'var(--accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                Launch App <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <style>{`
                .card:hover {
                    transform: translateY(-10px);
                    border-color: var(--accent) !important;
                }
            `}</style>
        </div>
    );
};

export default RyuhaApps;
