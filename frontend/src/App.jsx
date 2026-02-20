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
import EventEntries from './pages/EventEntries.jsx'
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
import Attendance from './pages/Attendance.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Dubbing from './pages/Dubbing.jsx'
import DubbingVideoDetail from './pages/DubbingVideoDetail.jsx'
import Download from './pages/Download.jsx'
import Music from './pages/Music.jsx'
import Beastlord from './pages/Beastlord.jsx'
import RyuhaApps from './pages/RyuhaApps.jsx'
import Coinflip from './pages/Coinflip.jsx'
import TicTacToe from './pages/TicTacToe.jsx'
import Labyrinth from './pages/Labyrinth.jsx'
import MusicPlayer from './components/MusicPlayer.jsx'
import SearchBar from './components/SearchBar.jsx'
import Messenger from './pages/Messenger.jsx'
import EventSpecificEntries from './pages/EventSpecificEntries.jsx'
import LabyrinthSpectator from './pages/LabyrinthSpectator.jsx'
import { MusicPlayerProvider } from './context/MusicPlayerContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'


export default function App() {
  const { token, loadUser } = useAuth();

  useEffect(() => {
    // Validate token and load user on app mount
    // This ensures user data is fresh and token is still valid
    if (token) {
      loadUser();
    }
  }, []); // Only run on mount

  const location = useLocation();
  const isMessenger = location.pathname === '/messenger';

  return (
    <MusicPlayerProvider>
      <SocketProvider>
        <NotificationProvider>
          {!isMessenger && <Nav />}
          {!isMessenger && <MusicPlayer />}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            {/* Standardized post routes - both singular and plural pointing to details to handle legacy data */}
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/messenger" element={<Messenger />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/moderator" element={<Moderator />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path='/attendance' element={<Attendance />} />
            <Route path="/codex" element={<Codex />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:id/entries" element={<EventSpecificEntries />} />
            <Route path="/event-entries" element={<EventEntries />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:id" element={<BlogDetail />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/stories/:id" element={<StoryDetail />} />
            <Route path="/houses/:slug" element={<HouseDetail />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/announcements/:id" element={<AnnouncementDetail />} />
            <Route path="/dubbing" element={<Dubbing />} />
            <Route path="/dubbing/:id" element={<DubbingVideoDetail />} />
            <Route path="/download" element={<Download />} />
            <Route path="/music" element={<Music />} />
            <Route path="/beastlord" element={<Beastlord />} />
            <Route path="/ryuha-apps" element={<RyuhaApps />} />
            <Route path="/ryuha-apps/coinflip" element={<Coinflip />} />
            <Route path="/ryuha-apps/tictactoe" element={<TicTacToe />} />
            <Route path="/ryuha-apps/labyrinth" element={<Labyrinth />} />
            <Route path="/labyrinth/spectate/:gameName" element={<LabyrinthSpectator />} />
          </Routes>
          {useLocation().pathname !== '/messenger' && <Footer />}
        </NotificationProvider>
      </SocketProvider>
    </MusicPlayerProvider>
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
              <i className="fa-brands fa-facebook" style={{ marginRight: 8 }}></i> Facebook
            </a>
            <a href="https://m.me/j/Abah_xP2JTbUxM1C/" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-facebook-messenger" style={{ marginRight: 8 }}></i> Messenger
            </a>
            <a href="https://www.youtube.com/@ryuha-alliances" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-youtube" style={{ marginRight: 8 }}></i> YouTube
            </a>
            <a href="https://discord.gg/ZxVqUaZF" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-discord" style={{ marginRight: 8 }}></i> Discord
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

