import { useParams, useNavigate } from 'react-router-dom';

function getHouseImageSrc(houseName) {
  if (!houseName) return '/assets/pendragon.jpeg';
  const houseMap = {
    'pendragon': 'pendragon',
    'phantomhive': 'phantomhive',
    'tempest': 'tempest',
    'zodlyck': 'zodlyck',
    'fritz': 'fritz',
    'elric': 'elric',
    'dragneel': 'dragneel',
    'hellsing': 'hellsing',
    'obsidian-order': 'obsidian_order',
  };
  const fileName = houseMap[houseName.toLowerCase()] || houseName.toLowerCase().replace(/-/g, '_');
  return `/assets/${fileName}.jpeg`;
}

function getHouseName(slug) {
  const nameMap = {
    'pendragon': 'Pendragon',
    'phantomhive': 'Phantomhive',
    'tempest': 'Tempest',
    'zodlyck': 'Zodlyck',
    'fritz': 'Fritz',
    'elric': 'Elric',
    'dragneel': 'Dragneel',
    'hellsing': 'Hellsing',
    'obsidian-order': 'Obsidian Order',
  };
  return nameMap[slug.toLowerCase()] || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getHouseDescription(houseName) {
  const descriptions = {
    'Pendragon': 'A house of legendary warriors and noble knights, embodying honor, chivalry, and unwavering loyalty. Members of Pendragon stand as guardians of tradition and defenders of justice.',
    'Phantomhive': 'Masters of shadow and precision, Phantomhive represents elegance, intelligence, and strategic thinking. This house values perfection and the art of subtlety.',
    'Tempest': 'A force of nature and raw power, Tempest embodies strength, resilience, and the unstoppable spirit of those who rise above adversity.',
    'Zodlyck': 'The house of assassins and silent guardians, Zodlyck values discipline, precision, and the mastery of one\'s craft. Members are known for their dedication and skill.',
    'Fritz': 'Warriors of justice and protectors of the innocent, Fritz represents courage, determination, and the unwavering pursuit of what is right.',
    'Elric': 'Scholars and alchemists, Elric embodies knowledge, transformation, and the pursuit of understanding. This house values wisdom and the power of learning.',
    'Dragneel': 'A house of fire and passion, Dragneel represents friendship, loyalty, and the burning spirit of those who never give up. Members are known for their fierce determination.',
    'Hellsing': 'Guardians of the night and protectors of secrets, Hellsing values strength, independence, and the power to stand alone against darkness.',
    'Obsidian Order': 'The elite and mysterious order, Obsidian Order represents power, strategy, and the mastery of both light and shadow. Members are the architects of change.',
  };
  return descriptions[houseName] || 'A distinguished house within the Ryuha Alliance, dedicated to honor, discipline, and unity.';
}

export default function HouseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const houseName = getHouseName(slug);
  const houseImage = getHouseImageSrc(slug);
  const description = getHouseDescription(houseName);

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <button
        className="btn"
        onClick={() => navigate('/')}
        style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid rgba(148,163,184,0.3)' }}
      >
        ← Back to Home
      </button>

      <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', padding: 0, overflow: 'hidden' }}>
        <div style={{
          width: '100%',
          height: 400,
          background: `url(${houseImage}) center/cover no-repeat`,
          backgroundSize: 'cover',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.7))'
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '2rem',
            color: 'white'
          }}>
            <h1 className="hdr" style={{ fontSize: '3rem', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              House {houseName}
            </h1>
          </div>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)', marginBottom: '1.5rem' }}>
        <h2 className="hdr" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>About</h2>
        <p style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '1rem' }}>
          {description}
        </p>
      </div>

      <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)' }}>
        <h2 className="hdr" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>House Information</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>House Name</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>House {houseName}</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Status</div>
            <div style={{ fontWeight: 600 }}>Active</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Alliance</div>
            <div style={{ fontWeight: 600 }}>Ryuha Alliance</div>
          </div>
        </div>
      </div>
    </div>
  );
}

