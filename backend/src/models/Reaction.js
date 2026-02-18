import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    itemModel: { type: String, required: true, enum: ['Post', 'EventEntry', 'Article', 'Announcement', 'Blog', 'Story', 'DubbingVideo'] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestId: { type: String }, // From cookie
    ip: { type: String },      // Fallback identification
    type: { type: String, required: true }, // The reaction emoji or key
}, { timestamps: true });

// Uniqueness for logged-in users
reactionSchema.index({ itemId: 1, userId: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: true, $ne: null } } });

// Uniqueness for guests with cookies
reactionSchema.index({ itemId: 1, guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $exists: true, $ne: null } } });

// Uniqueness based on IP (Fallback/Additional layer)
// Note: IP can change or be shared, so guestId is preferred.
// If both guestId and userId are missing, we might want to enforce by IP.
reactionSchema.index({ itemId: 1, ip: 1 }, { unique: true, partialFilterExpression: { guestId: { $exists: false }, userId: { $exists: false } } });

export default mongoose.model('Reaction', reactionSchema);
