import mongoose from 'mongoose';

const { Schema } = mongoose;

const StatusEnum = ['present', 'absent', 'excused', 'no_card'];

const RecordSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    M: { type: String, enum: StatusEnum, default: 'absent' },
    T: { type: String, enum: StatusEnum, default: 'absent' },
    W: { type: String, enum: StatusEnum, default: 'absent' },
    Th: { type: String, enum: StatusEnum, default: 'absent' },
    F: { type: String, enum: StatusEnum, default: 'absent' }
  }
}, { _id: false });

const AttendanceSchema = new Schema({
  house: { type: String, required: true, index: true },
  weekStart: { type: Date, required: true, index: true },
  records: { type: [RecordSchema], default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Unique compound index on house + weekStart
AttendanceSchema.index({ house: 1, weekStart: 1 }, { unique: true });

export default mongoose.model('Attendance', AttendanceSchema);
