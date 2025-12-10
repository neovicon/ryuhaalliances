import mongoose from 'mongoose';

const leadershipCategories = ['Creators', 'Abyssal High', 'Council'];

const leadershipMemberSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: leadershipCategories,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for efficient querying
leadershipMemberSchema.index({ category: 1, order: 1 });

export default mongoose.model('LeadershipMember', leadershipMemberSchema);
export { leadershipCategories };
