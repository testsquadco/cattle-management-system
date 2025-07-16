const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isClosed: { type: Boolean, default: false },
  closedAt: { type: Date },
  carriedForwardTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Season', seasonSchema); 