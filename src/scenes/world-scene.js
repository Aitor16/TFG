// Importamos Phaser desde la ruta especificada
import Phaser from "../lib/phaser.js"
// Importamos las claves de los assets del mundo
import { WORLD_ASSET_KEYS, ENTITIES_ASSET_KEYS } from "../assets/asset-keys.js"
// Importamos la escena de batalla
import { BattleScene } from "./battle-scene.js"
// Importamos las claves de las escenas
import { SCENE_KEYS } from "./scene-keys.js"
// Importamos la clase del jugador
import { Player } from "../world/characters/player.js"
// Importamos la clase de controles
import { Controls } from "../utils/controls.js"
// Importamos configuraciones como tamaño de tile y alpha de capas de colisión
import { TILE_SIZE, TILED_COLLISION_LAYER_ALPHA, NPC_DIALOG_BACKGROUNDS } from "../config.js"
// Importamos la dirección y sus constantes
import { DIRECTION } from "../common/direction.js"
// Importamos el gestor de datos y sus claves
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../utils/data-manager.js"
// Importamos utilidades para calcular posiciones en la cuadrícula
import { getTargetPositionFromGameObjectPositionAndDirection } from "../utils/grid-utils.js"
// Importamos textos utilitarios y constantes de texto
import { CANNOT_READ_SIGN_TEXT, SAMPLE_TEXT } from "../utils/text-utils.js"
// Importamos la interfaz de diálogo
import { DialogUi } from "../world/characters/dialog-ui.js"
// Importamos la clase NPC
import { NPC } from "../world/characters/npc.js"
// Importamos el menú
import { Menu, MENU_OPTIONS } from "../world/menu/menu.js"
import { BaseScene } from "./base-scene.js"
import { API } from "../utils/api.js"
import { i18n } from "../utils/i18n.js"

/**
 *  @typedef TiledObjectProperty
 *  @type {object}
 *  @property {string} name
 *  @property {string} type
 *  @property {any} value
 */

// Constantes para las propiedades de los carteles en Tiled
const TILED_SIGN_PROPERTY = Object.freeze({
    MESSAGE: 'message' // Propiedad para el mensaje del cartel
})

// Tipos personalizados de objetos en Tiled
const CUSTOM_TILED_TYPES = Object.freeze({
    NPC: 'npc',           // Para personajes no jugables
    NPC_PATH: 'npc_path'  // Para rutas de movimiento de NPCs
})

// Constantes para las propiedades de los NPCs en Tiled
const TILED_NPC_PROPERTY = Object.freeze({
    IS_SPAWN_POINT: 'is_spawn',       // Si es punto de aparición
    MOVEMENT_PATTERN: 'movement_pattern', // Patrón de movimiento
    MESSAGE: 'messages',               // Mensajes del NPC
    FRAME: 'frame',                     // Frame del sprite
    DIALOG_BACKGROUND: 'dialog_background' // Fondo del diálogo
})

/**
 * LA ESCENA SERÁ DE 16X9 (1024X576)
 * CADA CELDA SERÁ DE 64X64
 */

// Clase principal de la escena del mundo
export class WorldScene extends BaseScene {
    /** @type {Player} - Referencia al jugador */
    #player;

    /** @type {Phaser.Tilemaps.TilemapLayer} - Capa de encuentros de monstruos */
    #encounterLayer;

    /** @type {boolean} - Indica si se encontró un monstruo salvaje */
    #wildMonsterEncountered;

    /** @type {Phaser.Tilemaps.ObjectLayer} - Capa de carteles */
    #signLayer;

    /** @type {DialogUi} - Interfaz de diálogo */
    #dialogUi;

    /** @type {NPC[]} - Array de NPCs en el mapa */
    #npcs;

    /** @type {NPC | undefined} - NPC con el que el jugador está interactuando */
    #npcPlayerIsInteractingWith;

    /** @type {Menu} - Menú del juego */
    #menu;
    /** @type {import('../utils/i18n.js').I18n} */
    #i18n;

    // Constructor de la escena
    constructor() {
        super({
            key: SCENE_KEYS.WORLD_SCENE, // Clave única para identificar la escena
            //active: true
        });
        this._musicKey = 'WORLD';
        console.log(`[${WorldScene.name}: constructor] invoked`)
    }

    /**
     * Método de inicialización - se llama antes de create()
     * @returns {void}
     */
    init() {
        super.init()
        // Reiniciamos los estados
        this.#wildMonsterEncountered = false;
        this.#npcPlayerIsInteractingWith = undefined;
        this.#i18n = i18n(this);
    }

    /**
     * Método create - se llama cuando la escena se crea
     * Aquí configuramos todo el mundo del juego
     */
    create() {
        super.create()
        console.log(`[${WorldScene.name}: create] invoked`);

        // Ejemplo de cómo obtener datos de MongoDB al iniciar la escena
        API.getPlayers().then(players => {
            console.log('Jugadores recuperados de MongoDB:', players);
        });

        // Posición inicial del jugador (calculada en tiles)
        const x = 28 * TILE_SIZE;
        const y = 38 * TILE_SIZE;
        console.log(`[WorldScene] Initializing camera at ${x}, ${y}`);

        console.log(`[${WorldScene.name}:create] starting create`);
        // Cargamos el mapa del mundo desde Tiled
        const map = this.make.tilemap({ key: WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL });
        console.log(`[${WorldScene.name}:create] map loaded: ${map.width}x${map.height}`);

        // Añadimos la imagen de fondo del mundo inmediatamente para evitar pantalla negra
        this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0);
        console.log(`[${WorldScene.name}:create] background image added`);

        // Configuramos los límites de la cámara
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        // Aplicamos zoom a la cámara
        this.cameras.main.setZoom(1.5);
        // Centramos la cámara en la posición inicial del jugador
        this.cameras.main.centerOn(x, y);
        console.log(`[${WorldScene.name}:create] camera configured`);

        // Configuramos la capa de colisiones
        const collisionTiles = map.addTilesetImage('collision', WORLD_ASSET_KEYS.WORLD_COLLISION);
        if (!collisionTiles) {
            console.log(`[${WorldScene.name}:create] error al crear tiles de colisión`);
            return;
        }
        console.log(`[${WorldScene.name}:create] collision tiles added`);

        // Creamos la capa de colisiones
        const collisionLayer = map.createLayer('Collision', collisionTiles, 0, 0);
        if (!collisionLayer) {
            console.log(`[${WorldScene.name}:create] error al crear capa de colisión`);
            return;
        }
        console.log(`[${WorldScene.name}:create] collision layer created`);

        // Configuramos la transparencia y profundidad de la capa de colisiones (0 para ocultarla)
        collisionLayer.setAlpha(0).setDepth(0);

        // Obtenemos la capa de carteles del mapa
        this.#signLayer = map.getObjectLayer('Sign');
        if (!this.#signLayer) {
            console.log(`[${WorldScene.name}:create] error al crear capa de carteles`);
            return;
        }
        console.log(`[${WorldScene.name}:create] sign layer found`);

        // Configuramos la capa de encuentros (donde aparecen monstruos)
        const encounterTiles = map.addTilesetImage('encounter', WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE);
        if (!encounterTiles) {
            console.log(`[${WorldScene.name}:create] error al crear tiles de encuentro`);
            return;
        }
        console.log(`[${WorldScene.name}:create] encounter tiles added`);

        // Creamos la capa de encuentros
        this.#encounterLayer = map.createLayer('Encounter', encounterTiles, 0, 0);
        if (!this.#encounterLayer) {
            console.log(`[${WorldScene.name}:create] error al crear capa de encuentro`);
            return;
        }

        // Configuramos la transparencia de la capa de encuentros (0 para ocultarla)
        this.#encounterLayer.setAlpha(0).setDepth(0);

        // Creamos los NPCs en el mapa
        this.#createNPCs(map);

        const playerPos = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION);
        console.log(`[WorldScene] Creating player at ${playerPos.x}, ${playerPos.y}`);
        this.#player = new Player({
            scene: this, // La escena actual
            position: playerPos, // Posición guardada
            direction: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION), // Dirección guardada
            collisionLayer: collisionLayer, // Capa de colisiones
            spriteGridMovementFinishedCallback: () => {
                // Callback cuando el jugador termina de moverse
                this.#handlePlayerMovementUpdate();
            },
            spriteChangedDirectionCallback: () => {
                // Callback cuando el jugador cambia de dirección
                this.#handlePlayerMovementUpdate();
            },
            otherCharactersToCheckForCollisionsWith: this.#npcs // NPCs con los que puede colisionar
        });

        // Hacemos que la cámara siga al jugador
        this.cameras.main.startFollow(this.#player.sprite);

        // Configuramos las colisiones de los NPCs con el jugador
        this.#npcs.forEach((npc) => {
            npc.addCharacterToCheckForCollisionsWith(this.#player);
        });

        // Añadimos la imagen de primer plano del mundo
        this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_FOREGROUND, 0).setOrigin(0);

        // Creamos la interfaz de diálogo
        this.#dialogUi = new DialogUi(this, 1280);

        // Creamos el menú
        this.#menu = new Menu(this);

        // Efecto de fade in al entrar a la escena
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.GAME_STARTED, true)
    }

    /**
     * Método update - se llama en cada frame del juego
     * @param {DOMHighResTimeStamp} time
     * @param {number} time - Tiempo actual del juego
     */
    update(time) {
        super.update()
        // Si encontramos un monstruo, solo actualizamos al jugador y salimos
        if (this.#wildMonsterEncountered) {
            this.#player.update(time);
            return;
        }

        // Obtenemos el estado de las teclas
        const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed(); // Tecla espacio
        const selectedDirectionHelDown = this._controls.getDirectionKeyPressedDown(); // Dirección mantenida
        const selectedDirectionPressedOnce = this._controls.getDirectionKeyJustPressed(); // Dirección recién presionada

        // Movimiento del jugador (si hay dirección y no está bloqueada la entrada)
        if (selectedDirectionHelDown !== DIRECTION.NONE && !this.#isPlayerInputLocked()) {
            this.#player.moveCharacter(selectedDirectionHelDown);
        }

        // Interacción con espacio (si no se está moviendo y el menú no está visible)
        if (wasSpaceKeyPressed && !this.#player.isMoving && !this.#menu.isVisible) {
            this.#handlePlayerInteraction();

        }

        // Manejo del menú con tecla Enter
        if (this._controls.wasEnterKeyPressed() && !this.#player.isMoving) {
            // Si el diálogo está visible, no hacemos nada
            if (this.#dialogUi.isVisible) {
                return;
            }

            // Si el menú está visible, lo ocultamos
            if (this.#menu.isVisible) {
                this.#menu.hide();
                return;
            }

            // Si no hay menú visible, lo mostramos
            this.#menu.setOptions([MENU_OPTIONS.MONSTERS, MENU_OPTIONS.BAG, MENU_OPTIONS.SAVE, MENU_OPTIONS.OPTIONS, MENU_OPTIONS.EXIT]);
            this.#menu.show();
        }

        // Si el menú está visible, manejamos su input
        if (this.#menu.isVisible) {
            // Movimiento en el menú con las flechas
            if (selectedDirectionPressedOnce !== DIRECTION.NONE) {
                console.log(selectedDirectionPressedOnce)
                this.#menu.handlePlayerInput(selectedDirectionPressedOnce);
            }

            // Selección de opción con espacio
            if (wasSpaceKeyPressed) {
                this.#menu.handlePlayerInput('OK');

                // Opción GUARDAR
                if (this.#menu.selectedMenuOption === 'SAVE') {
                    this.#menu.hide();
                    dataManager.saveData().then(() => {
                        const saveMsg = this.#i18n.t('WORLD.SAVE_SUCCESS');
                        this.#dialogUi.showDialogModal([saveMsg]);
                    }).catch(error => {
                        console.error('Error saving data to MongoDB:', error);
                        // Fallback message
                        const saveMsg = this.#i18n.t('WORLD.SAVE_SUCCESS');
                        this.#dialogUi.showDialogModal([saveMsg]);
                    });
                }

                if (this.#menu.selectedMenuOption === 'MONSTERS') {
                    const sceneDataToPass = {
                        previousSceneName: SCENE_KEYS.WORLD_SCENE
                    }
                    this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, sceneDataToPass)
                    this.scene.pause();
                }

                if (this.#menu.selectedMenuOption === 'BAG') {
                    const sceneDataToPass = {
                        previousSceneName: SCENE_KEYS.WORLD_SCENE
                    }
                    this.scene.launch(SCENE_KEYS.INVENTORY_SCENE, sceneDataToPass)
                    this.scene.pause(SCENE_KEYS.WORLD_SCENE);
                }
                if (this.#menu.selectedMenuOption === 'OPTIONS') {
                    this.#menu.hide();
                    this.scene.launch(SCENE_KEYS.OPTION_SCENE, {
                        previousSceneName: SCENE_KEYS.WORLD_SCENE
                    });
                    this.scene.pause(SCENE_KEYS.WORLD_SCENE);
                }

                // Opción SALIR
                if (this.#menu.selectedMenuOption === 'EXIT') {
                    this.#menu.hide();
                    this.cameras.main.fadeOut(500, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.stop(SCENE_KEYS.WORLD_SCENE);
                        this.scene.start(SCENE_KEYS.TITLE_SCENE);
                    });
                }
                // TODO: manejar otras opciones del menú
            }

            // Botón de volver atrás (normalmente Escape)
            if (this._controls.wasBackKeyPressed()) {
                this.#menu.hide();
            }
        }

        // Actualizamos al jugador y NPCs
        this.#player.update(time);
        this.#npcs.forEach((npc) => {
            npc.update(time);
        });
    }

    /**
     * Se llama cuando la escena se reanuda (por ejemplo, al cerrar el diálogo del NPC)
     * @param {Phaser.Scenes.Systems} sys 
     * @param {any} data 
     */
    handleSceneResume(sys, data) {
        super.handleSceneResume(sys, data);
        console.log(`[${WorldScene.name}:handleSceneResume] invoked`);
        
        // Si estábamos interactuando con un NPC, liberamos su estado para que vuelva a moverse
        if (this.#npcPlayerIsInteractingWith) {
            console.log(`[${WorldScene.name}:handleSceneResume] resetting NPC interaction state`);
            this.#npcPlayerIsInteractingWith.isTalkingToPlayer = false;
            this.#npcPlayerIsInteractingWith = undefined;
        }
    }

    /**
     * Maneja la interacción del jugador con el entorno
     */
    #handlePlayerInteraction() {
        // Si la animación de diálogo está en reproducción, no hacemos nada
        if (this.#dialogUi.isAnimationPlaying) {
            return;
        }

        // Si el diálogo está visible y no hay más mensajes, lo ocultamos
        if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
            this.#dialogUi.hideDialogModal();
            // Si estábamos interactuando con un NPC, terminamos la interacción
            if (this.#npcPlayerIsInteractingWith) {
                this.#npcPlayerIsInteractingWith.isTalkingToPlayer = false;
                this.#npcPlayerIsInteractingWith = undefined;
            }
            return;
        }

        // Si el diálogo está visible y hay más mensajes, mostramos el siguiente
        if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
            this.#dialogUi.showNextMessage();
            return;
        }

        console.log('inicio de verificación de interacción');

        // Obtenemos la posición actual del jugador
        const { x, y } = this.#player.sprite;
        // Calculamos la posición objetivo según la dirección que mira
        const targetPosition = getTargetPositionFromGameObjectPositionAndDirection({ x, y }, this.#player.direction);

        // Buscamos carteles cercanos
        const nearbySign = this.#signLayer.objects.find((object) => {
            if (!object.x || !object.y) {
                return;
            }
            // Verificamos si el objeto está en la posición objetivo
            return object.x === targetPosition.x && object.y - TILE_SIZE === targetPosition.y;
        });

        // Si encontramos un cartel
        if (nearbySign) {
            /** @type {TiledObjectProperty[]} */
            const props = nearbySign.properties;
            /** @type {string} */
            const msg = props.find((prop) => prop.name === 'message')?.value;

            // Solo se puede leer si el jugador mira hacia arriba
            const usePlaceholderText = this.#player.direction !== DIRECTION.UP;
            let textToShow = this.#i18n.t('WORLD.CANNOT_READ_SIGN', { defaultValue: CANNOT_READ_SIGN_TEXT });
            if (!usePlaceholderText) {
                textToShow = this.#i18n.t(msg) || this.#i18n.t('WORLD.NPC_TIPS', { defaultValue: SAMPLE_TEXT });
            }
            console.log(textToShow);
            this.#dialogUi.showDialogModal([textToShow]);
            return;
        }

        // Buscamos NPCs cercanos
        const nearbyNpc = this.#npcs.find((npc) => {
            return npc.sprite.x === targetPosition.x && npc.sprite.y === targetPosition.y;
        });

        // Si encontramos un NPC
        if (nearbyNpc) {
            nearbyNpc.facePlayer(this.#player.direction); // El NPC mira al jugador
            nearbyNpc.isTalkingToPlayer = true; // Marcamos que está hablando
            this.#npcPlayerIsInteractingWith = nearbyNpc; // Guardamos referencia

            // Lanzamos la escena de diálogo a pantalla completa
            this.scene.launch(SCENE_KEYS.NPC_DIALOG_SCENE, {
                messages: nearbyNpc.messages,
                backgroundImageKey: nearbyNpc.dialogBackgroundKey || 'ZOMBIE'
            });
            this.scene.pause(SCENE_KEYS.WORLD_SCENE);
        }
    }

    /**
     * Maneja las actualizaciones después del movimiento del jugador
     */
    #handlePlayerMovementUpdate() {
        // Guardamos la posición actual del jugador
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
            x: this.#player.sprite.x,
            y: this.#player.sprite.y
        });

        // Si no hay capa de encuentros, salimos
        if (!this.#encounterLayer) {
            return;
        }

        // Verificamos si el jugador está en una zona de encuentros
        const isInEncounterZone = this.#encounterLayer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true).index !== -1;
        if (!isInEncounterZone) {
            return;
        }

        console.log(`[${WorldScene.name}:handlePlayerMovementUpdate] el jugador está en zona de encuentros`);

        // 20% de probabilidad de encontrar un monstruo
        this.#wildMonsterEncountered = Math.random() < 0.2;

        if (this.#wildMonsterEncountered) {
            console.log(`[${WorldScene.name}:handlePlayerMovementUpdate] el jugador encontró un monstruo salvaje`);
            // Efecto de fade out y cambio a la escena de batalla
            this.cameras.main.fadeOut(2000);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(SCENE_KEYS.BATTLE_SCENE);
            });
        }
    }

    /**
     * Verifica si la entrada del jugador está bloqueada
     * @returns {boolean}
     */
    #isPlayerInputLocked() {
        // Bloqueado si: controles bloqueados, diálogo visible o menú visible
        return this._controls.isInputLocked || this.#dialogUi.isVisible || this.#menu.isVisible;
    }

    /**
     * Crea los NPCs en el mapa
     * @param {Phaser.Tilemaps.Tilemap} map - El mapa de Tiled
     * @returns {void}
     */
    #createNPCs(map) {
        this.#npcs = [];

        // Filtramos las capas que contienen NPCs
        const npcLayers = map.getObjectLayerNames().filter((layerName) => layerName.includes('NPC'));

        // Procesamos cada capa de NPC
        npcLayers.forEach((layerName) => {
            const layer = map.getObjectLayer(layerName);
            console.log(layer.objects);

            // Buscamos el objeto NPC en la capa
            const npcObject = layer.objects.find((obj) => {
                return obj.type === CUSTOM_TILED_TYPES.NPC;
            });

            // Si no hay NPC o no tiene posición, salimos
            if (!npcObject || npcObject.x === undefined || npcObject.y === undefined) {
                return;
            }

            // Obtenemos los objetos de ruta para este NPC
            const pathObjects = layer.objects.filter((obj) => {
                return obj.type === CUSTOM_TILED_TYPES.NPC_PATH;
            });

            // Construimos la ruta del NPC
            const npcPath = {
                0: { x: npcObject.x, y: npcObject.y - TILE_SIZE } // Punto inicial
            };

            // Añadimos los puntos de la ruta
            pathObjects.forEach((obj) => {
                if (obj.x === undefined || obj.y === undefined) {
                    return;
                }
                npcPath[parseInt(obj.name, 10)] = { x: obj.x, y: obj.y - TILE_SIZE };
            });
            console.log(npcPath);

            /**
             * @type {string} - Frame del sprite del NPC
             */
            const npcFrame = npcObject.properties.find((property) => property.name === TILED_NPC_PROPERTY.FRAME)?.value || '0';

            /**
             * @type {string} - Mensajes del NPC (separados por ::)
             */
            const npcMessagesString = npcObject.properties.find((property) => property.name === TILED_NPC_PROPERTY.MESSAGE)?.value || '';

            /**
             * @type {string} - Patrón de movimiento del NPC
             */
            const npcMovement = npcObject.properties.find((property) => property.name === TILED_NPC_PROPERTY.MOVEMENT_PATTERN)?.value || 'IDLE';

            /**
             * @type {string | undefined} - Fondo de diálogo del NPC
             */
            let npcDialogBackground = NPC_DIALOG_BACKGROUNDS[layerName] || 
                                    NPC_DIALOG_BACKGROUNDS[npcObject.name] || 
                                    npcObject.properties.find((property) => property.name === TILED_NPC_PROPERTY.DIALOG_BACKGROUND)?.value;

            // Dividimos los mensajes por el separador '::' y los traducimos
            const npcMessages = npcMessagesString.split('::').map(msg => this.#i18n.t(msg));

            // Creamos el NPC
            const npc = new NPC({
                scene: this,
                position: { x: npcObject.x, y: npcObject.y - TILE_SIZE },
                direction: DIRECTION.DOWN,
                frame: parseInt(npcFrame, 10),
                messages: npcMessages,
                npcPath,
                movementPattern: /** @type {import("../world/characters/npc.js").NpcMovementPattern} */ (npcMovement),
                dialogBackgroundKey: npcDialogBackground,
                assetKey: layerName === 'NPC1' ? ENTITIES_ASSET_KEYS.NPC_WALKING : ENTITIES_ASSET_KEYS.NPC_DOWN
            });

            // Añadimos el NPC al array
            this.#npcs.push(npc);
        });
    }

    /**
     * Maneja la actualización de la dirección del jugador
     */
    #handlePlayerDirectionUpdate() {
        console.log('test');
        // Guardamos la dirección actual del jugador
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, this.#player.direction);
    }


}