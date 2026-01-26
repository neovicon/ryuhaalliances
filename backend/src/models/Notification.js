import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // Optional: for targeted notifications
    target: { type: String, enum: ['all', 'admins', 'user'], required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['blog', 'announcement', 'article', 'story', 'post', 'comment', 'signup', 'mention_everyone', 'dubbing'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String },
    link: { type: String },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For 'all' and 'admins' targets
    isRead: { type: Boolean, default: false }, // For 'user' target
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
