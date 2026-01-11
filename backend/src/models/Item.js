import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, index: true },
    cost: { type: Number, required: true },
    rarity: { type: String, enum: ['Normal', 'Rare', 'Epic', 'Legendary'], default: 'Normal' },
    desc: { type: String, default: '' },
    stats: { type: Object, default: {} }, // e.g., { str: 10, spd: 5 }
    statsText: { type: String, default: '' }, // e.g., "+10 STR, +5 SPD"
}, { timestamps: true });

export default mongoose.model('Item', itemSchema);
