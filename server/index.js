const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
const playerRoutes = require('./routes/playerRoutes');
app.use('/api/players', playerRoutes);

app.get('/', (req, res) => {
  res.send('Phaser Game Backend API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
