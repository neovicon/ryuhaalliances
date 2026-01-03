import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { getRankImageSrc, calculateRank } from '../utils/rank';

// Helper function to get house image path
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
    'Obsidian Order': 'obsidian_order',
    'Council of IV': 'counsil_of_iv',
    'Abyssal IV': 'abyssal_iv'
  };
  const fileName = houseMap[houseName] || houseName.toLowerCase().replace(' ', '_');
  return `/assets/${fileName}.jpeg`;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [houseFunds, setHouseFunds] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { (async () => { const { data } = await client.get('/users/leaderboard'); setRows(data.top || []); setHouseFunds(data.houses || []); })(); }, []);

  // Apply search filter (by username or house) before grouping
  const filteredRows = rows.filter((user) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const username = (user.username || '').toLowerCase();
    const house = (user.house || '').toLowerCase();
    return username.includes(q) || house.includes(q);
  });

  // Group users by house name
  const groupedUsers = filteredRows.reduce((acc, user) => {
    const house = user.house || 'Unknown';
    if (!acc[house]) {
      acc[house] = [];
    }
    acc[house].push(user);
    return acc;
  }, {});

  // Sort houses by total points (sum of all members' points)
  const sortedHouses = Object.entries(groupedUsers).sort((a, b) => {
    const aTotal = a[1].reduce((sum, u) => sum + (u.points || 0), 0);
    const bTotal = b[1].reduce((sum, u) => sum + (u.points || 0), 0);
    return bTotal - aTotal;
  });

  return (
    <div className="container">
      <h3 className="hdr">Leaderboard</h3>
      <div style={{ margin: '1rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users or houses"
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.12)',
            background: 'transparent',
            color: 'inherit'
          }}
        />
        {search ? (
          <button className="btn" onClick={() => setSearch('')} style={{ whiteSpace: 'nowrap' }}>Clear</button>
        ) : null}
      </div>

      {/* Houses Leaderboard */}
      {sortedHouses.map(([houseName, users]) => {
        const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
        const houseTotal = users.reduce((sum, u) => sum + (u.points || 0), 0);

        return (
          <div key={houseName} className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid #1f2937' }}>
              <img
                src={getHouseImageSrc(houseName)}
                alt={houseName}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
              <div style={{ flex: 1 }}>
                <h4 className="hdr" style={{ margin: 0, fontSize: '1.5rem' }}>{houseName}</h4>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>{users.length} member{users.length !== 1 ? 's' : ''}</span>
                  <span>Total: {houseTotal} points</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>House Funds: {houseFunds.find(h => h.name === houseName)?.funds || 0} CP</span>
                </div>
              </div>
            </div>

            {sortedUsers.map((r, i) => {
              const userRank = r.rank || calculateRank(r.points || 0);
              return (
                <div
                  key={r.username}
                  onClick={() => navigate(`/profile?q=${encodeURIComponent(r.username)}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/profile?q=${encodeURIComponent(r.username)}`); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid #1f2937', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {r.photoUrl ? (
                      <img
                        src={r.photoUrl}
                        alt={r.username}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          border: '1px solid #1f2937',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      background: r.photoUrl ? 'transparent' : 'linear-gradient(135deg, var(--primary) 0%, #8b0d26 100%)',
                      border: '1px solid #1f2937',
                      display: r.photoUrl ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      color: 'white',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {r.username?.[0] || 'U'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img
                        src={getRankImageSrc(userRank)}
                        alt={userRank}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          objectFit: 'contain'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>#{i + 1} {r.username}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{userRank}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{r.points}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}


