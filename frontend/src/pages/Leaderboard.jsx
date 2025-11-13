import { useEffect, useState } from 'react';
import client from '../api/client';
import { getRankImageSrc, calculateRank } from '../utils/rank';

// Helper function to get house image path
function getHouseImageSrc(houseName) {
  if (!houseName) return '/assets/pendragon.jpeg';
  const houseMap = {
    'Pendragon': 'pendragon',
    'Phantomhive': 'phantomhive',
    'Tempest': 'tempest',
    'Zodylk': 'zodlyck', // Note: file is zodlyck.jpeg but house name is Zodylk
    'Fritz': 'fritz',
    'Elric': 'elric',
    'Dragneel': 'dragneel',
    'Hellsing': 'hellsing',
    'Obsidian Order': 'obsidian_order'
  };
  const fileName = houseMap[houseName] || houseName.toLowerCase().replace(' ', '_');
  return `/assets/${fileName}.jpeg`;
}

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const { data } = await client.get('/users/leaderboard'); setRows(data.top); })(); }, []);
  
  // Group users by house name
  const groupedUsers = rows.reduce((acc, user) => {
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
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  {users.length} member{users.length !== 1 ? 's' : ''} • Total: {houseTotal} points
                </div>
              </div>
            </div>
            
            {sortedUsers.map((r, i) => {
              const userRank = r.rank || calculateRank(r.points || 0);
              return (
                <div key={r.username} style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid #1f2937' }}>
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


