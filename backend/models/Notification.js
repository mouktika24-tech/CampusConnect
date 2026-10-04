const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Registration', 'EventUpdate', 'Reminder', 'Attendance', 'Approval', 'System'],
    default: 'System' 
  },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
