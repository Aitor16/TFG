import { CHARACTER_ASSET_KEYS } from "../assets/asset-keys.js";
import { DIRECTION } from "../common/direction.js";
import { BATTLE_SCENE_OPTIONS, BATTLE_STYLE_OPTIONS, LANGUAGE_OPTIONS, SOUND_OPTIONS, TEXT_SPEED_OPTIONS } from "../common/options.js";
import { TEXT_SPEED, TILE_SIZE, TILED_COLLISION_LAYER_ALPHA } from "../config.js";
import Phaser from "../lib/phaser.js";
import { BattleScene } from "../scenes/battle-scene.js";
import { DataUtils } from "./data-utils.js";
import { exhaustiveGuard } from "./guard.js";
import { API } from "./api.js";

const LOCAL_STORAGE_KEY = 'MONSTER_TAMER_DATA'

/**
 * @typedef MonsterData
 * @type {object}
 * @property {import("../types/typedef.js").Monster[]} inParty
 */


/**
 * @typedef GlobalState
 * @type {object}
 * @property {object} player
 * @property {object} player.position
 * @property {number} player.position.x
 * @property {number} player.position.y
 * @property {import ('../common/direction.js').Direction} player.direction
 * @property {object} options
 * @property {import("../common/options.js").TextSpeedMenuOptions} options.textSpeed
 * @property {import("../common/options.js").BattleSceneMenuOptions} options.battleSceneAnimations
 * @property {import("../common/options.js").BattleStyleOptions} options.battleStyle
 * @property {import("../common/options.js").SoundMenuOptions} options.sound
 * @property {import("../common/options.js").VolumeMenuOptions} options.volume
 * @property {import("../common/options.js").MenuColorOptions} options.menuColor
 * @property {import("../common/options.js").LanguageMenuOptions} options.language
 * @property {boolean} gameStarted
 * @property {MonsterData} monsters
 * @property {import("../types/typedef.js").Inventory} inventory
 * @property {number} score
 * @property {number} level
 */

/**@type {GlobalState} */
const initialState = {
    player: {
        position: {
            x: 28 * TILE_SIZE,
            y: 38 * TILE_SIZE
        },
        direction: DIRECTION.DOWN
    },
    options: {
        textSpeed: TEXT_SPEED_OPTIONS.MID,
        battleSceneAnimations: BATTLE_SCENE_OPTIONS.OFF,
        battleStyle: BATTLE_STYLE_OPTIONS.SHIFT,
        sound: SOUND_OPTIONS.ON,
        volume: 4,
        menuColor: 0,
        language: LANGUAGE_OPTIONS.SPANISH
    },
    gameStarted: false,
    monsters: {
        inParty: [
            {
                id: 2,
                monsterId: 2,
                name: CHARACTER_ASSET_KEYS.PERROZ,
                assetKey: CHARACTER_ASSET_KEYS.PERROZ,
                assetFrame: 0,
                currentHP: 40,
                maxHP: 40,
                attackIDs: [1, 2, 3, 4],
                baseAttack: 8,
                baseAccuracy: 100,
                baseSpeed: 10,
                level: 5,
                scale: { party: 0.4, details: 1.0 },
                flipX: true,
            },
            {
                id: 1,
                monsterId: 1,
                name: CHARACTER_ASSET_KEYS.SOLDIER,
                assetKey: CHARACTER_ASSET_KEYS.SOLDIER,
                assetFrame: 0,
                currentHP: 15,
                maxHP: 25,
                attackIDs: [1, 2],
                baseAttack: 10,
                baseAccuracy: 100,
                baseSpeed: 5,
                level: 5,
                scale: { party: 0.6, details: 1.5 },
            },

        ]
    },

    inventory: [
        {
            item: {
                id: 1,
            },
            quantity: 2,
        },
    ],
    score: 0,
    level: 1,
}

export const DATA_MANAGER_STORE_KEYS = Object.freeze({
    PLAYER_DIRECTION: 'PLAYER_DIRECTION',
    PLAYER_POSITION: 'PLAYER_POSITION',
    OPTIONS_TEXT_SPEED: 'OPTIONS_TEXT_SPEED',
    OPTIONS_BATTLE_SCENE_ANIMATIONS: 'OPTIONS_BATTLE_SCENE_ANIMATIONS',
    OPTIONS_BATTLE_STYLE: 'OPTIONS_BATTLE_STYLE',
    OPTIONS_SOUND: 'OPTIONS_SOUND',
    OPTIONS_VOLUME: 'OPTIONS_VOLUME',
    OPTIONS_MENU_COLOR: 'OPTIONS_MENU_COLOR',
    OPTIONS_LANGUAGE: 'OPTIONS_LANGUAGE',
    GAME_STARTED: 'GAME_STARTED',
    MONSTER_IN_PARTY: 'MONSTER_IN_PARTY',
    INVENTORY: 'INVENTORY',
    SCORE: 'SCORE',
    LEVEL: 'LEVEL',
})

class DataManager extends Phaser.Events.EventEmitter {
    /**@type {Phaser.Data.DataManager} */
    #store

    constructor() {
        super()
        this.#store = new Phaser.Data.DataManager(this)
        this.#updateDataManager(initialState)
    }

    /**@type {Phaser.Data.DataManager} */
    get store() {
        return this.#store
    }

    async loadData(username = 'Player1') {
        console.log(`[${DataManager.name}:loadData] loading for ${username}`);
        // Try to load from MongoDB first
        try {
            const player = await API.getPlayerData(username);
            console.log(`[${DataManager.name}:loadData] API response received`);
            if (player && player.gameData) {
                console.log(`[${DataManager.name}:loadData] Loaded data from MongoDB for ${username}`);
                this.#updateDataManager(player.gameData);
                return;
            }
        } catch (error) {
            console.warn(`[${DataManager.name}:loadData] Error loading from MongoDB, falling back to localStorage:`, error);
        }

        // Fallback to localStorage
        if (typeof Storage === 'undefined') {
            console.warn(
                `[${DataManager.name}:loadData] localStorage is not supported, will not be able to save and load`
            );
            return;
        }

        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (savedData === null) {
            return;
        }

        try {
            const parsedData = JSON.parse(savedData)
            this.#updateDataManager(parsedData)
            console.log(`[${DataManager.name}:loadData] Loaded data from localStorage`);
        } catch (error) {
            console.warn(
                `[${DataManager.name}: loadData] Error parsing localStorage data:`
            )
        }
    }

    async saveData(username = 'Player1') {
        const dataToSave = this.#dataManagerDataToGlobalStateObject();

        // 1. Try to save to MongoDB
        try {
            await API.savePlayerData(username, dataToSave);
            console.log(`[${DataManager.name}:saveData] Saved data to MongoDB for ${username}`);
        } catch (error) {
            console.warn(`[${DataManager.name}:saveData] Error saving to MongoDB:`, error);
        }

        // 2. Always save to localStorage as backup
        if (typeof Storage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave))
            console.log(`[${DataManager.name}:saveData] Saved data to localStorage backup`);
        }
    }

    async startNewGame(username = 'Player1') {
        //get existing data before resetting all of the data, so we can persist options data
        const existingData = { ...this.#dataManagerDataToGlobalStateObject() }
        existingData.player.position = { ...initialState.player.position }
        existingData.player.direction = initialState.player.direction
        existingData.player.gameStarted = initialState.gameStarted
        existingData.monsters = {
            inParty: [...initialState.monsters.inParty]
        };
        existingData.inventory = structuredClone(initialState.inventory);

        console.log(`[DataManager:startNewGame] Position set to: ${existingData.player.position.x}, ${existingData.player.position.y}`);
        this.#store.reset();
        this.#updateDataManager(existingData);
        await this.saveData(username);
    }

    getAnimatedTextSpeed() {
        /**
         * @type {import("../common/options.js").TextSpeedMenuOptions | undefined}
         */
        const chosenTextSpeed = this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED)
        if (chosenTextSpeed === undefined) {
            return TEXT_SPEED.MEDIUM
        }

        switch (chosenTextSpeed) {
            case TEXT_SPEED_OPTIONS.FAST:
                return TEXT_SPEED.FAST
            case TEXT_SPEED_OPTIONS.MID:
                return TEXT_SPEED.MEDIUM
            case TEXT_SPEED_OPTIONS.SLOW:
                return TEXT_SPEED.SLOW
            default:
                exhaustiveGuard(chosenTextSpeed)
        }
    }

    /** 
     * @param {Phaser.Scene} scene
     * @returns {import("../types/typedef.js").InventoryItem[]}
     */
    getInventory(scene) {
        /** @type {import('../types/typedef.js').InventoryItem[]} */
        const items = [];
        /** @type {import('../types/typedef.js').Inventory} */
        const inventory = this.#store.get(DATA_MANAGER_STORE_KEYS.INVENTORY);
        inventory.forEach((baseItem) => {
            const item = DataUtils.getItem(scene, baseItem.item.id);
            if (item) {
                items.push({
                    item: item,
                    quantity: baseItem.quantity,
                });
            }
        });
        return items;
    }

    /**
     * @param {number} itemId
     * @param {number} [quantity=1]
     */
    addItem(itemId, quantity = 1) {
        /** @type {import('../types/typedef.js').Inventory} */
        const inventory = this.#store.get(DATA_MANAGER_STORE_KEYS.INVENTORY);
        const itemIndex = inventory.findIndex((item) => item.item.id === itemId);
        if (itemIndex > -1) {
            inventory[itemIndex].quantity += quantity;
        } else {
            inventory.push({
                item: { id: itemId },
                quantity: quantity
            });
        }
        this.#store.set(DATA_MANAGER_STORE_KEYS.INVENTORY, inventory);
    }

    /**
     * @param {import('../types/typedef.js').InventoryItem[]} items
     * @returns {void}
     */
    updateInventory(items) {
        const inventory = items.map((item) => {
            return {
                item: {
                    id: item.item.id,
                },
                quantity: item.quantity,
            };
        });
        this.#store.set(DATA_MANAGER_STORE_KEYS.INVENTORY, inventory);
    }


    /**
     * @param {GlobalState} data
     * @returns {void}
     */
    #updateDataManager(data) {
        this.#store.set({
            [DATA_MANAGER_STORE_KEYS.PLAYER_POSITION]: data.player.position,
            [DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION]: data.player.direction,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED]: data.options.textSpeed,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS]: data.options.battleSceneAnimations,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE]: data.options.battleStyle,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND]: data.options.sound,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME]: data.options.volume,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR]: data.options.menuColor,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_LANGUAGE]: data.options.language,
            [DATA_MANAGER_STORE_KEYS.GAME_STARTED]: data.gameStarted,
            [DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY]: data.monsters.inParty,
            [DATA_MANAGER_STORE_KEYS.INVENTORY]: data.inventory,
            [DATA_MANAGER_STORE_KEYS.SCORE]: data.score || 0,
            [DATA_MANAGER_STORE_KEYS.LEVEL]: data.level || 1,
        })
    }

    #dataManagerDataToGlobalStateObject() {
        return {
            player: {
                position: {
                    x: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION).x,
                    y: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION).y
                },
                direction: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION)
            },
            options: {
                textSpeed: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED),
                battleSceneAnimations: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS),
                battleStyle: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE),
                sound: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND),
                volume: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME),
                menuColor: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR),
                language: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_LANGUAGE)
            },
            gameStarted: this.#store.get(DATA_MANAGER_STORE_KEYS.GAME_STARTED),
            monsters: {
                inParty: [...this.#store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY)]
            },
            inventory: this.#store.get(DATA_MANAGER_STORE_KEYS.INVENTORY),
            score: this.#store.get(DATA_MANAGER_STORE_KEYS.SCORE),
            level: this.#store.get(DATA_MANAGER_STORE_KEYS.LEVEL),
        };
    }
}

export const dataManager = new DataManager()