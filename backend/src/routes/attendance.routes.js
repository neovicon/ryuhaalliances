import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAttendance, updateAttendance } from '../controllers/attendance.controller.js';

const router = Router();

// GET /api/attendance?house=HouseName&weekStart=YYYY-MM-DD
router.get('/', requireAuth, getAttendance);

// PATCH /api/attendance/:id  (Overseer only enforced in controller)
router.patch('/:id', requireAuth, updateAttendance);

export default router;
