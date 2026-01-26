import mongoose from 'mongoose';

const dubbingVideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    videoUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        type: {
            type: String,
            enum: ['like', 'love', 'fire', 'clap', 'laugh'],
            default: 'like'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    views: {
        type: Number,
        default: 0
    },
    shareCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
dubbingVideoSchema.index({ uploader: 1, createdAt: -1 });
dubbingVideoSchema.index({ createdAt: -1 });

const DubbingVideo = mongoose.model('DubbingVideo', dubbingVideoSchema);

export default DubbingVideo;
