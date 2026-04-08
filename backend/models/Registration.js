const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['Registered', 'Waitlisted', 'Cancelled'], default: 'Registered' }
});

// Avoid duplicate registrations
registrationSchema.index({ student_id: 1, event_id: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
