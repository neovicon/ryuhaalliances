// Script to seed Vermillion house into the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const houseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  funds: { type: Number, default: 0 },
  blessingPoints: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

const House = mongoose.model('House', houseSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await House.findOne({ name: 'Vermillion' });
    if (existing) {
      console.log('House Vermillion already exists in the database:', existing.toObject());
    } else {
      const house = await House.create({
        name: 'Vermillion',
        description: 'The Flame of House Vermillion burns eternal — a proud and fierce bloodline of warrior royals from the Clover Kingdom. Members of Vermillion carry an unbreakable fire in their hearts, embodying passion, strength, and the untamed spirit of those who rise to become kings.',
        status: 'Active',
        funds: 0,
        blessingPoints: 0,
      });
      console.log('✅ House Vermillion created:', house.toObject());
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
