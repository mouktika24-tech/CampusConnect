const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  datetime: { type: Date, required: true },
  club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  link: { type: String, default: '' },
  posterUrl: { type: String, default: null },
  type: { 
    type: String, 
    default: 'Technical' 
  },
  category: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Academic', 'Extracurricular', 'Non-Technical'],
    default: 'Technical'
  },
  venue: { type: String, default: 'Campus Auditorium' },
  capacity: { type: Number, default: 100, min: 1 },
  registrationDeadline: { type: Date },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Approved' // Existing events remain approved so nothing breaks
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
