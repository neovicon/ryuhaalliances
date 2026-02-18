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
app.set('trust proxy', 1);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_ORIGIN || 'https://ryuhaalliance.online',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: ["GET", "POST"]
  }
});


// --- Labyrinth Game Logic ---
const games = new Map();

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

  socket.on('create_game', ({ name, password, board, start, end, username }) => {
    if (games.has(name)) {
      socket.emit('error', 'Game name already exists');
      return;
    }
    games.set(name, {
      password,
      host: { id: socket.id, username, board, start, end, currentPos: start },
      joiner: null,
      turn: socket.id, // Host starts first
      status: 'waiting'
    });
    socket.join(name);
    console.log(`Game created: ${name} by ${username}`);
    socket.emit('game_created', { name });
  });

  socket.on('join_game', ({ name, password, board, start, end, username }) => {
    const game = games.get(name);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }
    if (game.password !== password) {
      socket.emit('error', 'Incorrect password');
      return;
    }
    if (game.joiner) {
      socket.emit('error', 'Game is full');
      return;
    }

    game.joiner = { id: socket.id, username, board, start, end, currentPos: start };
    game.status = 'playing';

    socket.join(name);
    console.log(`User ${username} joined game ${name}`);

    // Notify both players
    io.to(name).emit('game_started', {
      host: game.host.username,
      joiner: game.joiner.username,
      turn: game.host.id
    });

    // Send initial opponent data (masked)
    io.to(game.host.id).emit('opponent_data', { start: game.joiner.start, end: game.joiner.end });
    io.to(game.joiner.id).emit('opponent_data', { start: game.host.start, end: game.host.end });
  });

  socket.on('make_move', ({ gameName, targetCell }) => {
    const game = games.get(gameName);
    if (!game || game.status !== 'playing') return;

    if (game.turn !== socket.id) {
      socket.emit('error', 'Not your turn');
      return;
    }

    const isHost = socket.id === game.host.id;
    const player = isHost ? game.host : game.joiner;
    const opponent = isHost ? game.joiner : game.host;

    const fromPos = player.currentPos; // Store previous position

    // Validate Move (Adjacency & Range)
    const [currR, currC] = fromPos.split('-').map(Number);
    const [targetR, targetC] = targetCell.split('-').map(Number);

    // Coordinate Helper: 0-0 -> A1
    const formatCoord = (r, c) => `${String.fromCharCode(65 + c)}${r + 1}`;
    const fromStr = formatCoord(currR, currC);
    const toStr = formatCoord(targetR, targetC);
    const moveStr = `${fromStr}-${toStr}`;

    // Check range (must be adjacent, no diagonals)
    const dist = Math.abs(currR - targetR) + Math.abs(currC - targetC);
    if (dist !== 1) {
      socket.emit('move_result', { success: false, message: 'Invalid move: must be adjacent' });
      // Turn passes to opponent as penalty
      game.turn = opponent.id;
      io.to(gameName).emit('turn_update', { turn: game.turn });
      return;
    }

    // Check Wall (Against OPPONENT'S board)
    // Wall key format: v-r-c or h-r-c
    let wallKey = null;
    if (currR === targetR) {
      // Horizontal move
      if (targetC > currC) wallKey = `v-${currR}-${targetC}`;
      else wallKey = `v-${currR}-${currC}`;
    } else {
      // Vertical move
      if (targetR > currR) wallKey = `h-${targetR}-${currC}`;
      else wallKey = `h-${currR}-${currC}`;
    }

    // Opponent board is Set-like array
    if (opponent.board.includes(wallKey)) {
      // Hit a wall!
      socket.emit('move_result', { success: false, message: `You hit a wall at ${moveStr}!` });
      game.turn = opponent.id;
      io.to(gameName).emit('turn_update', {
        turn: game.turn,
        log: `${player.username} hit a wall at ${moveStr}`
      });
    } else {
      // Valid move
      player.currentPos = targetCell;

      // Check Win
      if (player.currentPos === opponent.end) {
        // Send game over with BOTH boards so players can see the hidden walls
        io.to(gameName).emit('game_over', {
          winner: player.username,
          hostBoard: game.host.board,
          joinerBoard: game.joiner.board
        });
        games.delete(gameName);
      } else {
        socket.emit('move_result', { success: true, position: targetCell });
        // Send 'from' and 'to' so opponent can see the move animation/log
        io.to(gameName).emit('game_update', {
          player: player.username,
          from: fromPos,
          to: targetCell,
          moveStr: moveStr
        });
      }
    }
  });
  // --- End Labyrinth Logic ---

  socket.on('disconnect', () => {
    // Clean up games if host disconnects?
    // For now, simple log
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


