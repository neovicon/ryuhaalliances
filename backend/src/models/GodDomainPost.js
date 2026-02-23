import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
    key: { type: String, required: true },
    userIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }
}, { _id: false });

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
}, { timestamps: true });

const godDomainPostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    house: { type: String, required: true, index: true },
    content: { type: String },
    image: { type: String },
    reactions: { type: [reactionSchema], default: [] },
    comments: { type: [commentSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('GodDomainPost', godDomainPostSchema);
