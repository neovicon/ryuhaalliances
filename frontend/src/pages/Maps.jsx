import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTiles } from '../api/maps';
import OctagonMap from '../components/map/OctagonMap';
import ZoomController from '../components/map/ZoomController';
import HouseOverlayCard from '../components/map/HouseOverlayCard';
import AdminTilePanel from '../components/map/AdminTilePanel';
import { useAuth } from '../store/auth';
import { housesData } from '../data/housesData';
import { ArrowLeft, Info } from 'lucide-react';

export default function Maps() {
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [transformOrigin, setTransformOrigin] = useState('50% 50%');
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 600, h: 600 });
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  useEffect(() => {
    loadTiles();
    
    // Pinch-to-zoom for touchpads (ctrl + wheel)
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY;
        const zoomStep = 0.1;
        setZoomLevel(prev => {
          const next = Math.max(0.5, Math.min(4, prev - delta * 0.01));
          return next;
        });
      }
    };

    const mapEl = mapRef.current;
    if (mapEl) {
      mapEl.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (mapEl) mapEl.removeEventListener('wheel', handleWheel);
    };
  }, [selectedTile]);

  const loadTiles = async () => {
    try {
      const data = await fetchTiles();
      setTiles(data);
    } catch (err) {
      console.error('Error loading tiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHouseClick = (house) => {
    setSelectedHouse(house);
    setSelectedTile(null);
    setZoomLevel(2.2);
    
    // Calculate position from housesData (cx=300, cy=300, radius=240)
    const idx = housesData.findIndex(h => h.id === house.id);
    const angle = (idx * 45 - 22.5) * (Math.PI / 180);
    const hx = 300 + 240 * Math.cos(angle);
    const hy = 300 + 240 * Math.sin(angle);
    setTransformOrigin(`${(hx / 600) * 100}% ${(hy / 600) * 100}%`);
  };

  const handleTileClick = (tile) => {
    setSelectedTile(tile);
    setSelectedHouse(null);
    setZoomLevel(3);
    // tile.tx and tile.ty are the center coordinates in 600x600 space
    if (tile.tx !== undefined && tile.ty !== undefined) {
      setTransformOrigin(`${(tile.tx / 600) * 100}% ${(tile.ty / 600) * 100}%`);
    }
  };

  const handleCloseOverlay = () => {
    setZoomLevel(1);
    setTransformOrigin('50% 50%');
    setSelectedHouse(null);
    setSelectedTile(null);
  };

  if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Loading World Map...</div>;

  return (
    <div className="maps-page" style={{ height: '100vh', width: '100vw', background: 'radial-gradient(circle at center, #1a1a2e 0%, #000 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Floating Back Button */}
      <button 
        onClick={() => navigate('/')}
        style={{ 
          position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 100,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
          backdropFilter: 'blur(8px)', transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.5)'}
      >
        <ArrowLeft size={18} />
        Back
      </button>


      <div 
        ref={mapRef}
        className="map-view-container" 
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ 
          width: 'min(95vw, 900px)', 
          height: 'min(95vh, 900px)', 
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform-origin 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: `scale(${zoomLevel})`,
            transformOrigin: transformOrigin
          }}>
            <OctagonMap 
              tiles={tiles} 
              zoomLevel={zoomLevel} 
              onHouseClick={handleHouseClick}
              onTileClick={handleTileClick}
              selectedHouse={selectedHouse}
              user={user}
            />
          </div>
          
          <ZoomController zoomLevel={zoomLevel} onZoomOut={handleCloseOverlay} />

          {selectedHouse && (
            <HouseOverlayCard 
              house={selectedHouse} 
              onClose={handleCloseOverlay} 
            />
          )}

          {selectedTile && (
            <div className="tile-info-card" style={{
              position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(20, 20, 22, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
              padding: '20px', borderRadius: '16px', backdropFilter: 'blur(10px)',
              width: '280px', textAlign: 'center', zIndex: 25, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
              <h3 className="hdr" style={{ margin: '0 0 10px 0' }}>Tile #{selectedTile.tileId}</h3>
              <div style={{ color: 'var(--muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
                Coordinates: ({selectedTile.x}, {selectedTile.y})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem' }}>Occupation:</span>
                <span style={{ fontWeight: 'bold', color: selectedTile.ownerHouseId ? housesData.find(h => h.id === selectedTile.ownerHouseId).color : 'var(--muted)' }}>
                  {selectedTile.ownerHouseId ? housesData.find(h => h.id === selectedTile.ownerHouseId).name : 'Unclaimed'}
                </span>
              </div>
              {selectedTile.knights?.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--primary)' }}>
                  Knights Present: {selectedTile.knights.length}
                </div>
              )}
              <button 
                onClick={handleCloseOverlay}
                className="btn outline" 
                style={{ marginTop: '15px', fontSize: '0.8rem', width: '100%' }}
              >
                Close Info
              </button>
            </div>
          )}

          {(user?.role === 'admin' || user?.memberStatus === 'Lord of the House') && (
            <AdminTilePanel 
              tiles={tiles} 
              selectedTile={selectedTile}
              onUpdate={loadTiles} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
