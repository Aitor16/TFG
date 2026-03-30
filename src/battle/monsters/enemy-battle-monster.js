import { BattleMonster } from "./battle-monster.js";

const ENEMY_POSITION = Object.freeze({
    x:1400,
    y:400
})

export class EnemyBattleMonster extends BattleMonster{
    /**
     * @param {import("../../types/typedef").BattleMonsterConfig} config
     */
    constructor(config){
        super({...config, scaleHealthBarBackgroundImageByY: 0.8}, ENEMY_POSITION);
    }

    /**
     * 
     * @param {() => void} callback 
     * @returns {void}
     */
    playMonsterAppearAnimation(callback) {
        const startXPos = -30
        const endXPos = ENEMY_POSITION.x
        this._phaserGameObject.setPosition(startXPos, ENEMY_POSITION.y)
        this._phaserGameObject.setAlpha(1)

        if(this._skipBattleAnimations){
            this._phaserGameObject.setX(endXPos)
            callback()
            return
        }

        this._scene.tweens.add({
            delay: 0,
            duration: 800,
            x: {
                from: startXPos,
                start: startXPos,
                to: endXPos
            },
            targets: this._phaserGameObject,
            onComplete: () => {
                callback()
            }
        })
    }

    /**
     * 
     * @param {() => void} callback 
     * @returns {void}
     */
    playMonsterHealthBarAppearAnimation(callback) {
        const startXPos = -600
        const endXPos = 1320
        this._phaserHealthBarGameContainer.setPosition(startXPos, this._phaserHealthBarGameContainer.y)
        this._phaserHealthBarGameContainer.setAlpha(1)

        if(this._skipBattleAnimations){
            this._phaserHealthBarGameContainer.setX(endXPos)
            callback()
            return
        }

        this._scene.tweens.add({
            delay: 0,
            duration: 600,
            x: {
                from: startXPos,
                start: startXPos,
                to: endXPos
            },
            targets: this._phaserHealthBarGameContainer,
            onComplete: () => {
                callback()
            }
        })
    }

    /**
     * 
     * @param {() => void} callback 
     * @returns {void}
     */
    playDeathAnimation(callback) {
        console.log('ACTIVANDO ANIMACION DE MUERTE DEL ENEMIGO')
        const startYPos = this._phaserGameObject.y
        const endYPos = startYPos - 600;

        if(this._skipBattleAnimations){
            this._phaserGameObject.setY(endYPos)
            callback()
            return
        }

        this._scene.tweens.add({
            delay: 0,
            duration: 2000,
            y: {
                from: startYPos,
                start: startYPos,
                to: endYPos
            },
            targets: this._phaserGameObject,
            onComplete: () => {
                callback()
            }
        })
    }
}