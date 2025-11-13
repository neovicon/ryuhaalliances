import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  
  const handleLogin = async () => {
    try {
      await login(email, password);
      navigate('/profile');
    } catch (e) {
      setError(e?.response?.data?.error || 'Login failed');
    }
  };
  
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '2rem auto' }}>
        <h3 className="hdr">Sign in</h3>
        {error && <div style={{ color: 'tomato' }}>{error}</div>}
        <div className="grid">
          <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn" onClick={handleLogin}>Sign in</button>
        </div>
      </div>
    </div>
  );
}


