const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// Get all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find().sort({ score: -1 }).limit(10);
    res.json(players);
  } catch (err) {
    console.error('Error in GET /players:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
});

// Get player by username
router.get('/:username', async (req, res) => {
  try {
    const player = await Player.findOne({ username: req.params.username });
    if (!player) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }
    res.json(player);
  } catch (err) {
    console.error('Error in GET /players/:username:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
});

// Save full player data
router.post('/save', async (req, res) => {
  const { username, gameData } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
  }

  try {
    let player = await Player.findOne({ username });
    if (player) {
      player.gameData = gameData || player.gameData;
      player.lastActive = new Date();
      await player.save();
    } else {
      player = new Player({ username, gameData });
      await player.save();
    }
    res.json(player);
  } catch (err) {
    console.error('Error in POST /save:', err);
    res.status(400).json({ message: err.message || 'Error al guardar los datos' });
  }
});

// Update player score
router.post('/score', async (req, res) => {
  const { username, score } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
  }

  try {
    let player = await Player.findOne({ username });
    if (player) {
      player.score = score;
      player.lastActive = new Date();
      await player.save();
    } else {
      player = new Player({ username, score });
      await player.save();
    }
    res.json(player);
  } catch (err) {
    console.error('Error in POST /score:', err);
    res.status(400).json({ message: err.message || 'Error al guardar el puntaje' });
  }
});

module.exports = router;
