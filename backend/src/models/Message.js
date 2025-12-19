import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

// Index for pagination
messageSchema.index({ createdAt: -1 });

export default mongoose.model('Message', messageSchema);
