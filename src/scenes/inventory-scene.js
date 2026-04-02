import { INVENTORY_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME, OldNewspaperTypes } from '../assets/font-keys.js';
import { DIRECTION } from '../common/direction.js';
import { dataManager } from '../utils/data-manager.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { NineSlice } from '../utils/nine-slice.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';
import { i18n } from '../utils/i18n.js';

/**
 * Posición base y espaciado de los items en el inventario
 */
const INVENTORY_ITEM_POSITION = Object.freeze({
    x: 116,
    y: 32,
    space: 70,        // Espacio vertical entre cada fila de items
});

/** Estilo de texto usado en el inventario */
const INVENTORY_TEXT_STYLE = Object.freeze({
    fontFamily: OldNewspaperTypes,
    color: '#000000',
    fontSize: '36px'
});

/**
 * @typedef InventoryItemGameObjects
 * @type {object}
 * @property {Phaser.GameObjects.Text} [itemName]      - Texto con el nombre del objeto
 * @property {Phaser.GameObjects.Text} [quantitySign]  - Texto "x" que indica cantidad
 * @property {Phaser.GameObjects.Text} [quantity]      - Número que muestra la cantidad
 */

/**
 * Extiende el item del inventario añadiéndole los objetos de Phaser que lo representan en pantalla
 * @typedef {import('../types/typedef.js').InventoryItem & { gameObjects: InventoryItemGameObjects }} InventoryItemWithGameObjects
 */

/** @typedef {InventoryItemWithGameObjects[]} CustomInventory */

/** Datos que recibe la escena al iniciarse */
const InventorySceneData = {
    previousSceneName: ''   // Nombre de la escena desde la que se abrió el inventario
};

/** Datos que recibe cuando la escena se reanuda (después de usar un item) */
const InventorySceneWasResumedData = {
    itemUsed: false
};

/** Datos que se envían cuando se usa un item */
const InventorySceneItemUsedData = {
    itemUsed: false,
    item: null      // El item que fue usado
};


export class InventoryScene extends BaseScene {

    /** @type {InventorySceneData} */
    #sceneData;

    /** Contenedor con bordes estilo "nine slice" para la ventana principal */
    /** @type {NineSlice} */
    #nineSliceMainContainer;

    /** Texto que muestra la descripción del item seleccionado */
    /** @type {Phaser.GameObjects.Text} */
    #selectedInventoryItemDescriptionText;

    /** Cursor que indica qué item está seleccionado */
    /** @type {Phaser.GameObjects.Image} */
    #userInputCursor;

    /** Lista de items del inventario con sus objetos visuales */
    #inventory;

    /** Índice del item actualmente seleccionado */
    #selectedInventoryItemIndex;

    /** Sistema de traducción (internacionalización) */
    /** @type {import('../utils/i18n.js').I18n} */
    #i18n;

    constructor() {
        super({ key: SCENE_KEYS.INVENTORY_SCENE });
    }

    /**
     * Se ejecuta antes de crear la escena
     */
    init(data) {
        super.init(data);

        this.#sceneData = data;

        // *Creamos el sistema de nine-slice para los contenedores con bordes
        this.#nineSliceMainContainer = new NineSlice({
            cornerCutSize: 32,
            textureManager: this.sys.textures,
            assetKeys: [UI_ASSET_KEYS.MENU_BACKGROUND],
        });
        

        this.#i18n = i18n(this);

        // Obtenemos el inventario desde el gestor de datos y lo preparamos
        const inventory = dataManager.getInventory(this);

        this.#inventory = inventory.map((inventoryItem) => {
            return {
                item: inventoryItem.item,
                quantity: inventoryItem.quantity,
                gameObjects: {},        // Aquí guardaremos los textos (nombre y cantidad)
            };
        });

        this.#selectedInventoryItemIndex = 0;   // Empezamos seleccionando el primer item
    }

    /**
     * Se ejecuta una vez al crear la escena
     */
    create() {
        super.create();

        // Fondo completo de la escena de inventario
        this.add.image(0, 0, INVENTORY_ASSET_KEYS.INVENTORY_BACKGROUND)
            .setOrigin(0)
            .setDisplaySize(this.scale.width, this.scale.height);

        // Imagen de la mochila decorativa
        /*this.add.image(40, 120, INVENTORY_ASSET_KEYS.INVENTORY_BAG)
            .setOrigin(0)
            .setScale(1);*/

        // Contenedor principal con bordes (nine-slice)
        const container = this.#nineSliceMainContainer.createNineSliceContainer(this, 1250, 650)
            .setPosition(600, 120);

        // Fondo semi-transparente amarillo dentro del contenedor
        const containerBackground = this.add.rectangle(4, 4, 1242, 642)
            .setOrigin(0)
            .setAlpha(0.6);
        container.add(containerBackground);

        // Contenedor para el título "INVENTARIO"
        const titleContainer = this.#nineSliceMainContainer.createNineSliceContainer(this, 100, 74)
            .setPosition(500, 70);

        const titleContainerBackground = this.add.rectangle(4, 4, 532, 66)
            .setOrigin(0)
            .setAlpha(0.6);
        titleContainer.add(titleContainerBackground);

        // Texto del título
        const textTitle = this.add.text(256, 38, this.#i18n.t('INVENTORY.TITLE'), INVENTORY_TEXT_STYLE)
            .setOrigin(0.5);
        titleContainer.add(textTitle);

        // === Crear los items del inventario ===
        this.#inventory.forEach((inventoryItem, index) => {
            const itemName = this.#i18n.t(`ITEMS.${inventoryItem.item.id}.NAME`, { 
                defaultValue: inventoryItem.item.name 
            });

            // Nombre del objeto
            const itemText = this.add.text(
                INVENTORY_ITEM_POSITION.x, 
                INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space, 
                itemName, 
                INVENTORY_TEXT_STYLE
            );

            // Texto "x" de cantidad
            const qty1Text = this.add.text(1100, INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space + 5, 'x', {
                color: '#000000',
                fontSize: '36px',
                fontStyle: 'bold',
            });

            // Cantidad numérica
            const qty2Text = this.add.text(1125, INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space, inventoryItem.quantity, INVENTORY_TEXT_STYLE);

            container.add([itemText, qty1Text, qty2Text]);

            // Guardamos las referencias para poder actualizarlas después
            inventoryItem.gameObjects = {
                itemName: itemText,
                quantity: qty2Text,
                quantitySign: qty1Text,
            };
        });

        // Texto "Cancelar" al final de la lista
        const cancelText = this.add.text(
            INVENTORY_ITEM_POSITION.x, 
            INVENTORY_ITEM_POSITION.y + this.#inventory.length * INVENTORY_ITEM_POSITION.space, 
            this.#i18n.t('INVENTORY.CANCEL'), 
            INVENTORY_TEXT_STYLE
        );
        container.add(cancelText);

        // Cursor de selección (flecha)
        this.#userInputCursor = this.add.image(80, 50, UI_ASSET_KEYS.CURSOR_WHITE)
            .setScale(0.15)
            .setRotation(Phaser.Math.DegToRad(140));
        container.add(this.#userInputCursor);

        // Texto de descripción del item seleccionado (abajo)
        this.#selectedInventoryItemDescriptionText = this.add.text(38, 800, '', {
            ...INVENTORY_TEXT_STYLE,
            wordWrap: { width: this.scale.width - 15 },
            color: '#ffffff',
        });

        this.#updateItemDescriptionText();
    }

    /**
     * Actualiza el texto de descripción según el item seleccionado
     */
    #updateItemDescriptionText() {
        if (this.#isCancelButtonSelected()) {
            this.#selectedInventoryItemDescriptionText.setText(this.#i18n.t('INVENTORY.CANCEL_DESC'));
            return;
        }

        const itemDescription = this.#i18n.t(`ITEMS.${this.#inventory[this.#selectedInventoryItemIndex].item.id}.DESC`, {
            defaultValue: this.#inventory[this.#selectedInventoryItemIndex].item.description
        });

        this.#selectedInventoryItemDescriptionText.setText(itemDescription);
    }

    /**
     * Devuelve true si el jugador tiene seleccionado el botón "Cancelar"
     */
    #isCancelButtonSelected() {
        return this.#selectedInventoryItemIndex === this.#inventory.length;
    }

    /**
     * Bucle principal de actualización
     */
    update() {
        super.update();

        if (this._controls.isInputLocked) return;

        // Botón de volver atrás
        if (this._controls.wasBackKeyPressed()) {
            this.#goBackToPreviousScene(false);
            return;
        }

        // Presionar espacio = usar item o cancelar
        if (this._controls.wasSpaceKeyPressed()) {
            if (this.#isCancelButtonSelected()) {
                this.#goBackToPreviousScene(false);
                return;
            }

            // No se puede usar un item con cantidad 0
            if (this.#inventory[this.#selectedInventoryItemIndex].quantity < 1) {
                return;
            }

            // Abrimos la escena de selección de monstruo/party para usar el item
            const sceneDataToPass = {
                previousSceneName: SCENE_KEYS.INVENTORY_SCENE,
                itemSelected: this.#inventory[this.#selectedInventoryItemIndex].item,
            };

            this._controls.lockInput = true;
            this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, sceneDataToPass);
            this.scene.pause(SCENE_KEYS.INVENTORY_SCENE);
            return;
        }

        // Movimiento con flechas arriba/abajo
        const selectedDirection = this._controls.getDirectionKeyJustPressed();
        if (selectedDirection !== DIRECTION.NONE) {
            this.#movePlayerInputCursor(selectedDirection);
            this.#updateItemDescriptionText();
        }
    }

    /**
     * Se ejecuta cuando volvemos a esta escena (después de usar un item)
     */
    handleSceneResume(sys, data) {
        super.handleSceneResume(sys, data);

        if (!data || !data.itemUsed) return;

        // Reducimos la cantidad del item usado
        const selectedItem = this.#inventory[this.#selectedInventoryItemIndex];
        selectedItem.quantity -= 1;
        selectedItem.gameObjects.quantity.setText(`${selectedItem.quantity}`);

        // Guardamos el inventario actualizado
        dataManager.updateInventory(this.#inventory);

        // Si veníamos de una batalla, volvemos directamente a ella
        if (this.#sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
            this.#goBackToPreviousScene(true, selectedItem.item);
        }
    }

    /**
     * Vuelve a la escena anterior
     */
    #goBackToPreviousScene(wasItemUsed, item = null) {
        this._controls.lockInput = true;
        this.scene.stop(SCENE_KEYS.INVENTORY_SCENE);

        const sceneDataToPass = {
            itemUsed: wasItemUsed,
            item: item,
        };

        this.scene.resume(this.#sceneData.previousSceneName, sceneDataToPass);
    }

    /**
     * Mueve el cursor de selección arriba o abajo
     * @param {import('../common/direction.js').Direction} direction
     */
    #movePlayerInputCursor(direction) {
        switch (direction) {
            case DIRECTION.UP:
                this.#selectedInventoryItemIndex -= 1;
                if (this.#selectedInventoryItemIndex < 0) {
                    this.#selectedInventoryItemIndex = this.#inventory.length; // Ir al "Cancelar"
                }
                break;

            case DIRECTION.DOWN:
                this.#selectedInventoryItemIndex += 1;
                if (this.#selectedInventoryItemIndex > this.#inventory.length) {
                    this.#selectedInventoryItemIndex = 0; // Volver al primer item
                }
                break;

            case DIRECTION.LEFT:
            case DIRECTION.RIGHT:
                return; // No hacemos nada con izquierda/derecha

            case DIRECTION.NONE:
                break;

            default:
                exhaustiveGuard(direction);
        }

        // Actualizamos la posición Y del cursor
        const y = 50 + this.#selectedInventoryItemIndex * INVENTORY_ITEM_POSITION.space;
        this.#userInputCursor.setY(y);
    }
}