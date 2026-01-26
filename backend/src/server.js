import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';

if (!global.crypto) {
  global.crypto = crypto;
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/post.routes.js';
import blogRoutes from './routes/blog.routes.js';
import adminRoutes from './routes/admin.routes.js';
import eventRoutes from './routes/event.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import articleRoutes from './routes/article.routes.js';
import storyRoutes from './routes/story.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import imageRoutes from './routes/image.routes.js';
import dubbingRoutes from './routes/dubbing.routes.js';
import leadershipRoutes from './routes/leadership.routes.js';
import eventEntryRoutes from './routes/eventEntry.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import beastlordRoutes from './routes/beastlord.routes.js';

import { createServer } from 'http';
import { Server } from 'socket.io';
import messageRoutes from './routes/message.routes.js';
import Message from './models/Message.js';
import { getPhotoUrl } from './utils/photoUrl.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_ORIGIN || 'https://ryuhaalliance.online',
      'http://localhost:5173'
    ],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_chat', (userData) => {
    socket.join('global_chat');
    console.log(`User ${userData.username} joined global chat`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { sender, content } = data;

      const senderId = sender?._id || sender?.id || sender;

      if (!senderId) {
        console.error('Invalid sender data:', sender);
        return;
      }

      // Save to DB
      const newMessage = await Message.create({
        sender: senderId,
        content
      });

      // Populate sender info
      await newMessage.populate('sender', 'username photoUrl');

      const msgObj = newMessage.toObject();
      if (msgObj.sender && msgObj.sender.photoUrl) {
        msgObj.sender.photoUrl = await getPhotoUrl(msgObj.sender.photoUrl);
      }

      // Broadcast to everyone in global chat
      io.to('global_chat').emit('receive_message', msgObj);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const corsOptions = {
  origin: [
    process.env.CLIENT_ORIGIN || 'https://ryuhaalliance.online',
    'http://localhost:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Configure Helmet with content security policy that allows images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter);

// Serve static files with CORS enabled
app.use('/uploads', cors(corsOptions), express.static('src/uploads'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
// Mount blog routes under /api/blogs to match frontend expectations
app.use('/api/blogs', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/dubbing', dubbingRoutes);
app.use('/api/beastlord', beastlordRoutes);
app.use('/api/leadership', leadershipRoutes);
app.use('/api/event-entries', eventEntryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);


const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  httpServer.listen(PORT, () => console.log(`API running on :${PORT}`));
  console.log('Server restarted at ' + new Date().toISOString());
}).catch((err) => {
  console.error('DB connection failed', err);
  process.exit(1);
});


