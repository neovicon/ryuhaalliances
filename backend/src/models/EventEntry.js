import mongoose from 'mongoose';

const eventEntrySchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin who uploaded it
    memberName: { type: String, required: true },
    description: { type: String },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },

    // Registered user reactions
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, required: true } // Any emoji string
    }],

    // Visitor reactions (counters)
    visitorReactions: {
        heart: { type: Number, default: 0 },
        laugh: { type: Number, default: 0 },
        thumbsUp: { type: Number, default: 0 }
    },

    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default mongoose.model('EventEntry', eventEntrySchema);
