import { connectDB } from './db.js'; // adjust path
import User from '../models/User.js'; // adjust path

async function removeHeroCardUrl() {
  try {
    // First, connect to MongoDB
    await connectDB();

    const result = await User.updateMany(
      {}, // match all users
      { $unset: { heroCardUrl: "" } } // remove the field
    );

    console.log('Removed heroCardUrl from', result.modifiedCount, 'users');
  } catch (err) {
    console.error('Error removing field:', err);
  } finally {
    process.exit(0);
  }
}

removeHeroCardUrl();
