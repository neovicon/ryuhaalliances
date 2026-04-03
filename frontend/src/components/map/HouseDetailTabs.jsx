import { useState } from 'react';

export default function HouseDetailTabs({ house }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'guardians', label: 'Guardians' },
    { id: 'beasts', label: 'Beasts' },
    { id: 'knights', label: 'Knights' },
    { id: 'flags', label: 'Flags' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-content fade-in">
            <p style={{ lineHeight: 1.8, fontSize: '1.1rem', opacity: 0.9 }}>{house.shortSummary}</p>
            <div style={{ marginTop: '2rem' }}>
              <h4 className="hdr" style={{ color: house.color }}>Mortal Strength</h4>
              <p>Current active members: <strong>{house.membersCount}</strong></p>
            </div>
          </div>
        );
      case 'members':
        return (
          <div className="tab-content fade-in">
            <h4 className="hdr" style={{ color: house.color }}>House Members</h4>
            <p>Our ranks are filled with dedicated warriors, scholars, and explorers.</p>
            {/* List would go here */}
            <div className="card" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
              Member list integration coming soon...
            </div>
          </div>
        );
      case 'guardians':
      case 'beasts':
      case 'knights':
      case 'flags':
        const items = house[activeTab];
        return (
          <div className="tab-content fade-in">
            <h4 className="hdr" style={{ color: house.color, textTransform: 'capitalize' }}>{activeTab}</h4>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginTop: '1.5rem' }}>
              {items.map((item, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', borderTop: `4px solid ${house.color}` }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                    {activeTab === 'beasts' ? '🐉' : activeTab === 'knights' ? '🛡️' : activeTab === 'guardians' ? '⚔️' : '🚩'}
                  </div>
                  <h5 style={{ margin: 0 }}>{item}</h5>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="house-tabs">
      <div className="tabs-header" style={{ 
        display: 'flex', 
        gap: '1rem', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '5px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${house.color}` : '3px solid transparent',
              color: activeTab === tab.id ? 'white' : 'var(--muted)',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-body">
        {renderContent()}
      </div>
    </div>
  );
}
