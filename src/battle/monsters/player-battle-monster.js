import { KENNEY_FUTURE_NARROW_FONT_NAME } from "../../assets/font-keys.js";
import { BattleMonster } from "./battle-monster.js";

/**
 * @type {import('../../types/typedef.js').Coordinate}
 */
const PLAYER_POSITION = Object.freeze({
    x: 300,
    y: 400
});

export class PlayerBattleMonster extends BattleMonster {
    /**@type {Phaser.GameObjects.Text} */
    #healthBarTextGameObject;

    /**
     * @param {import("../../types/typedef").BattleMonsterConfig} config
     */
    constructor(config) {
        super(config, PLAYER_POSITION)
        this._phaserHealthBarGameContainer.setPosition(200, 500)

        this.#addHealthBarComponents()
    }

    //AJUSTA EL UI DE LA BARRA DE VIDA
    #setHealthBarText() {
        this.#healthBarTextGameObject.setText(`${this._currentHealth}/${this._maxHealth}`)
    }

    //AÑADE COMPONENTES A LA BARRA DE VIDA
    #addHealthBarComponents() {
        this.#healthBarTextGameObject = this._scene.add.text(150, 160, '', {
            fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
            color: 'green',
            fontSize: '40px',
            fontStyle: 'italic',
        }).setOrigin(1, 0)
        this.#setHealthBarText()

        this._phaserHealthBarGameContainer.add(this.#healthBarTextGameObject)
    }

    //FUNCION PARA RECIBIR DAÑO
    /**
     * 
     * @param {number} damage 
     * @param {() => void } [callback] 
     */
    takeDamage(damage, callback) {
        super.takeDamage(damage, callback);
        this.#setHealthBarText()
    }


    //ANIMACION DE APARICION
    /**
     * 
     * @param {() => void} callback 
     * @returns {void}
     */
    playMonsterAppearAnimation(callback) {
        const startXPos = -30
        const endXPos = PLAYER_POSITION.x + 70
        this._phaserGameObject.setPosition(startXPos, PLAYER_POSITION.y)
        this._phaserGameObject.setAlpha(1)

        if (this._skipBattleAnimations) {
            this._phaserGameObject.setX(endXPos)
            callback()
            return
        }

        this._scene.tweens.add({
            delay: 0,
            duration: 400,
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
        const startXPos = -30
        const endXPos = PLAYER_POSITION.x - 20
        this._phaserHealthBarGameContainer.setPosition(startXPos, PLAYER_POSITION.y + 100)
        this._phaserHealthBarGameContainer.setAlpha(1)

        if (this._skipBattleAnimations) {
            this._phaserHealthBarGameContainer.setX(endXPos)
            callback()
            return
        }

        this._scene.tweens.add({
            delay: 0,
            duration: 400,
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
        const startYPos = this._phaserGameObject.y
        const endYPos = startYPos - 600;

        if (this._skipBattleAnimations) {
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

    updateMonsterHealth(updatedHp) {
        this._currentHealth = updatedHp;
        if (this._currentHealth > this._maxHealth) {
            this._currentHealth = this._maxHealth;
        }
        this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth, {
            skipBattleAnimations: true
        })

        this.#setHealthBarText()
    }
}