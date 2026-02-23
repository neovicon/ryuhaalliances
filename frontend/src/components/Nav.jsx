import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import {
  Home,
  Trophy,
  BookOpen,
  ClipboardList,
  Calendar,
  User,
  LogOut,
  ChevronDown,
  Menu as MenuIcon,
  X,
  Bell,
  MessageCircle,
  LayoutGrid
} from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import NotificationList from './NotificationList'

export default function Nav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const isActive = (p) => pathname === p

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const mainLinks = [
    { to: '/blogs', label: 'Blogs', Icon: BookOpen },
    { to: '/stories', label: 'Stories', Icon: BookOpen },
    { to: '/articles', label: 'Articles', Icon: BookOpen },
    { to: '/events', label: 'Events', Icon: Calendar },
    { to: '/ryuha-apps', label: 'RyuhaApps', Icon: LayoutGrid }
  ]

  const secondaryLinks = [
    { to: '/feed', label: 'Feed', Icon: Home, auth: true },
    { to: '/leaderboard', label: 'Leaderboard', Icon: Trophy, auth: true },
    { to: '/messenger', label: 'Messenger', Icon: MessageCircle, auth: true },
    { to: '/god', label: 'God Domain', Icon: LayoutGrid },
    { to: '/event-entries', label: 'Event Entries', Icon: Calendar },
    { to: '/beastlord', label: 'Beastlord', Icon: Trophy },
    { to: '/announcements', label: 'Announcements', Icon: Bell },
    { to: '/attendance', label: 'Attendance', Icon: ClipboardList },
    { to: '/dubbing', label: 'Gacha Animations', Icon: MessageCircle },
  ]

  // Filter links based on visibility
  const visibleMainLinks = mainLinks.filter(l => !l.auth || user)
  const visibleSecondaryLinks = secondaryLinks.filter(l => !l.auth || user)

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand link" onClick={() => setOpen(false)}>
          <div className="nav-logo" />
          <h2 className="hdr nav-title">Ryuha Alliance</h2>
        </Link>

        {/* Desktop links */}
        <div className="nav-links desktop-only">
          <div className="nav-main">
            {visibleMainLinks.map(({ to, label, Icon }) => (
              <Link key={to} to={to} className={`nav-link ${isActive(to) ? 'active' : ''}`}>
                <Icon size={16} style={{ marginRight: 8 }} />
                <span className="nav-text">{label}</span>
              </Link>
            ))}
          </div>

          <div className="nav-secondary" ref={moreRef}>
            <div className={`more-dropdown ${moreOpen ? 'open' : ''}`}>
              <button className="nav-link more-btn" onClick={() => setMoreOpen(s => !s)} aria-haspopup="true" aria-expanded={moreOpen}>
                <span className="more-label">More</span>
                <ChevronDown size={14} style={{ marginLeft: 6 }} />
              </button>
              {moreOpen && (
                <div className="more-panel">
                  {visibleSecondaryLinks.map(l => (
                    <Link key={l.to} to={l.to} className="more-item" onClick={() => setMoreOpen(false)}>
                      {l.label}
                    </Link>
                  ))}
                  <Link to="/download" className="more-item" onClick={() => setMoreOpen(false)}>Download App</Link>
                  {user?.role === 'admin' && <Link to="/admin" className="more-item" onClick={() => setMoreOpen(false)}>Admin</Link>}
                  {(user?.role === 'moderator' || user?.role === 'admin') && <Link to="/moderator" className="more-item" onClick={() => setMoreOpen(false)}>Moderator</Link>}
                  {user && <Link to="/profile" className="more-item" onClick={() => setMoreOpen(false)}>Profile</Link>}
                </div>
              )}
            </div>
          </div>

          {user && (
            <div className="nav-secondary" ref={notifRef}>
              <div className="notification-bell-container" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {notifOpen && (
                <div className="notification-dropdown">
                  <NotificationList onClose={() => setNotifOpen(false)} />
                </div>
              )}
            </div>
          )}

          <div className="nav-cta-group">
            {!user ? (
              <>
                <Link to="/login" className="btn nav-cta">Sign in</Link>
                <Link to="/signup" className="btn nav-cta outline">Sign up</Link>
              </>
            ) : (
              <button className="btn nav-cta" onClick={handleLogout}><LogOut size={14} style={{ marginRight: 8 }} />Logout</button>
            )}
          </div>
        </div>

        {/* Mobile / tablet: collapse into hamburger */}
        <div className="mobile-only">
          <button className="nav-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle navigation">
            <MenuIcon />
          </button>
          {user && (
            <div className="nav-secondary" ref={notifRef} style={{ marginLeft: '0.5rem' }}>
              <div className="notification-bell-container" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {notifOpen && (
                <div className="notification-dropdown">
                  <NotificationList onClose={() => setNotifOpen(false)} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu overlay (rendered into body via portal to avoid stacking-context clipping) */}
        {open && createPortal(
          <div className={`mobile-menu open`} onClick={() => setOpen(false)}>
            <div className="mobile-menu-inner" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
              <div className="mobile-links">
                {visibleMainLinks.map(({ to, label, Icon }) => (
                  <Link key={to} to={to} className={`mobile-link ${isActive(to) ? 'active' : ''}`} onClick={() => setOpen(false)}>
                    <Icon size={18} style={{ marginRight: 12 }} />
                    <span>{label}</span>
                  </Link>
                ))}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

                {visibleSecondaryLinks.map(({ to, label, Icon }) => (
                  <Link key={to} to={to} className={`mobile-link ${isActive(to) ? 'active' : ''}`} onClick={() => setOpen(false)}>
                    {Icon ? <Icon size={18} style={{ marginRight: 12 }} /> : <span style={{ width: 18, marginRight: 12 }} />}
                    <span>{label}</span>
                  </Link>
                ))}

                <Link to="/download" className="mobile-link" onClick={() => setOpen(false)}>
                  <span style={{ width: 18, marginRight: 12 }} />
                  <span>Download App</span>
                </Link>

                {user?.role === 'admin' && (
                  <Link to="/admin" className="mobile-link" onClick={() => setOpen(false)}>Admin</Link>
                )}
                {(user?.role === 'moderator' || user?.role === 'admin') && (
                  <Link to="/moderator" className="mobile-link" onClick={() => setOpen(false)}>Moderator</Link>
                )}
                {user && (
                  <Link to="/profile" className="mobile-link" onClick={() => setOpen(false)}><User size={18} style={{ marginRight: 12 }} />Profile</Link>
                )}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                {!user ? (
                  <>
                    <Link to="/login" className="mobile-link" onClick={() => setOpen(false)}>Sign in</Link>
                    <Link to="/signup" className="mobile-link" onClick={() => setOpen(false)}>Sign up</Link>
                  </>
                ) : (
                  <button className="mobile-link" onClick={() => { setOpen(false); handleLogout(); }}><LogOut size={16} style={{ marginRight: 12 }} />Logout</button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </nav>
  )
}
