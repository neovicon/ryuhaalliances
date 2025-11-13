import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

const houses = ['Pendragon', 'Phantomhive', 'Tempest', 'Zodylk', 'Fritz', 'Elric', 'Dragneel', 'Hellsing', 'Obsidian Order'];

const SIGIL_PATTERN = /^RA–\d{8}–\d{3}$/;

const formatSigil = (digits) => {
  const part1 = digits.slice(0, 8);
  const part2 = digits.slice(8, 11);
  let formatted = 'RA–';
  formatted += part1;
  if (part2.length > 0 || digits.length > 8) {
    formatted += '–' + part2;
  }
  return formatted;
};

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '', sigil: 'RA–', house: houses[0] });
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  
  const handleSigilChange = (rawValue) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 11);
    setForm(prev => ({ ...prev, sigil: formatSigil(digits) }));
  };
  
  const handleSignup = async () => {
    if (!SIGIL_PATTERN.test(form.sigil)) {
      setError('Sigil must follow the format RA–########–###');
      return;
    }
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
      <div className="card" style={{ maxWidth: 520, margin: '2rem auto', padding: '1.5rem' }}>
        <h3 className="hdr">Create account</h3>
        {error && <div style={{ color: 'tomato' }}>{error}</div>}
        <div
          className="grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem'
          }}
        >
          <input className="input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input className="input" placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          <input className="input" placeholder="Display name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
          <input
            className="input"
            placeholder="RA–________–___"
            inputMode="numeric"
            value={form.sigil}
            onChange={e => handleSigilChange(e.target.value)}
            onFocus={() => {
              if (!form.sigil || form.sigil === 'RA') {
                setForm(prev => ({ ...prev, sigil: 'RA–' }));
              }
            }}
          />
          <select className="input" value={form.house} onChange={e => setForm({ ...form, house: e.target.value })}>
            {houses.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center' }}>
            <button className="btn" style={{ width: '100%', maxWidth: 240 }} onClick={handleSignup}>Create account</button>
          </div>
        </div>
      </div>
    </div>
  );
}


