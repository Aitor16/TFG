import Phaser from "../../lib/phaser.js";
import { ENTITIES_ASSET_KEYS } from "../../assets/asset-keys.js";
import { DIRECTION } from "../../common/direction.js";
import { exhaustiveGuard } from "../../utils/guard.js";
import { Character } from "./character.js";

/**
 * @typedef {keyof typeof NPC_MOVEMENT_PATTERN} NpcMovementPattern
 */

/**
 * @enum {NpcMovementPattern}
 */
export const NPC_MOVEMENT_PATTERN = Object.freeze({
    IDLE: 'IDLE',
    CLOCKWISE: 'CLOCKWISE'
})

/** 
* @typedef NPCConfigProps
* @type {object}
* @property {number} frame
* @property {string[]} messages
* @property {NPCPath} npcPath
* @property {NpcMovementPattern} movementPattern
* @property {string} [dialogBackgroundKey]
*/

/**
 * @typedef NPCPath
 * @type {Object.<number, import('../../types/typedef.js').Coordinate>}
 */

/**
 * @typedef {Omit<import("./character").CharacterConfig, 'idleFrameConfig'> & NPCConfigProps} NPCConfig
 */
export class NPC extends Character{
    /** @protected @type {string} */
    _assetKey;
    /**@type {string[]} */
    #messages
    /**@type {boolean} */
    #talkingToPlayer;
    /**@type {NPCPath} */
    #npcPath
    /**@type {number} */
    #currentPathIndex
    /**@type {NpcMovementPattern} */
    #movementPattern;
    #lastMovementTime
    /**@type {string | undefined} */
    #dialogBackgroundKey

    /**
     * 
     * @param {NPCConfig} config 
     */
    constructor(config){
        const assetKey = config.assetKey || ENTITIES_ASSET_KEYS.NPC;
        const isWalkingNpc = assetKey === ENTITIES_ASSET_KEYS.NPC_WALKING;
        super({
            ...config,
            assetKey: assetKey,
            origin: {x: 0, y:0 },
            idleFrameConfig: {
                DOWN: isWalkingNpc ? 3 : config.frame,
                UP: isWalkingNpc ? 1 : config.frame + 1,
                NONE: isWalkingNpc ? 3 : config.frame,
                LEFT: isWalkingNpc ? 6 : config.frame + 2,
                RIGHT: isWalkingNpc ? 6 : config.frame + 2
            }
        })

        this._assetKey = assetKey;

        this.#messages = config.messages
        if (this._assetKey === ENTITIES_ASSET_KEYS.NPC) {
            this._phaserGameObject.setScale(4)
        }
        this.#talkingToPlayer = false;
        this.#npcPath = config.npcPath
        this.#movementPattern = config.movementPattern
        this.#currentPathIndex = 0
        this.#lastMovementTime = Phaser.Math.Between(3500, 5000)
        this.#dialogBackgroundKey = config.dialogBackgroundKey
    }

    /**@type {string[]} */
    get messages(){
        return [...this.#messages]
    }

    /**@type {boolean} */
    get isTalkingToPlayer(){
        return this.#talkingToPlayer
    }

    /**@type {string | undefined} */
    get dialogBackgroundKey(){
        return this.#dialogBackgroundKey
    }

    /**
     * @param {boolean} val
     */
    set isTalkingToPlayer(val){
        this.#talkingToPlayer = val
    }

    /**
     * 
     * @param {import ('../../common/direction.js').Direction} playerDirection 
     * @returns {void}
     */
    facePlayer(playerDirection){
        switch(playerDirection){
            case DIRECTION.DOWN:
                this._phaserGameObject.setFrame(this._idleFrameConfig.UP).setFlipX(false)
                break;
            case DIRECTION.LEFT:
                this._phaserGameObject.setFrame(this._idleFrameConfig.RIGHT).setFlipX(true)
                break
            case DIRECTION.RIGHT:
                this._phaserGameObject.setFrame(this._idleFrameConfig.LEFT).setFlipX(false)
                break;
            case DIRECTION.UP:
                this._phaserGameObject.setFrame(this._idleFrameConfig.DOWN).setFlipX(false)
                break
            case DIRECTION.NONE:
                break
            default:
                exhaustiveGuard(playerDirection)
        }
    }

    /**
     * @param {DOMHighResTimeStamp} time
     * @returns {void}
     */
    update(time){
        if(this._isMoving){
            return
        }
        if(this.#talkingToPlayer){
            return
        }
        super.update(time)

        if(this.#movementPattern === NPC_MOVEMENT_PATTERN.IDLE){
            return
        }

        if(this.#lastMovementTime < time){
                /**@type {import('../../common/direction.js').Direction} */
                let characterDirection = DIRECTION.NONE
                let nextPosition = this.#npcPath[this.#currentPathIndex + 1]

                const prevPosition = this.#npcPath[this.#currentPathIndex]
                if(prevPosition.x !== this._phaserGameObject.x || prevPosition.y !== this._phaserGameObject.y) {
                    nextPosition = this.#npcPath[this.#currentPathIndex]
                } else {
                    if(nextPosition === undefined){
                        nextPosition = this.#npcPath[0]
                        this.#currentPathIndex = 0
                    } else {
                        this.#currentPathIndex = this.#currentPathIndex + 1
                    }
                }

                if(nextPosition.x > this._phaserGameObject.x){
                    characterDirection = DIRECTION.RIGHT
                } else if ( nextPosition.x < this._phaserGameObject.x){
                    characterDirection = DIRECTION.LEFT
                } else if (nextPosition.y < this._phaserGameObject.y){
                    characterDirection = DIRECTION.UP
                } else if(nextPosition.y > this._phaserGameObject.y){
                    characterDirection = DIRECTION.DOWN
                }

                this.moveCharacter(characterDirection)
                this.#lastMovementTime = time + Phaser.Math.Between(2000, 5000)
            } 
        }


    /**
     * 
     * @param {import ('../../common/direction.js').Direction} direction 
     * @returns {void}
     */
    moveCharacter(direction) {
        super.moveCharacter(direction)

        const animKeyPrefix = this._assetKey === ENTITIES_ASSET_KEYS.NPC ? 'NPC_1' : this._assetKey;

        switch(this._direction){
            case DIRECTION.DOWN:
            case DIRECTION.RIGHT:
            case DIRECTION.UP:
                if(!this._phaserGameObject.anims.isPlaying || this._phaserGameObject.anims.currentAnim?.key !== `${animKeyPrefix}_${this._direction}`){
                    this._phaserGameObject.play(`${animKeyPrefix}_${this._direction}`)
                    this._phaserGameObject.setFlipX(false)
                }
            break;
            case DIRECTION.LEFT:
                if(!this._phaserGameObject.anims.isPlaying || this._phaserGameObject.anims.currentAnim?.key !== `${animKeyPrefix}_${DIRECTION.RIGHT}`){
                    this._phaserGameObject.play(`${animKeyPrefix}_${DIRECTION.RIGHT}`)
                    this._phaserGameObject.setFlipX(true)
                }
                break;
            case DIRECTION.NONE:
                break;
            default:
                exhaustiveGuard(this._direction)
        }
    }
}