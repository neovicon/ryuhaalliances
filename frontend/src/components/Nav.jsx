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
  MessageCircle
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
    { to: '/feed', label: 'Feed', Icon: Home },
    { to: '/leaderboard', label: 'Leaderboard', Icon: Trophy },
    { to: '/messenger', label: 'Messenger', Icon: MessageCircle },
    { to: '/beastlord', label: 'Beastlord', Icon: Trophy }
  ]

  // Hide certain main links for anonymous users
  const visibleMainLinks = mainLinks.filter(l => {
    // hide feed and leaderboard for anonymous users
    if (!user && (l.to === '/feed' || l.to === '/leaderboard')) return false
    return true
  })

  const secondaryLinks = [
    { to: '/events', label: 'Events' },
    { to: '/event-entries', label: 'Event Entries' },
    { to: '/blogs', label: 'Blogs' },
    { to: '/announcements', label: 'Announcements' },
    { to: '/articles', label: 'Articles' },
    { to: '/stories', label: 'Stories' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/dubbing', label: 'Ryuha VA' },
  ]

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
                  {secondaryLinks.map(l => (
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
                {user && mainLinks.map(({ to, label, Icon }) => (
                  <Link key={to} to={to} className={`mobile-link ${isActive(to) ? 'active' : ''}`} onClick={() => setOpen(false)}>
                    <Icon size={18} style={{ marginRight: 12 }} />
                    <span>{label}</span>
                  </Link>
                ))}
                {!user && visibleMainLinks.map(({ to, label, Icon }) => (
                  <Link key={to} to={to} className={`mobile-link ${isActive(to) ? 'active' : ''}`} onClick={() => setOpen(false)}>
                    <Icon size={18} style={{ marginRight: 12 }} />
                    <span>{label}</span>
                  </Link>
                ))}
                {/* Secondary + conditional links */}
                <Link to="/attendance" className="mobile-link" onClick={() => setOpen(false)}>
                  <span style={{ width: 20 }} />
                  <span>Attendance</span>
                </Link>
                <Link to="/announcements" className="mobile-link" onClick={() => setOpen(false)}>
                  <span style={{ width: 20 }} />
                  <span>Announcements</span>
                </Link>
                <Link to="/articles" className="mobile-link" onClick={() => setOpen(false)}>
                  <span style={{ width: 20 }} />
                  <span>Articles</span>
                </Link>
                <Link to="/stories" className="mobile-link" onClick={() => setOpen(false)}>
                  <span style={{ width: 20 }} />
                  <span>Stories</span>
                </Link>
                <Link to="/dubbing" className="mobile-link" onClick={() => setOpen(false)}>
                  <span style={{ width: 20 }} />
                  <span>Ryuha VA</span>
                </Link>
                <Link to="/download" className="mobile-link" onClick={() => setOpen(false)}>
                  <span style={{ width: 20 }} />
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

                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '12px 0' }} />

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
