import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/auth';
import client from '../api/client';

export default function Login() {
  const login = useAuth(state => state.login);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [view, setView] = useState('login'); // 'login', 'forgot-password', 'reset-password', 'magic-link'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [adminMessage, setAdminMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle Magic Link Login on Mount
  useEffect(() => {
    const token = searchParams.get('token');
    const action = searchParams.get('action');

    if (token && action === 'magic-login') {
      const verifyMagicLink = async () => {
        try {
          setLoading(true);
          setError(null);
          const { data } = await client.post('/auth/verify-login-link', { token });

          // Manually update store
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          useAuth.setState({ token: data.token, user: data.user });

          navigate('/profile');
        } catch (e) {
          setError(e?.response?.data?.error || 'Invalid or expired login link');
        } finally {
          setLoading(false);
        }
      };
      verifyMagicLink();
    }
  }, [searchParams, navigate]);

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

  const handleForgotPassword = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      await client.post('/auth/forgot-password', { email });
      setSuccess('Verification code sent to your email.');
      setView('reset-password');
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      await client.post('/auth/reset-password', { email, code: resetCode, newPassword });
      setSuccess('Password reset successfully. Please login.');
      setView('login');
      setPassword('');
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      await client.post('/auth/send-login-link', { email });
      setSuccess('Login link sent! Check your email.');
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to send login link');
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

  const renderLoginForm = () => (
    <>
      <h3 className="hdr">Sign in</h3>
      {error && <div style={{ color: 'tomato', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255, 99, 71, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 99, 71, 0.3)' }}>{error}</div>}
      {success && <div style={{ color: '#4ade80', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>{success}</div>}
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => { setView('forgot-password'); setError(null); setSuccess(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
          >
            Forgot Password?
          </button>
        </div>

        <button
          className="btn"
          onClick={handleLogin}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {loading && <span className="spinner" />}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Or</span>
        </div>

        <button
          className="btn"
          onClick={() => { setView('magic-link'); setError(null); setSuccess(null); }}
          disabled={loading}
          style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', marginTop: '0.5rem' }}
        >
          Login with Magic Link
        </button>
      </div>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
      <h3 className="hdr">Reset Password</h3>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter your email to receive a verification code.</p>
      {error && <div style={{ color: 'tomato', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255, 99, 71, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 99, 71, 0.3)' }}>{error}</div>}

      <div className="grid">
        <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />

        <button
          className="btn"
          onClick={handleForgotPassword}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Code'}
        </button>

        <button
          type="button"
          onClick={() => { setView('login'); setError(null); setSuccess(null); }}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginTop: '1rem' }}
        >
          Back to Login
        </button>
      </div>
    </>
  );

  const renderResetPasswordForm = () => (
    <>
      <h3 className="hdr">Enter New Password</h3>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter the code sent to {email} and your new password.</p>
      {error && <div style={{ color: 'tomato', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255, 99, 71, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 99, 71, 0.3)' }}>{error}</div>}
      {success && <div style={{ color: '#4ade80', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>{success}</div>}

      <div className="grid">
        <input className="input" placeholder="Verification Code" value={resetCode} onChange={e => setResetCode(e.target.value)} />
        <input className="input" placeholder="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />

        <button
          className="btn"
          onClick={handleResetPassword}
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <button
          type="button"
          onClick={() => { setView('forgot-password'); setError(null); setSuccess(null); }}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginTop: '1rem' }}
        >
          Back
        </button>
      </div>
    </>
  );

  const renderMagicLinkForm = () => (
    <>
      <h3 className="hdr">Login with Magic Link</h3>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter your email to receive a login link.</p>
      {error && <div style={{ color: 'tomato', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255, 99, 71, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 99, 71, 0.3)' }}>{error}</div>}
      {success && <div style={{ color: '#4ade80', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>{success}</div>}

      <div className="grid">
        <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />

        <button
          className="btn"
          onClick={handleSendMagicLink}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Login Link'}
        </button>

        <button
          type="button"
          onClick={() => { setView('login'); setError(null); setSuccess(null); }}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginTop: '1rem' }}
        >
          Back to Login
        </button>
      </div>
    </>
  );

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '2rem auto' }}>
        {view === 'login' && renderLoginForm()}
        {view === 'forgot-password' && renderForgotPasswordForm()}
        {view === 'reset-password' && renderResetPasswordForm()}
        {view === 'magic-link' && renderMagicLinkForm()}
      </div>
      <style>{`
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
