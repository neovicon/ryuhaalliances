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
    const trimmedName = name ? name.trim() : '';
    if (games.has(trimmedName)) {
      socket.emit('error', 'Game name already exists');
      return;
    }
    games.set(trimmedName, {
      password: password ? password.trim() : '',
      host: { id: socket.id, username, board, start, end, currentPos: start },
      joiner: null,
      turn: username, // Host starts first (by username)
      status: 'waiting',
      spectators: new Set(),
      log: [{ text: `System initialized. Game "${name}" created. Waiting for opponent...`, type: 'system', time: new Date().toLocaleTimeString() }]
    });
    socket.join(name);
    console.log(`Game created: ${name} by ${username}`);
    socket.emit('game_created', { name });
  });

  socket.on('join_game', ({ name, password, board, start, end, username }) => {
    const trimmedName = name ? name.trim() : '';
    const trimmedPassword = password ? password.trim() : '';
    const game = games.get(trimmedName);
    if (!game) {
      console.log(`Join attempt failed: Game "${trimmedName}" not found. Available:`, Array.from(games.keys()));
      socket.emit('error', 'Game not found');
      return;
    }
    if (game.password !== trimmedPassword) {
      console.log(`Join attempt failed: Incorrect password for "${trimmedName}".`);
      socket.emit('error', 'Incorrect password');
      return;
    }
    if (game.joiner) {
      socket.emit('error', 'Game is full');
      return;
    }

    game.joiner = { id: socket.id, username, board, start, end, currentPos: game.host.start };
    game.host.currentPos = start;
    game.status = 'playing';

    socket.join(name);
    console.log(`User ${username} joined game ${name}`);

    const startMsg = { text: `Match initiated: ${game.host.username} vs ${game.joiner.username}`, type: 'system', time: new Date().toLocaleTimeString() };
    game.log.push(startMsg);

    // Notify everyone
    io.to(trimmedName).emit('game_started', {
      host: game.host.username,
      joiner: game.joiner.username,
      hostPos: game.host.currentPos,
      joinerPos: game.joiner.currentPos,
      hostTarget: game.joiner.end,
      joinerTarget: game.host.end,
      turn: game.turn, // Now a username
      log: startMsg.text,
      name: trimmedName,
      password: game.password
    });

    // Send initial opponent data (masked)
    io.to(game.host.id).emit('opponent_data', { start: game.joiner.start, end: game.joiner.end });
    io.to(game.joiner.id).emit('opponent_data', { start: game.host.start, end: game.host.end });
  });

  socket.on('reconnect_game', ({ name, password, username }) => {
    const trimmedName = name ? name.trim() : '';
    const trimmedPassword = password ? password.trim() : '';
    const game = games.get(trimmedName);
    if (!game || game.password !== trimmedPassword) {
      console.log(`Reconnect failed: Game "${trimmedName}" not found or credentials invalid. User: ${username}`);
      socket.emit('error', 'Game not found or invalid credentials');
      return;
    }

    let isHost = game.host.username === username;
    let isJoiner = game.joiner && game.joiner.username === username;

    if (!isHost && !isJoiner) {
      socket.emit('error', 'Access denied: not a player in this game');
      return;
    }

    socket.join(name);
    if (isHost) game.host.id = socket.id;
    else if (isJoiner) game.joiner.id = socket.id;

    // Refresh turn ID if I was the turn holder
    if (game.turn && (isHost || isJoiner)) {
      // Since turn was a socket.id, we should update it if it matched our old one?
      // Actually, it's better if 'turn' is indexed by role or username, but for now 
      // we'll just check if the player whose turn it was just reconnected.
      // Wait, if game.turn was the OLD socket.id, we need to update it.
      // Let's assume for now the client handles 'whose turn it is' via username or we update the turn.
      // Better: update the turn to the new socket id if it was their turn.
      // We don't have the old socket.id anymore. Let's make 'turn' role-based or update it here.
    }

    socket.emit('reconnected', {
      status: game.status,
      turn: game.turn,
      myPosition: isHost ? game.host.currentPos : game.joiner.currentPos,
      opponentPosition: isHost ? (game.joiner ? game.joiner.currentPos : null) : game.host.currentPos,
      opponentData: isHost ? (game.joiner ? { start: game.joiner.start, end: game.joiner.end } : null) : { start: game.host.start, end: game.host.end },
      log: game.log,
      hostName: game.host.username,
      joinerName: game.joiner ? game.joiner.username : null,
      startCell: isHost ? game.host.start : (game.joiner ? game.joiner.start : null),
      endCell: isHost ? game.host.end : (game.joiner ? game.joiner.end : null),
      walls: Array.from(isHost ? game.host.board : (game.joiner ? game.joiner.board : []))
    });

    io.to(name).emit('player_reconnected', { username });
  });

  socket.on('spectate_game', ({ name }) => {
    const game = games.get(name);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }
    socket.join(name);
    game.spectators.add(socket.id);

    socket.emit('spectating_started', {
      hostName: game.host.username,
      joinerName: game.joiner ? game.joiner.username : null,
      hostPos: game.host.currentPos,
      joinerPos: game.joiner ? game.joiner.currentPos : null,
      hostTarget: game.joiner ? game.joiner.end : null,
      joinerTarget: game.host.end,
      status: game.status,
      turn: game.turn,
      log: game.log
    });
  });

  socket.on('make_move', ({ gameName, targetCell }) => {
    const isHost = socket.id === game.host.id;
    const isJoiner = game.joiner && socket.id === game.joiner.id;
    const player = isHost ? game.host : (isJoiner ? game.joiner : null);

    if (!player) {
      socket.emit('error', 'Not a player in this game');
      return;
    }

    if (game.turn !== player.username) {
      socket.emit('error', 'Not your turn');
      return;
    }

    const opponent = isHost ? game.joiner : game.host;

    const fromPos = player.currentPos;
    const [currR, currC] = fromPos.split('-').map(Number);
    const [targetR, targetC] = targetCell.split('-').map(Number);

    const formatCoord = (r, c) => `${String.fromCharCode(65 + c)}${r + 1}`;
    const moveStr = `${formatCoord(currR, currC)}-${formatCoord(targetR, targetC)}`;

    const dist = Math.abs(currR - targetR) + Math.abs(currC - targetC);
    if (dist !== 1) {
      socket.emit('move_result', { success: false, message: 'Invalid move: must be adjacent' });
      game.turn = opponent.username; // Switch turn on mistake
      io.to(gameName).emit('turn_update', { turn: game.turn });
      return;
    }

    let wallKey = null;
    if (currR === targetR) {
      if (targetC > currC) wallKey = `v-${currR}-${targetC}`;
      else wallKey = `v-${currR}-${currC}`;
    } else {
      if (targetR > currR) wallKey = `h-${targetR}-${currC}`;
      else wallKey = `h-${currR}-${currC}`;
    }

    if (opponent.board.includes(wallKey)) {
      const hitMsg = { text: `${player.username} hit a wall at ${moveStr}`, type: 'warning', time: new Date().toLocaleTimeString() };
      game.log.push(hitMsg);
      socket.emit('move_result', { success: false, message: `You hit a wall at ${moveStr}!` });
      game.turn = opponent.username;
      io.to(gameName).emit('turn_update', {
        turn: game.turn,
        log: hitMsg.text
      });
    } else {
      player.currentPos = targetCell;
      if (player.currentPos === opponent.end) {
        const winMsg = `${player.username} reached the destination! GAME OVER.`;
        game.log.push({ text: winMsg, type: 'system', time: new Date().toLocaleTimeString() });
        io.to(gameName).emit('game_over', {
          winner: player.username,
          hostBoard: game.host.board,
          joinerBoard: game.joiner.board,
          log: winMsg
        });
        games.delete(gameName);
      } else {
        const moveMsg = `${player.username} moved to ${formatCoord(targetR, targetC)}`;
        game.log.push({ text: moveMsg, type: 'info', time: new Date().toLocaleTimeString() });
        socket.emit('move_result', { success: true, position: targetCell });
        // game.turn = opponent.id; // REMOVED: Keep turn on success
        io.to(gameName).emit('game_update', {
          player: player.username,
          from: fromPos,
          to: targetCell,
          moveStr: moveStr,
          turn: game.turn
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


