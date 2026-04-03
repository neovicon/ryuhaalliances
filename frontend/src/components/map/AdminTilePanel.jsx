import { useState, useEffect } from 'react';
import { updateTile, resetTiles, fetchKnights } from '../../api/maps';
import { housesData } from '../../data/housesData';
import { Settings, RefreshCw, Save, Shield } from 'lucide-react';
import { useAuth } from '../../store/auth';

export default function AdminTilePanel({ tiles, selectedTile, onUpdate }) {
  const { user } = useAuth();
  const [selectedTileId, setSelectedTileId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [type, setType] = useState('normal');
  const [knights, setKnights] = useState([]); // All available knights
  const [selectedKnights, setSelectedKnights] = useState([]); // Selected IDs
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadAllKnights();
  }, []);

  const loadAllKnights = async () => {
    try {
      const data = await fetchKnights();
      setKnights(data);
    } catch (err) {
      console.error('Failed to fetch knights:', err);
    }
  };

  // Sync with selectedTile from map
  useEffect(() => {
    if (selectedTile) {
      setSelectedTileId(selectedTile.tileId);
      setOwnerId(selectedTile.ownerHouseId || '');
      setType(selectedTile.type || 'normal');
      setSelectedKnights(selectedTile.knights || []);
      setExpanded(true);
    }
  }, [selectedTile]);

  // Check if user is authorized to edit this tile
  // Admin can edit anything. Lord of the House can only edit tiles owned by their house.
  const isLord = user?.memberStatus === 'Lord of the House';
  const isAdmin = user?.role === 'admin';
  const userHouseData = housesData.find(h => h.name === user?.house);
  const isOwner = selectedTile?.ownerHouseId === userHouseData?.id;

  if (!isAdmin && (!isLord || !isOwner)) {
    if (expanded) setExpanded(false);
    return null;
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (selectedTileId === '') return;
    setLoading(true);
    try {
      await updateTile(selectedTileId, { 
        ownerHouseId: ownerId === '' ? null : Number(ownerId), 
        type,
        knights: selectedKnights
      });
      onUpdate();
    } catch (err) {
      alert('Failed to update tile');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all tiles to neutral?')) return;
    setLoading(true);
    try {
      await resetTiles();
      onUpdate();
    } catch (err) {
      alert('Failed to reset tiles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`admin-tile-panel ${expanded ? 'expanded' : ''}`} style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(20, 20, 22, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--primary)',
      borderRadius: '12px',
      padding: expanded ? '20px' : '10px',
      zIndex: 30,
      width: expanded ? '260px' : 'auto',
      transition: 'all 0.3s ease'
    }}>
      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="btn" style={{ padding: '8px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
          <Settings size={20} />
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 className="hdr" style={{ margin: 0, fontSize: '0.9rem' }}>{isAdmin ? 'Admin Map Control' : 'House Map Control'}</h4>
            <button onClick={() => setExpanded(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '4px' }}>Tile ID (0-143)</label>
              <input 
                type="number" 
                className="input" 
                style={{ width: '100%', padding: '6px 10px' }}
                value={selectedTileId}
                onChange={(e) => setSelectedTileId(e.target.value)}
                min="0" max="143"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '4px' }}>Owner House</label>
              <select 
                className="input" 
                style={{ width: '100%', padding: '6px 10px', opacity: user.role === 'admin' ? 1 : 0.6 }}
                value={ownerId}
                disabled={user.role !== 'admin'}
                onChange={(e) => setOwnerId(e.target.value)}
              >
                <option value="">Neutral</option>
                {housesData.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '4px' }}>Tile Type</label>
              <select 
                className="input" 
                style={{ width: '100%', padding: '6px 10px', opacity: user.role === 'admin' ? 1 : 0.6 }}
                value={type}
                disabled={user.role !== 'admin'}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="gold_mine">Gold Mine</option>
                <option value="forest">Forest</option>
              </select>
            </div>

            {ownerId && (
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '8px' }}>
                  <Shield size={14} /> Assign Knights (Max 3)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[0, 1, 2].map((idx) => (
                    <select
                      key={idx}
                      className="input"
                      style={{ width: '100%', padding: '4px 8px', fontSize: '0.8rem' }}
                      value={selectedKnights[idx] || ''}
                      onChange={(e) => {
                        const newSelected = [...selectedKnights];
                        if (e.target.value === '') {
                          newSelected.splice(idx, 1);
                        } else {
                          newSelected[idx] = e.target.value;
                        }
                        setSelectedKnights(newSelected.filter(Boolean));
                      }}
                    >
                      <option value="">-- No Knight --</option>
                      {knights
                        .filter(k => k.house === housesData.find(h => h.id === Number(ownerId))?.name)
                        .filter(k => {
                          // Allow the knight if they are already on THIS tile
                          const isOnThisTile = selectedKnights.includes(k._id);
                          if (isOnThisTile) return true;
                          
                          // Otherwise, check if they are on ANY other tile
                          const isAssignedElsewhere = tiles.some(t => 
                            t.tileId !== Number(selectedTileId) && 
                            t.knights?.some(assignedKnight => (assignedKnight._id || assignedKnight) === k._id)
                          );
                          return !isAssignedElsewhere;
                        })
                        .map(k => (
                          <option key={k._id} value={k._id}>{k.displayName || k.username} ({k.memberStatus})</option>
                        ))}
                    </select>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn" style={{ fontSize: '0.8rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Save size={14} /> {loading ? 'Saving...' : 'Update Tile'}
            </button>
            
            {user.role === 'admin' && (
              <button type="button" onClick={handleReset} disabled={loading} className="btn outline" style={{ fontSize: '0.8rem', padding: '8px', borderColor: 'var(--muted)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <RefreshCw size={14} /> Reset Map
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
}
