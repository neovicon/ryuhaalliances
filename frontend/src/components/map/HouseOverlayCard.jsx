import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, Shield, User } from 'lucide-react';
import client from '../../api/client';

export default function HouseOverlayCard({ house, onClose }) {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        const { data } = await client.get('/admin/house-members', { params: { house: house.name } });
        setMembers(data.members || []);
      } catch (error) {
        console.error('Error loading house members:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [house.name]);

  const guardians = members.filter(m => m.memberStatus?.toLowerCase().includes('guardian'));
  const knights = members.filter(m => m.memberStatus?.toLowerCase().includes('knight'));

  return (
    <div className="house-overlay-card" style={{
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '320px',
      background: 'rgba(20, 20, 22, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      zIndex: 20,
      animation: 'slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'transparent',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer'
        }}
      >
        <X size={20} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '12px', 
          background: house.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          border: '2px solid white'
        }}>
          {house.name.charAt(0)}
        </div>
        <div>
          <h3 className="hdr" style={{ margin: 0, color: 'white' }}>{house.name}</h3>
        </div>
      </div>

      <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text)', marginBottom: '24px', opacity: 0.9 }}>
        {house.shortSummary}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Members</div>
          <div style={{ fontWeight: 'bold' }}>{house.membersCount}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Guardians</div>
          <div style={{ fontWeight: 'bold' }}>{guardians.length}</div>
        </div>
      </div>

      <div style={{ marginBottom: '24px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
        {guardians.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Shield size={12} /> Guardians
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {guardians.map(m => (
                <div key={m.id || m._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {m.photoUrl ? (
                    <img src={m.photoUrl} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                  ) : (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                      {m.username.charAt(0)}
                    </div>
                  )}
                  <span style={{ fontSize: '0.85rem' }}>{m.displayName || m.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {knights.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.75rem', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <User size={12} /> Knights
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {knights.map(m => (
                <div key={m.id || m._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {m.photoUrl ? (
                    <img src={m.photoUrl} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                  ) : (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#60a5fa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                      {m.username.charAt(0)}
                    </div>
                  )}
                  <span style={{ fontSize: '0.85rem' }}>{m.displayName || m.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button 
        className="btn" 
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onClick={() => navigate(`/houses/${house.slug}`)}
      >
        View House Details <ExternalLink size={16} />
      </button>
    </div>
  );
}
