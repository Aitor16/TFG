import { DATA_ASSET_KEYS } from "../assets/asset-keys.js";
import { LANGUAGE_OPTIONS } from "../common/options.js";
import { dataManager, DATA_MANAGER_STORE_KEYS } from "./data-manager.js";

export class I18n {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {object} */
  #translations;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.#scene = scene;
    this.refresh();
  }

  refresh() {
    const language = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_LANGUAGE) || LANGUAGE_OPTIONS.ENGLISH;
    const assetKey = language === LANGUAGE_OPTIONS.ENGLISH ? DATA_ASSET_KEYS.I18N_EN : DATA_ASSET_KEYS.I18N_ES;
    this.#translations = this.#scene.cache.json.get(assetKey) || {};
  }

  /**
   * @param {string} key e.g. "BATTLE_MENU.FIGHT"
   * @param {object} [params] e.g. { itemName: "Potion" }
   * @returns {string}
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.#translations;
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value === 'string') {
      let result = value;
      Object.keys(params).forEach(param => {
        result = result.replace(`{${param}}`, params[param]);
      });
      return result;
    }

    return key;
  }
}

/**
 * @param {Phaser.Scene} scene
 * @returns {I18n}
 */
export const i18n = (scene) => new I18n(scene);
