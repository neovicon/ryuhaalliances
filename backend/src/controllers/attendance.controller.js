import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

const ALLOWED = new Set(['present','absent','excused','no_card']);

export async function getAttendance(req, res) {
  try {
    const { weekStart } = req.query;
    const house = req.query.house || req.user?.house;
    if (!weekStart) return res.status(400).json({ error: 'weekStart is required' });
    if (!house) return res.status(400).json({ error: 'house is required' });

    const week = new Date(weekStart);
    // Normalize to start of day UTC
    const doc = await Attendance.findOne({ house, weekStart: week }).populate('records.userId', 'username displayName house');
    if (!doc) return res.status(404).json({ error: 'Attendance not found' });
    res.json({ attendance: doc });
  } catch (err) {
    console.error('getAttendance error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

function isValidStatusMap(status) {
  if (!status || typeof status !== 'object') return false;
  const keys = ['M','T','W','Th','F'];
  for (const k of keys) {
    if (!Object.prototype.hasOwnProperty.call(status, k)) return false;
    if (!ALLOWED.has(status[k])) return false;
  }
  return true;
}

export async function updateAttendance(req, res) {
  try {
    const user = req.user;
    if (!user || user.role !== 'OVERSEER') return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid attendance id' });

    const { records } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: 'records must be an array' });

    // Validate each record: userId valid and exists, status map valid
    const userIds = [];
    for (const r of records) {
      if (!r.userId || !mongoose.Types.ObjectId.isValid(r.userId)) return res.status(400).json({ error: 'Invalid userId in records' });
      if (!isValidStatusMap(r.status)) return res.status(400).json({ error: 'Invalid status map in records' });
      userIds.push(r.userId);
    }

    // Ensure all userIds exist
    const uniqueUserIds = [...new Set(userIds.map(String))];
    const found = await User.find({ _id: { $in: uniqueUserIds } }).select('_id');
    if (found.length !== uniqueUserIds.length) return res.status(400).json({ error: 'One or more userIds are invalid' });

    const attendance = await Attendance.findById(id);
    if (!attendance) return res.status(404).json({ error: 'Attendance not found' });

    // Map incoming records into shape
    attendance.records = records.map(r => ({ userId: r.userId, status: r.status }));
    attendance.updatedBy = user._id || user.id;

    await attendance.save();
    const out = await Attendance.findById(attendance._id).populate('records.userId', 'username displayName house');
    res.json({ attendance: out });
  } catch (err) {
    console.error('updateAttendance error', err);
    res.status(500).json({ error: 'Server error' });
  }
}