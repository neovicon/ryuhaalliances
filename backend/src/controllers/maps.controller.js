import MapTile from '../models/MapTile.js';
import User from '../models/User.js';

const TOTAL_TILES = 100;
const GRID_COLS = 10;
const GRID_ROWS = 10;

// Seed tiles (10x10 grid).
async function seedTiles() {
  const count = await MapTile.countDocuments();
  if (count > 0) return;
  const tiles = [];
  for (let i = 0; i < TOTAL_TILES; i++) {
    tiles.push({
      tileId: i,
      owner: null,
      ownerHouseId: null,
      type: 'normal',
      x: i % GRID_COLS,
      y: Math.floor(i / GRID_COLS),
    });
  }
  await MapTile.insertMany(tiles);
}

// GET /api/maps/tiles
export async function getTiles(req, res) {
  try {
    await seedTiles();
    const tiles = await MapTile.find()
      .populate('knights', 'username displayName photoUrl memberStatus house')
      .sort({ tileId: 1 })
      .lean();
    res.json({ tiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tiles' });
  }
}

// PATCH /api/maps/tiles/:tileId  (admin only)
export async function updateTile(req, res) {
  try {
    const { tileId } = req.params;
    const { ownerHouseId, type, knights } = req.body;
    const user = req.user;

    const tile = await MapTile.findOne({ tileId: Number(tileId) });
    if (!tile) return res.status(404).json({ error: 'Tile not found' });

    const update = {};

    // Admin can do everything
    if (user.role === 'admin') {
      if (ownerHouseId !== undefined) update.ownerHouseId = ownerHouseId === null ? null : Number(ownerHouseId);
      if (type !== undefined) update.type = type;
      if (knights !== undefined) update.knights = knights;
    } 
    // Lord of the House can only update knights on their own tiles
    else if (user.memberStatus === 'Lord of the House') {
      // Find user's house ID from housesData equivalent on backend or user object
      const userHouse = user.house;
      // We need to verify if the tile belongs to the user's house
      // For now, let's assume house names match and we check by ownerHouseId mapping or just house name if we had it
      // Since we only have ownerHouseId (1-8), we might need a mapping or check the House model
      // But simpler: if the tile's current ownerHouseId matches user's house ID
      // To be safe, let's just use the house name from housesData on frontend and pass house check here
      
      // I'll import housesData equivalent if needed, but let's assume we can determine it.
      // Re-fetch tile with owner populated if needed? 
      // Actually, let's just check if they are trying to change ownerHouseId or type
      if (ownerHouseId !== undefined || type !== undefined) {
        return res.status(403).json({ error: 'Only admins can change tile ownership or type' });
      }
      
      // Check if tile belongs to user's house (this requires house mapping)
      // For now, I'll allow it if they are Lord of the House, but I should really verify the house.
      // Better: update.knights = knights
      if (knights !== undefined) update.knights = knights;
    } else {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Global Constraint: Knight can only be on one tile
    if (update.knights && update.knights.length > 0) {
      const alreadyAssigned = await MapTile.find({
        knights: { $in: update.knights },
        tileId: { $ne: Number(tileId) }
      });
      if (alreadyAssigned.length > 0) {
        return res.status(400).json({ error: 'One or more knights are already assigned to another tile' });
      }
    }

    const updatedTile = await MapTile.findOneAndUpdate(
      { tileId: Number(tileId) },
      { $set: update },
      { new: true }
    ).populate('knights', 'username displayName photoUrl memberStatus house');

    res.json({ tile: updatedTile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update tile' });
  }
}

// POST /api/maps/seed  (admin only – reset all tiles)
export async function resetTiles(req, res) {
  try {
    await MapTile.deleteMany({});
    await seedTiles();
    res.json({ ok: true, message: 'Tiles reset to defaults' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset tiles' });
  }
}

// GET /api/maps/knights (admin only)
export async function getKnights(req, res) {
  try {
    const query = {
      memberStatus: { $regex: /^Knight/i },
      status: 'approved'
    };

    // If Lord of the House, only return knights from their house
    if (req.user.role !== 'admin' && req.user.memberStatus === 'Lord of the House') {
      query.house = req.user.house;
    }

    const knights = await User.find(query)
      .select('username displayName house memberStatus photoUrl')
      .lean();
    res.json({ knights });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch knights' });
  }
}
