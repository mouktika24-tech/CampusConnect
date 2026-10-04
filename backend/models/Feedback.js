const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comments: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate feedback from same student on same event
feedbackSchema.index({ student_id: 1, event_id: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
