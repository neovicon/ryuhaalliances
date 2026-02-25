import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../store/auth';

function getHouseImageSrc(houseName) {
    if (!houseName) return '/assets/pendragon.jpeg';
    const houseMap = {
        'Pendragon': 'pendragon',
        'Phantomhive': 'phantomhive',
        'Tempest': 'tempest',
        'Zoldyck': 'zoldyck',
        'Fritz': 'fritz',
        'Elric': 'elric',
        'Dragneel': 'dragneel',
        'Hellsing': 'hellsing',
        'Von Einzbern': 'von_einzbern'
    };
    const fileName = houseMap[houseName] || houseName.toLowerCase().replace(' ', '_');
    return `/assets/${fileName}.jpeg`;
}

export default function GodDomainOverview() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHouses();
    }, []);

    async function loadHouses() {
        try {
            setLoading(true);
            const { data } = await client.get('/god-domain/houses');
            const excludedHouses = ['Obsidian Order', 'Council of IV', 'Abyssal IV'];
            const filteredHouses = (data.houses || []).filter(h => !excludedHouses.includes(h.name));
            setHouses(filteredHouses);
        } catch (error) {
            console.error('Error loading houses:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>Loading God Domain...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="hdr" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>God Domain</h1>
                <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>The sacred halls of the Great Houses</p>
            </header>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {houses.map((house) => (
                    <div
                        key={house._id}
                        className="card"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '2rem',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            border: house.name === user?.house ? '1px solid var(--primary)' : '1px solid rgba(148,163,184,0.1)'
                        }}
                        onClick={() => navigate(`/god/${house.name.toLowerCase().replace(' ', '-')}`)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <img
                            src={getHouseImageSrc(house.name)}
                            alt={house.name}
                            style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: '1.5rem', borderRadius: '12px' }}
                            onError={(e) => { e.target.src = '/assets/pendragon.jpeg'; }}
                        />
                        <h3 className="hdr" style={{ margin: '0 0 0.5rem 0' }}>{house.name}</h3>
                        <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '1rem' }}>
                            ✨ {house.blessingPoints || 0} Blessing Points
                        </div>
                        {house.name === user?.house && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(177, 15, 46, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                Your House
                            </span>
                        )}
                        <button className="btn" style={{ marginTop: '1.5rem', width: '100%' }}>Enter Domain</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
