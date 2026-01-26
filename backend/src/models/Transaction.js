import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    house: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['DONATION', 'PURCHASE', 'ADJUSTMENT'], required: true },
    amount: { type: Number, required: true }, // CP amount
    item: { type: String }, // For purchases
    description: { type: String },
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
