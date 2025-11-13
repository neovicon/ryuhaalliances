import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  async function refresh() {
    const { data } = await client.get('/posts');
    setPosts(data.posts);
  }
  useEffect(() => { refresh(); }, []);
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <textarea className="input" style={{ width: '100%', minHeight: 80 }} placeholder="Share something..." value={content} onChange={e => setContent(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.5rem' }}>
          <button className="btn" onClick={async () => { if (!content.trim()) return; await client.post('/posts', { content }); setContent(''); refresh(); }}>Post</button>
        </div>
      </div>
      <div className="grid">
        {posts.map(p => (
          <div className="card" key={p._id}>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              {p.author?.photoUrl ? (
                <img 
                  src={p.author.photoUrl} 
                  alt={p.author.username}
                  style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 18, 
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
                width: 36, 
                height: 36, 
                borderRadius: 18, 
                background: p.author?.photoUrl ? 'transparent' : 'linear-gradient(135deg, var(--primary) 0%, #8b0d26 100%)',
                border: '1px solid #1f2937',
                display: p.author?.photoUrl ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {p.author?.username?.[0] || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{p.author?.username}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(p.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ marginTop: '.5rem', lineHeight: 1.5 }}>{p.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


