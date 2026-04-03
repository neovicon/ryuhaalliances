import express from 'express';
import { getTiles, updateTile, resetTiles, getKnights } from '../controllers/maps.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: get all tiles
router.get('/tiles', getTiles);

// Admin only/Lord of the House: update a tile
router.patch('/tiles/:tileId', requireAuth, updateTile);

// Admin only: reset/re-seed all tiles
router.post('/seed', requireAuth, requireAdmin, resetTiles);

// Authenticated users: get available knights (controller handles filtering)
router.get('/knights', requireAuth, getKnights);

export default router;
