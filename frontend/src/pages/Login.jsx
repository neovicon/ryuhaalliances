import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Login() {
  const login = useAuth(state => state.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [adminMessage, setAdminMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      setError(null);
      setAdminMessage(null);
      setLoading(true);
      await login(email, password);
      // Save or clear credentials based on 'remember' checkbox
      try {
        if (remember) {
          localStorage.setItem('ra_saved_email', email || '');
          localStorage.setItem('ra_saved_password', password || '');
          localStorage.setItem('ra_remember', '1');
        } else {
          localStorage.removeItem('ra_saved_email');
          localStorage.removeItem('ra_saved_password');
          localStorage.removeItem('ra_remember');
        }
      } catch (e) {
        // ignore storage errors
      }
      navigate('/profile');
    } catch (e) {
      const errorData = e?.response?.data;
      setError(errorData?.error || 'Login failed');
      if (errorData?.adminMessage) {
        setAdminMessage(errorData.adminMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load saved credentials if present
    try {
      const saved = localStorage.getItem('ra_remember');
      if (saved === '1') {
        const savedEmail = localStorage.getItem('ra_saved_email') || '';
        const savedPassword = localStorage.getItem('ra_saved_password') || '';
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRemember(true);
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

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

          <div style={{ position: 'relative' }}>
            <input
              className="input"
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              <span style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Save credentials</span>
            </label>
          </div>

          <button 
            className="btn" 
            onClick={handleLogin}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading && (
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            )}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
