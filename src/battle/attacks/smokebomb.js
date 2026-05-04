import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js";
import { Attack } from "./attack.js";

export class Smokebomb extends Attack{
    /**@protected @type {Phaser.GameObjects.Sprite} */
    _attackGameObject
    /**
     * 
     * @param {Phaser.Scene} scene 
     * @type {import ("../../types/typedef").Coordinate}
     */
    constructor(scene, position){
        super(scene, position);

        // create game objects
        this._attackGameObject = this._scene.add.sprite(this._position.x, this._position.y, ATTACK_ASSET_KEYS.SMOKEBOMB, 0)
        .setOrigin(0.5)
        .setScale(0.5) // Adjust scale since the original image is very large (724x724)
        .setAlpha(0)

    }
    /**
         * @param {() => void} [callback]
         * @returns {void}
         */
        playAnimation(callback){
            if(this._isAnimationPlaying){
                return
            }

            this._isAnimationPlaying = true
            this._attackGameObject.setAlpha(1)

            this._attackGameObject.play(ATTACK_ASSET_KEYS.SMOKEBOMB)
            
            this._attackGameObject.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.SMOKEBOMB, () => {
                this._isAnimationPlaying = false
                this._attackGameObject.setAlpha(0)
                this._attackGameObject.setFrame(0)
                if(callback){
                    callback()
                }
            })
        }
}
