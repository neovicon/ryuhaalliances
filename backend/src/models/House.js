import mongoose from 'mongoose';

const houseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  funds: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

export default mongoose.model('House', houseSchema);

