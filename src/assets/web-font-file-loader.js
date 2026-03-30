import Phaser from "../lib/phaser.js";
import * as WebFontLoader from '../lib/webfontloader.js'
import { SCENE_KEYS } from "../scenes/scene-keys.js";
import { KENNEY_FUTURE_NARROW_FONT_NAME } from "./font-keys.js";

export class WebFontFileLoader extends Phaser.Loader.File {
    /**@type {string []} */
    #fontNames;

    /**
     * @param {Phaser.Loader.LoaderPlugin} loader 
     * @param {string[]} fontNames 
     */
    constructor(loader, fontNames){
        super(loader, {
            type: 'webfont',
            key: fontNames.toString(),
        })
        this.#fontNames = fontNames
    }

    load(){
        WebFontLoader.default.load({
            custom: {
                families: this.#fontNames,
            },
            active: () => {
                console.log('file loaded')
                this.loader.nextFile(this, true)
            },
            inactive: () => {
                console.error(`Failed to load custom fonts ${JSON.stringify(this.#fontNames)}`)
                this.loader.nextFile(this, false)
            }
        })
    }
};