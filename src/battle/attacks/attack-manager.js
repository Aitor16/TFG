import Phaser from "../../lib/phaser.js";
import { exhaustiveGuard } from "../../utils/guard.js";
import { ATTACK_KEYS } from "./attack-key.js";
import { Grenade } from "./grenade.js";
import { Slash } from "./slash.js";


/**
 * @typedef {keyof typeof ATTACK_TARGET} AttackTarget
 */

/**@enum {AttackTarget} */
export const ATTACK_TARGET = Object.freeze({
    PLAYER: 'PLAYER',
    ENEMY: 'ENEMY'
})


export class AttackManager{
    /**@type {Phaser.Scene} */
    #scene
    /**@type {boolean} */
    #skipBattleAnimations;
    /**@type {Grenade} */
    #grenadeAttack
    /**@type {Slash} */
    #slashAttack

    /**
     * 
     * @param {Phaser.Scene} scene 
     * @param {boolean} skipBattleAnimations 
     */
    constructor(scene, skipBattleAnimations){
        this.#scene = scene;
        this.#skipBattleAnimations = skipBattleAnimations
    }

    /**
     * 
     * @param {import("./attack-key").AttackKeys} attack 
     * @param {string} target 
     * @param {() => void} callback 
     * @returns {void}
     */
    playAttackAnimation(attack, target, callback){
        if(this.#skipBattleAnimations){
            callback()
            return
        }

        //if attack target is enemy
        let x = 1400
        let y = 350

        if(target === ATTACK_TARGET.PLAYER){
            console.log('ATACANDO A JUGADOR')
            x = 350;
            y = 350;
        }

        switch(attack){
            case ATTACK_KEYS.GRENADE:
                console.log('USANDO GRANADA')
                if(!this.#grenadeAttack){
                    this.#grenadeAttack = new Grenade(this.#scene, {x,y})
                }
                this.#grenadeAttack.gameObject.setPosition(x,y)
                this.#grenadeAttack.playAnimation(callback)
                break;
            case ATTACK_KEYS.SLASH:
                console.log('USANDO SLASH')
                if(!this.#slashAttack){
                    this.#slashAttack = new Slash(this.#scene, {x,y})
                }
                this.#slashAttack.gameObject.setPosition(x,y)
                this.#slashAttack.playAnimation(callback)
                break;
            default:
                exhaustiveGuard(attack)
        }
    }
}