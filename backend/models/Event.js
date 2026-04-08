const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  datetime: { type: Date, required: true },
  club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  link: { type: String },
  posterUrl: { type: String },
  type: { type: String, enum: ['Technical', 'Non-Technical'], default: 'Technical' }
});

module.exports = mongoose.model('Event', eventSchema);
