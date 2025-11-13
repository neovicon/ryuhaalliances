import mongoose from 'mongoose';

const houses = ['Pendragon', 'Phantomhive', 'Tempest', 'Zodylk', 'Fritz', 'Elric', 'Dragneel', 'Hellsing', 'Obsidian Order'];

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  emailVerified: { type: Boolean, default: false },
  passwordHash: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  displayName: { type: String },
  sigil: { type: String, required: true },
  house: { type: String, enum: houses, required: true },
  photoUrl: { type: String },
  heroCardUrl: { type: String },
  points: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  adminMessage: { type: String },
  rank: { type: String, default: 'Novice' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
export const allowedHouses = houses;


