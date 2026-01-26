import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// Helper to get start of week (Saturday)
const getSaturday = (d) => {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - ((day + 1) % 7);
  return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
};


export async function updateAttendance(req, res) {
  try {
    // 1. FETCH REAL USER DATA FROM DB
    // The token usually only has ID, so we must fetch the user to check moderatorType
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // 2. CHECK PERMISSIONS
    const isOverseer = user.moderatorType === 'Overseer' || user.role === 'admin';

    if (!isOverseer) {
      return res.status(403).json({ error: 'Forbidden: Only Overseers or Admins can update attendance' });
    }

    const { id } = req.params;
    const { house, weekStart, records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid records format' });
    }

    const updateData = {
      records,
      updatedBy: user._id
    };

    let doc;
    if (id && id !== 'new' && id !== 'undefined') {
      // Update existing
      doc = await Attendance.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } else {
      // Create new
      if (!house || !weekStart) {
        return res.status(400).json({ error: 'House and WeekStart required for creating records' });
      }

      const startDate = new Date(getSaturday(weekStart));

      doc = await Attendance.findOneAndUpdate(
        { house, weekStart: startDate },
        {
          $set: updateData,
          $setOnInsert: { createdBy: user._id }
        },
        { new: true, upsert: true, runValidators: true }
      );
    }

    res.json({ attendance: doc });

  } catch (error) {
    console.error('Update Attendance Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
export async function getAttendance(req, res) {
  try {
    const { house, weekStart } = req.query;

    if (!weekStart) {
      return res.status(400).json({ error: 'weekStart is required' });
    }

    const targetHouse = house || req.user.house;
    const startDate = new Date(getSaturday(weekStart));

    let attendance = await Attendance.findOne({
      house: targetHouse,
      weekStart: startDate
    }).populate('records.userId', 'displayName username photoUrl rank');

    // --- Auto-create if missing ---
    if (!attendance) {
      const members = await User.find({ house: targetHouse }).select('_id displayName username photoUrl rank');
      const records = members.map(user => ({
        userId: user._id,
        status: { Sa: 'absent', Su: 'absent', M: 'absent', T: 'absent', W: 'absent', Th: 'absent', F: 'absent' }
      }));

      attendance = await Attendance.create({
        house: targetHouse,
        weekStart: startDate,
        records,
        createdBy: req.user.id
      });

      attendance = await attendance.populate('records.userId', 'displayName username photoUrl rank');
    }

    res.json({ attendance });

  } catch (error) {
    console.error('Get Attendance Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
