import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import client from '../api/client';
import { getRankImageSrc, calculateRank } from '../utils/rank';

function getHouseImageSrc(houseName) {
  if (!houseName) return '/assets/pendragon.jpeg';
  const houseMap = {
    'pendragon': 'pendragon',
    'phantomhive': 'phantomhive',
    'tempest': 'tempest',
    'zoldyck': 'zoldyck',
    'fritz': 'fritz',
    'elric': 'elric',
    'dragneel': 'dragneel',
    'hellsing': 'hellsing',
    'obsidian-order': 'obsidian_order',
    'council-of-iv': 'counsil_of_iv',
    'abyssal-iv': 'abyssal_iv',
  };
  const fileName = houseMap[houseName.toLowerCase()] || houseName.toLowerCase().replace(/-/g, '_');
  return `/assets/${fileName}.jpeg`;
}

function getHouseName(slug) {
  const nameMap = {
    'pendragon': 'Pendragon',
    'phantomhive': 'Phantomhive',
    'tempest': 'Tempest',
    'zoldyck': 'Zoldyck',
    'fritz': 'Fritz',
    'elric': 'Elric',
    'dragneel': 'Dragneel',
    'hellsing': 'Hellsing',
    'obsidian-order': 'Obsidian Order',
    'council-of-iv': 'Council of IV',
    'abyssal-iv': 'Abyssal IV',
  };
  return nameMap[slug.toLowerCase()] || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getHouseDescription(houseName) {
  const descriptions = {
    'Pendragon': 'A house of legendary warriors and noble knights, embodying honor, chivalry, and unwavering loyalty. Members of Pendragon stand as guardians of tradition and defenders of justice.',
    'Phantomhive': 'Masters of shadow and precision, Phantomhive represents elegance, intelligence, and strategic thinking. This house values perfection and the art of subtlety.',
    'Tempest': 'A force of nature and raw power, Tempest embodies strength, resilience, and the unstoppable spirit of those who rise above adversity.',
    'Zoldyck': 'The house of assassins and silent guardians, Zoldyck values discipline, precision, and the mastery of one\'s craft. Members are known for their dedication and skill.',
    'Fritz': 'Warriors of justice and protectors of the innocent, Fritz represents courage, determination, and the unwavering pursuit of what is right.',
    'Elric': 'Scholars and alchemists, Elric embodies knowledge, transformation, and the pursuit of understanding. This house values wisdom and the power of learning.',
    'Dragneel': 'A house of fire and passion, Dragneel represents friendship, loyalty, and the burning spirit of those who never give up. Members are known for their fierce determination.',
    'Hellsing': 'Guardians of the night and protectors of secrets, Hellsing values strength, independence, and the power to stand alone against darkness.',
    'Obsidian Order': 'The elite and mysterious order, Obsidian Order represents power, strategy, and the mastery of both light and shadow. Members are the architects of change.',
    'Council of IV': 'A house of wisdom and governance, Council of IV represents leadership, unity, and the collective strength of those who guide and protect.',
    'Abyssal IV': 'A house of depth and mystery, Abyssal IV represents the hidden depths of power, resilience, and the unyielding force that emerges from the shadows.',
  };
  return descriptions[houseName] || 'A distinguished house within the Ryuha Alliance, dedicated to honor, discipline, and unity.';
}

export default function HouseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const houseName = getHouseName(slug);
  const houseImage = getHouseImageSrc(slug);
  const [houseData, setHouseData] = useState(null);
  const [loadingHouse, setLoadingHouse] = useState(true);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    async function loadHouse() {
      try {
        setLoadingHouse(true);
        const { data } = await client.get('/admin/house', { params: { houseName } });
        setHouseData(data.house || {
          name: houseName,
          description: getHouseDescription(houseName),
          status: 'Active'
        });
      } catch (error) {
        console.error('Error loading house:', error);
        setHouseData({
          name: houseName,
          description: getHouseDescription(houseName),
          status: 'Active'
        });
      } finally {
        setLoadingHouse(false);
      }
    }
    if (houseName) {
      loadHouse();
    }
  }, [houseName]);

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoadingMembers(true);
        const { data } = await client.get('/admin/house-members', { params: { house: houseName } });
        setMembers(data.members || []);
      } catch (error) {
        console.error('Error loading house members:', error);
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    }
    if (houseName) {
      loadMembers();
    }
  }, [houseName]);

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

      {loadingHouse ? (
        <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)', marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: 'var(--muted)' }}>Loading house information...</div>
        </div>
      ) : houseData ? (
        <>
          <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)', marginBottom: '1.5rem' }}>
            <h2 className="hdr" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>About</h2>
            <p style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
              {houseData.description || getHouseDescription(houseName)}
            </p>
          </div>

          <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)', marginBottom: '1.5rem' }}>
            <h2 className="hdr" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>House Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>House Name</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>House {houseData.name || houseName}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>House Funds</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '1.2rem', color: '#10b981' }}>{houseData.funds || 0} CP</div>
                  <button
                    className="btn"
                    onClick={async () => {
                      const amount = prompt("Enter CP amount to donate to House Funds:");
                      if (amount && !isNaN(amount) && parseInt(amount) > 0) {
                        try {
                          await client.post('/beastlord/donate', {
                            amount: parseInt(amount),
                            targetHouseName: houseData.name
                          });
                          alert(`Thank you for donating ${amount} CP!`);
                          // Refresh house data
                          const { data } = await client.get('/admin/house', { params: { houseName: houseData.name } });
                          setHouseData(data.house);
                        } catch (err) {
                          alert(err.response?.data?.error || "Donation failed");
                        }
                      }
                    }}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Donate CP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="card" style={{ border: '1px solid rgba(148,163,184,0.2)' }}>
        <h2 className="hdr" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Members</h2>
        {loadingMembers ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Loading members...</div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No members found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {members.map((member) => {
              const memberRank = member.rank || calculateRank(member.points || 0);
              return (
                <div
                  key={member.id || member._id}
                  style={{
                    border: '1px solid rgba(148,163,184,0.25)',
                    borderRadius: '12px',
                    padding: '1rem',
                    background: 'rgba(15,23,42,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.username}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(148,163,184,0.3)'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), #8b0d26)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                      }}
                    >
                      {member.username?.[0] || 'U'}
                    </div>
                  )}
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                      {member.displayName || member.username}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      @{member.username}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                        <img
                          src={getRankImageSrc(memberRank)}
                          alt={memberRank}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                          style={{ width: 18, height: 18, objectFit: 'contain', verticalAlign: 'middle', marginRight: '0.25rem' }}
                        />
                        {memberRank}
                      </span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>•</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{member.points || 0} points</span>
                    </div>
                  </div>
                  {member.memberStatus && (
                    <div style={{ flex: '0 0 auto' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '999px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          background: 'rgba(177, 15, 46, 0.2)',
                          color: 'rgba(177, 15, 46, 1)',
                          border: '1px solid rgba(177, 15, 46, 0.3)'
                        }}
                      >
                        {member.memberStatus}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

