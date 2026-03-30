import Phaser from "../../lib/phaser.js";
import { Attack } from "./attack.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js";


export class Slash extends Attack {
    /**@protected @type {Phaser.GameObjects.Container} */
    _attackGameObject
    /**@protected @type {Phaser.GameObjects.Sprite} */
    _attackGameObject1
    /**@protected @type {Phaser.GameObjects.Sprite} */
    _attackGameObject2
    /**@protected @type {Phaser.GameObjects.Sprite} */
    _attackGameObject3

    /**
     * 
     * @param {Phaser.Scene} scene 
     * @type {import ("../../types/typedef").Coordinate}
     */
    constructor(scene, position){
        super(scene, position)     
        //create animations
        this._scene.anims.create({
            key: ATTACK_ASSET_KEYS.SLASH,
            frames: this._scene.anims.generateFrameNumbers(ATTACK_ASSET_KEYS.SLASH),
            frameRate: 10,
            repeat: 0,
            delay: 0,
        })

        //create game objects
        this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.SLASH, 0)
        .setOrigin(0.5)
        .setScale(2)
        this._attackGameObject2 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.SLASH, 0)
        .setOrigin(30.5)
        .setScale(2)
        this._attackGameObject3 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.SLASH, 0)
        .setOrigin(-30.5)
        .setScale(2)
        this._attackGameObject = this._scene.add.container(this._position.x, this._position.y, [
            this._attackGameObject1,
            this._attackGameObject2,
            this._attackGameObject3,
        ]).setAlpha(0)
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

            this._attackGameObject1.play(ATTACK_ASSET_KEYS.SLASH)
            this._attackGameObject2.play(ATTACK_ASSET_KEYS.SLASH)
            this._attackGameObject3.play(ATTACK_ASSET_KEYS.SLASH)
           
            this._attackGameObject1.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.SLASH, () => {
                this._isAnimationPlaying = false
                this._attackGameObject.setAlpha(0)
                this._attackGameObject1.setFrame(0)
                this._attackGameObject2.setFrame(0)
                this._attackGameObject3.setFrame(0)
                if(callback){
                    callback()
                }
            })
        }
    
}