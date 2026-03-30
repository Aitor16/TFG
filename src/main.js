import Phaser from './lib/phaser.js'
import { BattleScene } from './scenes/battle-scene.js';
import { InventoryScene } from './scenes/inventory-scene.js';
import { MonsterDetailsScene } from './scenes/monster-details-scene.js';
import { MonsterPartyScene } from './scenes/monster-party-scene.js';
import { OptionsScene } from './scenes/options-scene.js';
import { PreloadScene } from './scenes/preload-scene.js';
import { SCENE_KEYS } from './scenes/scene-keys.js';
import { TestScene } from './scenes/test-scene.js';
import { TitleScene } from './scenes/title-scenes.js';
import { WorldScene } from './scenes/world-scene.js';

//Instancia el juego con las configuraciones
const game = new Phaser.Game({
    //Tipo de motor de juego
    type: Phaser.AUTO,
    //Funcion que ayuda a los pixelArt
    pixelArt: false,
    //Escala de la pantalla
    scale: {
        width: 1920,
        height: 1080
    },
    //Elemento del html que contendra el juego
    parent: 'game-container',
    //Color de fondo de la escena
    backgroundColor: 'black',
    //Centra la imagen al display como un overflow
    mode: Phaser.Scale.FIT,
    //Centra el display
    autoCenter: Phaser.Scale.CENTER_BOTH,
});

//Añade la escena Preload
game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene)
game.scene.add(SCENE_KEYS.WORLD_SCENE, WorldScene)
game.scene.add(SCENE_KEYS.BATTLE_SCENE, BattleScene)
game.scene.add(SCENE_KEYS.TITLE_SCENE, TitleScene)
game.scene.add(SCENE_KEYS.OPTION_SCENE, OptionsScene)
game.scene.add(SCENE_KEYS.TEST_SCENE, TestScene)
game.scene.add(SCENE_KEYS.MONSTER_PARTY_SCENE, MonsterPartyScene)
game.scene.add(SCENE_KEYS.MONSTER_DETAILS_SCENE, MonsterDetailsScene)
game.scene.add(SCENE_KEYS.INVENTORY_SCENE, InventoryScene)
game.scene.start(SCENE_KEYS.PRELOAD_SCENE, PreloadScene)