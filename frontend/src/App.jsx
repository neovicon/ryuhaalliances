import { Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from './store/auth'
import './styles/theme.css'
import Nav from './components/Nav'
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
import Blogs from './pages/Blogs.jsx'
import BlogDetail from './pages/BlogDetail.jsx'
import HouseDetail from './pages/HouseDetail.jsx'
import Announcements from './pages/Announcements.jsx'
import AnnouncementDetail from './pages/AnnouncementDetail.jsx'
import Moderator from './pages/Moderator.jsx'
import Articles from './pages/Articles.jsx'
import Stories from './pages/Stories.jsx'
import ArticleDetail from './pages/ArticleDetail.jsx'
import StoryDetail from './pages/StoryDetail.jsx'
// Attendance feature removed



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
        <Route path="/moderator" element={<Moderator />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
  {/* Attendance route removed */}
        <Route path="/codex" element={<Codex />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:id" element={<BlogDetail />} />
  <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
  <Route path="/stories" element={<Stories />} />
        <Route path="/stories/:id" element={<StoryDetail />} />
        <Route path="/houses/:slug" element={<HouseDetail />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/announcements/:id" element={<AnnouncementDetail />} />
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
          <a href="mailto:huancut1222010@gmail.com?subject=Error Report">Report Error</a>
        </div>
      </div>
    </footer>
  )
}


