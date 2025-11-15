import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Login() {
  const login = useAuth(state => state.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [adminMessage, setAdminMessage] = useState(null);

  const handleLogin = async () => {
    try {
      setError(null);
      setAdminMessage(null);
      await login(email, password);
      navigate('/profile');
    } catch (e) {
      const errorData = e?.response?.data;
      setError(errorData?.error || 'Login failed');
      if (errorData?.adminMessage) {
        setAdminMessage(errorData.adminMessage);
      }
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '2rem auto' }}>
        <h3 className="hdr">Sign in</h3>
        {error && <div style={{ color: 'tomato', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255, 99, 71, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 99, 71, 0.3)' }}>{error}</div>}
        {adminMessage && (
          <div style={{ color: 'var(--text)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
            <strong>Admin Message:</strong> {adminMessage}
          </div>
        )}
        <div className="grid">
          <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn" onClick={handleLogin}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
