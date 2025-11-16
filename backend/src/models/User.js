import mongoose from 'mongoose';

const houses = ['Pendragon', 'Phantomhive', 'Tempest', 'Zoldyck', 'Fritz', 'Elric', 'Dragneel', 'Hellsing', 'Obsidian Order', 'Council of IV', 'Abyssal IV'];

const memberStatuses = ['Guardian', 'Lord of the House', 'General', 'Seeker', 'Herald', 'Watcher', 'Knight of Genesis', 'Knight of I', 'Knight of II', 'Knight of III', 'Knight of IV', 'Knight of V', 'Commoner'];

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
  moderatorType: { type: String, enum: ['Arbiter', 'Artisan', 'Vigil', 'Aesther', 'Gatekeeper', 'Overseer'], default: null },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  adminMessage: { type: String },
  rank: { type: String, default: 'Novice' },
  memberStatus: { type: String, enum: memberStatuses },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
export const allowedHouses = houses;
export const allowedMemberStatuses = memberStatuses;
export const moderatorTypes = ['Arbiter', 'Artisan', 'Vigil', 'Aesther', 'Gatekeeper', 'Overseer'];


