import mongoose from 'mongoose';

const welcomePostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String, required: true }, // Azure Blob storage key
}, { timestamps: true });

export default mongoose.model('WelcomePost', welcomePostSchema);
