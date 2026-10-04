const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  registration_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
  status: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  markedAt: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date }
});

attendanceSchema.index({ student_id: 1, event_id: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
