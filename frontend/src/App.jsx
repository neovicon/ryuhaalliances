import { Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from './store/auth'
import './styles/theme.css'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Feed from './pages/Feed.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Admin from './pages/Admin.jsx'
import Profile from './pages/Profile.jsx'
import Home from './pages/Home.jsx'
import Codex from './pages/Codex.jsx'
import Events from './pages/Events.jsx'
import EventDetail from './pages/EventDetail.jsx'
import HouseDetail from './pages/HouseDetail.jsx'

function Nav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const isActive = (p) => pathname === p
  const { user, logout } = useAuth()
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <div className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-brand link" onClick={() => setOpen(false)}>
          <div className="nav-logo" />
          <h2 className="hdr nav-title">Ryuha Alliance</h2>
        </Link>
        <div className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          {user && (
            <>
              <Link to="/feed" className={`nav-link ${isActive('/feed') ? 'active' : ''}`}>Feed</Link>
              <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`}>Leaderboard</Link>
            </>
          )}
          <Link to="/events" className={`nav-link ${isActive('/events') ? 'active' : ''}`}>Events</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>Admin</Link>
          )}
          {user && (
            <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>Profile</Link>
          )}
          {!user ? (
            <>
              <Link to="/login" className="btn nav-cta">Sign in</Link>
              <Link to="/signup" className="btn nav-cta" style={{ background: 'transparent', border: '1px solid #2a2a2d', marginLeft: 6 }}>Sign up</Link>
            </>
          ) : (
            <button className="btn nav-cta" onClick={handleLogout}>Logout</button>
          )}
        </div>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
          <span>Menu</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { token, loadUser } = useAuth();

  useEffect(() => {
    // Validate token and load user on app mount
    // This ensures user data is fresh and token is still valid
    if (token) {
      loadUser();
    }
  }, []); // Only run on mount

  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/codex" element={<Codex />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/houses/:slug" element={<HouseDetail />} />
      </Routes>
      <Footer />
    </>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h4 className="hdr">Ryuha Alliance</h4>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>United by honor, discipline, courage, growth, and unity.</p>
        </div>
        <div>
          <h4 className="hdr">Social</h4>
          <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
            <a href="https://www.facebook.com/groups/1Brd988fMv/" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-facebook" style={{marginRight: 8}}></i> Facebook
            </a>
            <a href="https://m.me/j/Abah_xP2JTbUxM1C/" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-facebook-messenger" style={{marginRight: 8}}></i> Messenger
            </a>
            <a href="https://www.youtube.com/@ryuha-alliances" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-youtube" style={{marginRight: 8}}></i> YouTube
            </a>
            <a href="https://discord.gg/ZxVqUaZF" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-discord" style={{marginRight: 8}}></i> Discord
            </a>
          </div>
        </div>
        <div>
          <h4 className="hdr">Join / Contact</h4>
          <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
            <a href="mailto:contact@ryuha-alliances.org">contact@ryuha-alliances.org</a>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfdvm7nvw912EFOQUqzQNnW9GUFHZc-Zfmz8Dwo6T097gnKPQ/viewform?usp=header" target="_blank" rel="noreferrer">How to join</a>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfdvm7nvw912EFOQUqzQNnW9GUFHZc-Zfmz8Dwo6T097gnKPQ/viewform?usp=header" target="_blank" rel="noreferrer">Codex (Policies)</a>
          </div>
        </div>
      </div>
      <div className="footer-inner footer-bottom">
        <div style={{ color: 'var(--muted)' }}>© {new Date().getFullYear()} Ryuha Alliance. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSfdvm7nvw912EFOQUqzQNnW9GUFHZc-Zfmz8Dwo6T097gnKPQ/formResponse">Privacy & Policies</a>
        </div>
      </div>
    </footer>
  )
}


