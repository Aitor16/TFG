const mongoose = require('mongoose');
const path = require('path');
// Cargamos el .env desde la carpeta superior (server/.env)
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Player = require('../models/Player');

async function view() {
    try {
        console.log('⏳ Conectando a MongoDB Atlas...');
        if (!process.env.MONGODB_URI) {
            throw new Error('No se encontró MONGODB_URI en el archivo .env');
        }
        
        await mongoose.connect(process.env.MONGODB_URI);
        const players = await Player.find();
        
        if (players.length === 0) {
            console.log('\n📭 La base de datos está vacía. ¡Juega y guarda algo primero!');
        } else {
            console.log('\n=== 🎮 DATOS DE JUGADORES EN MONGO ===');
            players.forEach(p => {
                console.log(`\n👤 Usuario: ${p.username}`);
                console.log(`📊 Puntuación: ${p.score}`);
                console.log(`📂 GameData:`, JSON.stringify(p.gameData, null, 2));
                console.log('-----------------------------------');
            });
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}
view();
