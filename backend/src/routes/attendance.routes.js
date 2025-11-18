import { Router } from 'express';
import { requireAuth, requireOverseer } from '../middleware/auth.js';
import { getAttendance, upsertAttendance, validateGetAttendance, validateUpsertAttendance, upsertDailyAttendance, validateDailyAttendance } from '../controllers/attendance.controller.js';

const router = Router();

// GET /api/attendance?house=HouseName&week=YYYY-MM-DD
router.get('/', requireAuth, validateGetAttendance, getAttendance);

// POST /api/attendance  (Overseer only)
router.post('/', requireAuth, requireOverseer, validateUpsertAttendance, upsertAttendance);

// POST /api/attendance/daily  (Overseer only) - set a user's attendance for a specific date
router.post('/daily', requireAuth, requireOverseer, validateDailyAttendance, upsertDailyAttendance);

export default router;
