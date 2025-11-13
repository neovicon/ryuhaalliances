import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

const groups = ['Pendragon', 'Phantomhive', 'Tempest', 'Zodylk', 'Fritz', 'Elric', 'Dragneel', 'Hellsing'];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '', sigil: '', group: groups[0] });
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  
  const handleSignup = async () => {
    try { 
      await signup(form);
      setIsPending(true);
      // Don't navigate, show pending message instead
    } catch (e) { 
      let errorMsg = e?.response?.data?.error || 'Signup failed';
      if (!errorMsg && e?.response?.data?.errors) {
        errorMsg = e.response.data.errors.map(err => 
          `${err.param || err.path}: ${err.msg}`
        ).join(', ');
      }
      setError(errorMsg); 
    } 
  };
  
  if (isPending) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: 520, margin: '2rem auto', textAlign: 'center' }}>
          <h3 className="hdr">Account Created Successfully</h3>
          <div style={{ 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, rgba(177,15,46,0.1) 0%, rgba(177,15,46,0.05) 100%)',
            border: '1px solid rgba(177,15,46,0.2)',
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text)' }}>
              Your account is pending
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
              Your account has been created and is waiting for admin approval. 
              You will be able to sign in once an admin approves your account.
            </p>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn" onClick={() => navigate('/login')}>
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: '2rem auto' }}>
        <h3 className="hdr">Create account</h3>
        {error && <div style={{ color: 'tomato' }}>{error}</div>}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <input className="input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input className="input" placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          <input className="input" placeholder="Display name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
          <input className="input" placeholder="Sigil code" value={form.sigil} onChange={e => setForm({ ...form, sigil: e.target.value })} />
          <select className="input" value={form.group} onChange={e => setForm({ ...form, group: e.target.value })}>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <div style={{ gridColumn: '1/-1' }}>
            <button className="btn" onClick={handleSignup}>Create account</button>
          </div>
        </div>
      </div>
    </div>
  );
}


