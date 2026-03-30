const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  score: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastActive: { type: Date, default: Date.now },
  gameData: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('Player', playerSchema);
