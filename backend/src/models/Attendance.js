import mongoose from 'mongoose';

const { Schema } = mongoose;

const AttendanceRecordSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  present: { type: Boolean, default: false }
}, { _id: false });

const AttendanceSchema = new Schema({
  house: { type: String, required: true, index: true },
  weekStart: { type: Date, required: true, index: true },
  records: { type: [AttendanceRecordSchema], default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

AttendanceSchema.index({ house: 1, weekStart: 1 }, { unique: true });

export default mongoose.model('Attendance', AttendanceSchema);
