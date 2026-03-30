const BASE_URL = 'http://localhost:3000/api';

export const API = {
  async getPlayers() {
    try {
      const response = await fetch(`${BASE_URL}/players`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  },

  async saveScore(username, score) {
    try {
      const response = await fetch(`${BASE_URL}/players/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, score }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving score:', error);
      return null;
    }
  },

  async getPlayerData(username) {
    try {
      const response = await fetch(`${BASE_URL}/players/${username}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching player data:', error);
      return null;
    }
  },

  async savePlayerData(username, gameData) {
    try {
      const response = await fetch(`${BASE_URL}/players/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, gameData }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving player data:', error);
      return null;
    }
  }
};
