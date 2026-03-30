import Phaser from "../lib/phaser.js";
import { MAIN_BACKGROUND_ASSET_KEYS } from "../assets/asset-keys.js";

export class Background {
    /** @type {Phaser.Scene} */
    #scene;
    /** @type {Phaser.GameObjects.Image} */
    #backgroundGameObject;

    constructor(scene){
        this.#scene = scene;

        this.#backgroundGameObject = this.#scene.add.image(0,-300, MAIN_BACKGROUND_ASSET_KEYS.CITY).setOrigin(0).setAlpha(0).setScale(1.2)
    }

    showCity(){
        this.#backgroundGameObject.setTexture(MAIN_BACKGROUND_ASSET_KEYS.CITY).setAlpha(1)
    }
}