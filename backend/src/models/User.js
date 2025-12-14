import mongoose from 'mongoose';

const houses = ['Pendragon', 'Phantomhive', 'Tempest', 'Zoldyck', 'Fritz', 'Elric', 'Dragneel', 'Hellsing', 'Obsidian Order', 'Council of IV', 'Abyssal IV'];

const memberStatuses = ['Creator of the Realm', 'Guardian', 'Lord of the House', 'General', 'Seeker', 'Herald', 'Watcher', 'Knight of Genesis', 'Knight of I', 'Knight of II', 'Knight of III', 'Knight of IV', 'Knight of V', 'Commoner'];

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationCode: { type: String },
  emailVerificationCodeExpires: { type: Date },
  passwordResetCode: { type: String },
  passwordResetExpires: { type: Date },
  passwordHash: { type: String, required: true },
  username: { type: String, required: true, index: true },
  displayName: { type: String },
  sigil: { type: String, required: true },
  house: { type: String, enum: houses, required: true },
  photoUrl: { type: String },
  heroCardUrl: { type: String },
  certificates: [{ type: String }], // Array of certificate file paths
  warningNotice: { type: String }, // Warning notice file path (image)
  warningText: { type: String }, // Warning notice text
  points: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  moderatorType: { type: String, enum: ['Arbiter', 'Artisan', 'Vigil', 'Aesther', 'Gatekeeper', 'Overseer'], default: null },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  adminMessage: { type: String },
  rank: { type: String, default: 'Novice' },
  memberStatus: { type: String, enum: memberStatuses },
  isDubber: { type: Boolean, default: false }, // Can upload dubbing videos
}, { timestamps: true });

// Compound unique indexes: allow same email/username only if status is different
// This allows declined users' credentials to be reused for new signups
userSchema.index({ email: 1, status: 1 }, { unique: true });
userSchema.index({ username: 1, status: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
export const allowedHouses = houses;
export const allowedMemberStatuses = memberStatuses;
export const moderatorTypes = ['Arbiter', 'Artisan', 'Vigil', 'Aesther', 'Gatekeeper', 'Overseer'];


