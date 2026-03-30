import { UI_ASSET_KEYS } from '../../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../../assets/font-keys.js';
import { DIRECTION } from '../../common/direction.js';
import Phaser from '../../lib/phaser.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../../utils/data-manager.js';
import { exhaustiveGuard } from '../../utils/guard.js';
import { MENU_COLOR } from './menu-config.js';
import { i18n } from '../../utils/i18n.js';

/**
 * @typedef {keyof typeof MENU_OPTIONS} MenuOptions
 */

/** @enum {MenuOptions} */
export const MENU_OPTIONS = Object.freeze({
  MONSTERDEX: 'MONSTERDEX',
  MONSTERS: 'MONSTERS',
  BAG: 'BAG',
  SAVE: 'SAVE',
  OPTIONS: 'OPTIONS',
  EXIT: 'EXIT',
  YES: 'YES',
  NO: 'NO',
});

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const MENU_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '32px',
};

export class Menu {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {number} */
  #padding;
  /** @type {number} */
  #width;
  /** @type {number} */
  #height;
  /** @type {Phaser.GameObjects.Graphics} */
  #graphics;
  /** @type {Phaser.GameObjects.Container} */
  #container;
  /** @type {boolean} */
  #isVisible;
  /** @type {MenuOptions[]} */
  #availableMenuOptions;
  /** @type {Phaser.GameObjects.Text[]} */
  #menuOptionsTextGameObjects;
  /** @type {number} */
  #selectedMenuOptionIndex;
  /** @type {MenuOptions} */
  #selectedMenuOption;
  /** @type {Phaser.GameObjects.Image} */
  #userInputCursor;
  /** @type {number} */ // Añadimos constante para la altura de cada opción
  #menuItemHeight;
  /** @type {import('../../utils/i18n.js').I18n} */
  #i18n;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.#scene = scene;
    this.#padding = 4;
    this.#width = 300;
    this.#availableMenuOptions = [MENU_OPTIONS.MONSTERS, MENU_OPTIONS.BAG, MENU_OPTIONS.SAVE, MENU_OPTIONS.OPTIONS, MENU_OPTIONS.EXIT];
    this.#menuOptionsTextGameObjects = [];
    this.#selectedMenuOptionIndex = 0;
    this.#menuItemHeight = 50; // Altura constante para cada opción del menú
    this.#i18n = i18n(this.#scene);

    // calculate height based on currently available options
    this.#height = 10 + this.#padding * 2 + this.#availableMenuOptions.length * this.#menuItemHeight;

    this.#graphics = this.#createGraphics();
    this.#container = this.#scene.add.container(0, 0, [this.#graphics]);

    // update menu container with menu options
    for (let i = 0; i < this.#availableMenuOptions.length; i += 1) {
      // CORREGIDO: Ajustamos la posición Y para que sea consistente
      const y = this.#padding * 2 + i * this.#menuItemHeight;
      const menuText = this.#i18n.t(`WORLD_MENU.${this.#availableMenuOptions[i]}`, { defaultValue: this.#availableMenuOptions[i] });
      const textObj = this.#scene.add.text(40 + this.#padding, y, menuText, MENU_TEXT_STYLE);
      this.#menuOptionsTextGameObjects.push(textObj);
      this.#container.add(textObj);
    }

    // CORREGIDO: Posicionamos el cursor alineado con la primera opción
    const cursorX = 20 + this.#padding;
    const cursorY = this.#padding * 2 + 14; // Ajuste fino para centrar el cursor con el texto
    this.#userInputCursor = this.#scene.add.image(cursorX, cursorY, UI_ASSET_KEYS.CURSOR_WHITE);
    this.#userInputCursor.setScale(0.08);
    this.#container.add(this.#userInputCursor);

    this.hide();
  }

  /** @type {boolean} */
  get isVisible() {
    return this.#isVisible;
  }

  /** @type {MenuOptions} */
  get selectedMenuOption() {
    return this.#selectedMenuOption;
  }

  show() {
    const { right, top } = this.#scene.cameras.main.worldView;
    const startX = right - this.#padding * 2 - this.#width;
    const startY = top + this.#padding * 2;

    this.#container.setPosition(startX, startY);
    this.#container.setAlpha(1);
    this.#isVisible = true;
  }

  hide() {
    this.#container.setAlpha(0);
    this.#selectedMenuOptionIndex = 0;
    this.#moveMenuCursor(DIRECTION.NONE);
    this.#isVisible = false;
  }

  /**
   * @param {import('../../common/direction.js').Direction|'OK'|'CANCEL'} input
   * @returns {void}
   */
  handlePlayerInput(input) {
    if (input === 'CANCEL') {
      this.hide();
      return;
    }

    if (input === 'OK') {
      this.#handleSelectedMenuOption();
      return;
    }


    // update selected menu option based on player input
    this.#moveMenuCursor(input);
  }

  /**
   * @param {MenuOptions[]} options
   * @returns {void}
   */
  setOptions(options) {
    this.#availableMenuOptions = options;
    this.#selectedMenuOptionIndex = 0;

    // Clear existing text objects
    this.#menuOptionsTextGameObjects.forEach(obj => obj.destroy());
    this.#menuOptionsTextGameObjects = [];

    // Recalculate height
    this.#height = 10 + this.#padding * 2 + this.#availableMenuOptions.length * this.#menuItemHeight;
    
    // Redraw background
    this.#graphics.clear();
    const menuColor = this.#getMenuColorsFromDataManager();
    this.#graphics.fillStyle(menuColor.main, 1);
    this.#graphics.fillRect(1, 0, this.#width - 1, this.#height - 1);
    this.#graphics.lineStyle(8, menuColor.border, 1);
    this.#graphics.strokeRect(0, 0, this.#width, this.#height);

    // Create new text objects
    for (let i = 0; i < this.#availableMenuOptions.length; i += 1) {
      const y = this.#padding * 2 + i * this.#menuItemHeight;
      const menuText = this.#i18n.t(`WORLD_MENU.${this.#availableMenuOptions[i]}`, { defaultValue: this.#availableMenuOptions[i] });
      const textObj = this.#scene.add.text(40 + this.#padding, y, menuText, MENU_TEXT_STYLE);
      this.#menuOptionsTextGameObjects.push(textObj);
      this.#container.add(textObj);
    }

    // Reset cursor position
    this.#moveMenuCursor(DIRECTION.NONE);
  }

  #createGraphics() {
    const g = this.#scene.add.graphics();
    const menuColor = this.#getMenuColorsFromDataManager();

    g.fillStyle(menuColor.main, 1);
    g.fillRect(1, 0, this.#width - 1, this.#height - 1);
    g.lineStyle(8, menuColor.border, 1);
    g.strokeRect(0, 0, this.#width, this.#height);
    g.setAlpha(0.9);

    return g;
  }

  /**
   * @param {import('../../common/direction.js').Direction} direction
   * @returns {void}
   */
  #moveMenuCursor(direction) {
    switch (direction) {
      case DIRECTION.UP:
        this.#selectedMenuOptionIndex -= 1;
        if (this.#selectedMenuOptionIndex < 0) {
          this.#selectedMenuOptionIndex = this.#availableMenuOptions.length - 1;
        }
        break;
      case DIRECTION.DOWN:
        this.#selectedMenuOptionIndex += 1;
        if (this.#selectedMenuOptionIndex > this.#availableMenuOptions.length - 1) {
          this.#selectedMenuOptionIndex = 0;
        }
        break;
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
        return;
      case DIRECTION.NONE:
        break;
      default:
        console.log(this.#selectedMenuOption)
        exhaustiveGuard(direction);
    }

    // CORREGIDO: Usamos la misma fórmula que para posicionar los textos
    const x = 20 + this.#padding;
    const y = this.#padding * 2 + 14 + this.#selectedMenuOptionIndex * this.#menuItemHeight;

    this.#userInputCursor.setPosition(x, y);
  }

  /**
   * @returns {void}
   */
  #handleSelectedMenuOption() {
    this.#selectedMenuOption = this.#availableMenuOptions[this.#selectedMenuOptionIndex];
    console.log(this.#selectedMenuOption)
  }

  /**
   * @returns{{ main: number; border: number; }}
   */
  #getMenuColorsFromDataManager() {
    /**@type {import('../../common/options.js').MenuColorOptions} */
    const chosenMenuColor = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR)
    if (chosenMenuColor === undefined) {
      return MENU_COLOR[1]
    }
    switch (chosenMenuColor) {
      case 0:
        return MENU_COLOR[1]
      case 1:
        return MENU_COLOR[2]
      case 2:
        return MENU_COLOR[3]
      default:
        exhaustiveGuard(chosenMenuColor)
    }
  }
}