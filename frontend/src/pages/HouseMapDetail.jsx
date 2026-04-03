import { useParams, useNavigate } from 'react-router-dom';
import { getHouseById } from '../data/housesData';
import HouseDetailTabs from '../components/map/HouseDetailTabs';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';

export default function HouseMapDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const house = getHouseById(id);

  if (!house) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>House not found.</div>;

  return (
    <div className="house-detail-page fade-in">
      {/* Hero Header */}
      <div className="house-hero" style={{ 
        background: `linear-gradient(to bottom, ${house.color}44, var(--bg))`,
        padding: '6rem 0 3rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="container">
          <button 
            onClick={() => navigate('/maps')} 
            className="link" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', opacity: 0.7 }}
          >
            <ArrowLeft size={18} /> Back to Map
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '24px', 
              background: house.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              border: '4px solid white',
              boxShadow: `0 10px 40px ${house.color}66`
            }}>
              {house.name.charAt(0)}
            </div>
            <div>
              <h1 className="hdr" style={{ fontSize: '3rem', margin: 0 }}>{house.name}</h1>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                   <MapIcon size={14} /> Regional Power
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ marginTop: '3rem' }}>
        <HouseDetailTabs house={house} />
      </div>
    </div>
  );
}
