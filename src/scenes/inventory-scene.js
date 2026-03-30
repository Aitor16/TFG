import { INVENTORY_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { DIRECTION } from '../common/direction.js';
import { dataManager } from '../utils/data-manager.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { NineSlice } from '../utils/nine-slice.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';
import { i18n } from '../utils/i18n.js';




const INVENTORY_ITEM_POSITION = Object.freeze({
    x: 116,
    y: 32,
    space: 70,
})
/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const INVENTORY_TEXT_STYLE = Object.freeze({
    fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
    color: '#000000',
    fontSize: '36px'
})
/**
 * @typedef InventoryItemGameObjects
 * @type {object}
 * @property {Phaser.GameObjects.Text} [itemName]
 * @property {Phaser.GameObjects.Text} [quantitySign]
 * @property {Phaser.GameObjects.Text} [quantity]
 */

/**
 * @typedef {import('../types/typedef.js').InventoryItem & { gameObjects: InventoryItemGameObjects }} InventoryItemWithGameObjects
 */

/**
 * @typedef CustomInventory
 * @type {InventoryItemWithGameObjects[]}
 */

/**
 * @typedef InventorySceneData
 * @type {object}
 * @property {string} previousSceneName
 */


/**
 * @typedef InventorySceneWasResumedData
 * @type {object}
 * @property {boolean} itemUsed
 */

/**
 * @typedef InventorySceneItemUsedData
 * @type {object}
 * @property {boolean} itemUsed
 * @property {import('../types/typedef.js').Item} Item
 */
export class InventoryScene extends BaseScene {

    /** @type {InventorySceneData} */
    #sceneData;
    /** @type {NineSlice} */
    #nineSliceMainContainer;
    /** @type {Phaser.GameObjects.Text} */
    #selectedInventoryItemDescriptionText;
    /** @type {Phaser.GameObjects.Image} */
    #userInputCursor;
    #inventory;
    #selectedInventoryItemIndex;
    /** @type {import('../utils/i18n.js').I18n} */
    #i18n;

    constructor() {
        super({
            key: SCENE_KEYS.INVENTORY_SCENE,
        })
    }
    init(data) {
        super.init(data);

        this.#sceneData = data;

        this.#nineSliceMainContainer = new NineSlice({
            cornerCutSize: 32,
            textureManager: this.sys.textures,
            assetKeys: [UI_ASSET_KEYS.MENU_BACKGROUND],
        });
        this.#i18n = i18n(this);
        const inventory = dataManager.getInventory(this);

        this.#inventory = inventory.map((inventoryItem) => {
            return {
                item: inventoryItem.item,
                quantity: inventoryItem.quantity,
                gameObjects: {},
            };
        });
        this.#selectedInventoryItemIndex = 0;
    }
    create() {
        super.create();

        // create custom background

        this.add.image(0, 0, INVENTORY_ASSET_KEYS.INVENTORY_BACKGROUND).setOrigin(0).setDisplaySize(this.scale.width, this.scale.height);
        this.add.image(40, 120, INVENTORY_ASSET_KEYS.INVENTORY_BAG).setOrigin(0).setScale(1);

        const container = this.#nineSliceMainContainer.createNineSliceContainer(this, 1250, 650, UI_ASSET_KEYS.MENU_BACKGROUND).setPosition(600, 20);
        const containerBackground = this.add.rectangle(4, 4, 1242, 642, 0xffff88).setOrigin(0).setAlpha(0.6);
        container.add(containerBackground);

        const titleContainer = this.#nineSliceMainContainer.createNineSliceContainer(this, 540, 74, UI_ASSET_KEYS.MENU_BACKGROUND).setPosition(64, 20);
        const titleContainerBackground = this.add.rectangle(4, 4, 532, 66, 0xffff88).setOrigin(0).setAlpha(0.6);
        titleContainer.add(titleContainerBackground);

        const textTitle = this.add.text(256, 38, this.#i18n.t('INVENTORY.TITLE'), INVENTORY_TEXT_STYLE).setOrigin(0.5);
        titleContainer.add(textTitle);

        // create inventory text from available items
        this.#inventory.forEach((inventoryItem, index) => {
            const itemName = this.#i18n.t(`ITEMS.${inventoryItem.item.id}.NAME`, { defaultValue: inventoryItem.item.name });
            const itemText = this.add.text(INVENTORY_ITEM_POSITION.x, INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space, itemName, INVENTORY_TEXT_STYLE);
            const qty1Text = this.add.text(1100, INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space + 5, 'x', {
                color: '#000000',
                fontSize: '36px',
                fontStyle: 'bold',
            });
            const qty2Text = this.add.text(1125, INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space, inventoryItem.quantity, INVENTORY_TEXT_STYLE);
            container.add([itemText, qty1Text, qty2Text]);
            inventoryItem.gameObjects = {
                itemName: itemText,
                quantity: qty2Text,
                quantitySign: qty1Text,
            }
        })


        // create cancel text
        const cancelText = this.add.text(INVENTORY_ITEM_POSITION.x, INVENTORY_ITEM_POSITION.y + this.#inventory.length * INVENTORY_ITEM_POSITION.space, this.#i18n.t('INVENTORY.CANCEL'), INVENTORY_TEXT_STYLE);
        container.add(cancelText);

        // create player input cursor
        this.#userInputCursor = this.add.image(80, 50, UI_ASSET_KEYS.CURSOR_WHITE).setScale(0.15).setRotation(Phaser.Math.DegToRad(140));
        container.add(this.#userInputCursor);

        // create inventory description text

        this.#selectedInventoryItemDescriptionText = this.add.text(38, 800, 'asdfs', {
            ...INVENTORY_TEXT_STYLE,
            ...{
                wordWrap: {
                    width: this.scale.width - 15,
                },
                color: '#ffffff',
            },
        });

        this.#updateItemDescriptionText();
    }

    #updateItemDescriptionText() {
        if (this.#isCancelButtonSelected()) {
            this.#selectedInventoryItemDescriptionText.setText(this.#i18n.t('INVENTORY.CANCEL_DESC'));
            return;
        }


        const itemDescription = this.#i18n.t(`ITEMS.${this.#inventory[this.#selectedInventoryItemIndex].item.id}.DESC`, { defaultValue: this.#inventory[this.#selectedInventoryItemIndex].item.description });
        this.#selectedInventoryItemDescriptionText.setText(itemDescription);

    }

    #isCancelButtonSelected() {
        return this.#selectedInventoryItemIndex === this.#inventory.length;
    }


    update() {
        super.update();

        if (this._controls.isInputLocked) {
            return
        }

        if (this._controls.wasBackKeyPressed()) {
            this.#goBackToPreviousScene(false);
            return
        }

        const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
        if (wasSpaceKeyPressed) {
            if (this.#isCancelButtonSelected()) {
                this.#goBackToPreviousScene(false);
                return
            }

            if (this.#inventory[this.#selectedInventoryItemIndex].quantity < 1) {
                return;
            }

            const sceneDataToPass = {
                previousSceneName: SCENE_KEYS.INVENTORY_SCENE,
                itemSelected: this.#inventory[this.#selectedInventoryItemIndex].item,
            }
            this._controls.lockInput = true;
            this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, sceneDataToPass)
            this.scene.pause(SCENE_KEYS.INVENTORY_SCENE);
            return;
        }

        const selectedDirection = this._controls.getDirectionKeyJustPressed();
        if (selectedDirection !== DIRECTION.NONE) {
            this.#movePlayerInputCursor(selectedDirection);
            this.#updateItemDescriptionText();
        }
    }


    handleSceneResume(sys, data) {
        super.handleSceneResume(sys, data);
        if (!data || !data.itemUsed) { return; }
        const selectedItem = this.#inventory[this.#selectedInventoryItemIndex];
        selectedItem.quantity -= 1;
        selectedItem.gameObjects.quantity.setText(`${selectedItem.quantity}`);
        dataManager.updateInventory(this.#inventory);

        if (this.#sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
            this.#goBackToPreviousScene(true, selectedItem.item);
        }
    }
    #goBackToPreviousScene(wasItemUsed, item) {
        //
        this._controls.lockInput = true;
        this.scene.stop(SCENE_KEYS.INVENTORY_SCENE);
        const sceneDataToPass = {
            itemUsed: wasItemUsed,
            item,
        }
        this.scene.resume(this.#sceneData.previousSceneName, sceneDataToPass);
    }

    /**
     * 
     * @param {import('../common/direction.js').Direction} direction 
     * @returns {void}
     */
    #movePlayerInputCursor(direction) {
        switch (direction) {
            case DIRECTION.UP:
                this.#selectedInventoryItemIndex -= 1;

                if (this.#selectedInventoryItemIndex < 0) {
                    this.#selectedInventoryItemIndex = this.#inventory.length;
                }

                break;
            case DIRECTION.DOWN:
                this.#selectedInventoryItemIndex += 1;

                if (this.#selectedInventoryItemIndex > this.#inventory.length) {
                    this.#selectedInventoryItemIndex = 0;
                }
                break;
            case DIRECTION.LEFT:
            case DIRECTION.RIGHT:
                return;
            case DIRECTION.NONE:
                break;
            default:
                exhaustiveGuard(direction);
        }
        const y = 50 + this.#selectedInventoryItemIndex * INVENTORY_ITEM_POSITION.space;
        this.#userInputCursor.setY(y);
    }
}
