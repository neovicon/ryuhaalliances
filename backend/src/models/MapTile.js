import mongoose from 'mongoose';

const mapTileSchema = new mongoose.Schema({
  tileId: { type: Number, required: true, unique: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'House', default: null },
  ownerHouseId: { type: Number, default: null }, // 1-8, for quick frontend lookup
  type: { type: String, enum: ['normal', 'gold_mine', 'forest'], default: 'normal' },
  knights: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  x: { type: Number, required: true },
  y: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('MapTile', mapTileSchema);
