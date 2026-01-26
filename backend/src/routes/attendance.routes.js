import express from 'express';
import { requireAuth as authMiddleware } from '../middleware/auth.js';
import { getAttendance, updateAttendance } from '../controllers/attendance.controller.js';

const attendanceRouter = express.Router();

attendanceRouter.get('/', authMiddleware, getAttendance);
attendanceRouter.patch('/:id', authMiddleware, updateAttendance);

export default attendanceRouter;
