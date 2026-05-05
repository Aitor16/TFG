import { BATTLE_ASSET_KEYS } from "../../assets/asset-keys.js";
import { KENNEY_FUTURE_NARROW_FONT_NAME } from "../../assets/font-keys.js";
import Phaser from "../../lib/phaser.js";
import { DataUtils } from "../../utils/data-utils.js";
import { HealthBar } from "../ui/health-bar.js";

 //CREAMOS LA CLASE
export class BattleMonster {
    //VARIABLES
    /**@protected @type {Phaser.Scene} */
    _scene;
    /**@protected @type {import("../../types/typedef.js").Monster} */
    _monsterDetails;
    /**@protected @type {Phaser.GameObjects.Image} */
    _phaserGameObject;
    /**@protected @type {HealthBar} */
    _healthBar;
    /**@protected @type {number} */
    _currentHealth;
    /**@protected @type {number} */
    _maxHealth;
    /**@protected @type {import("../../types/typedef.js").Attack[]} */
    _monsterAttacks;
    /**@protected @type {Phaser.GameObjects.Container}*/
    _phaserHealthBarGameContainer;
    /**@protected @type {boolean} */
    _skipBattleAnimations;
    /**@protected @type {number} */
    _currentAccuracy;

    /**CONSTRUCTOR
     * @param {import("../../types/typedef.js").BattleMonsterConfig} config 
     * @param {import("../../types/typedef.js").Coordinate} position
     */
    constructor(config, position){
        this._scene = config.scene;
        this._monsterDetails = config.monsterDetails
        this._currentHealth = this._monsterDetails.currentHP
        this._maxHealth = this._monsterDetails.maxHP
        this._currentAccuracy = this._monsterDetails.baseAccuracy
        this._monsterAttacks = []
        this._skipBattleAnimations = config.skipBattleAnimations || false;
        this._phaserGameObject = this._scene.add.image(position.x, position.y, this._monsterDetails.assetKey, this._monsterDetails.assetFrame || 0).setAlpha(0).setFlipX(!!this._monsterDetails.flipX);
        this.#createHealthBarComponents()
        this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth, {
            skipBattleAnimations: false,
            duration: 0
        })

        this._monsterDetails.attackIDs.forEach((attackId) => {
            const monsterAttack = DataUtils.getMonsterAttack(this._scene, attackId)
            if(monsterAttack !== undefined){
                this._monsterAttacks.push(monsterAttack);
            }
        })
    }

    /**@type {boolean} */
    get isFainted(){
        return this._currentHealth <= 0;
    }

    /**@type {string} */
    get name(){
        return this._monsterDetails.name;
    }

    /**@type {import("../../types/typedef.js").Attack[]} */
    get attacks(){
        return [...this._monsterAttacks]
    }

    /**@type {number} */
    get currentHP() {
        return this._currentHealth;
    }

    /**@type {number} */
    get maxHP() {
        return this._maxHealth;
    }

    /**@type {number} */
    get baseAttack(){
        return this._monsterDetails.baseAttack;
    }

    /**@type {number} */
    get baseSpeed(){
        return this._monsterDetails.baseSpeed;
    }

    /**@type {number} */
    get baseAccuracy(){
        return this._monsterDetails.baseAccuracy;
    }

    /**@type {number} */
    get currentAccuracy(){
        return this._currentAccuracy;
    }

    /**@type {number} */
    get level(){
        return this._monsterDetails.level;
    }

    #createHealthBarComponents(scaleHealthBarBackgroundImageByY = 1){
        this._healthBar = new HealthBar(this._scene,-50,60)
        //Crea el nombre del enemigo
        const monsterNameGameText = this._scene.add.text(
            30,
            50,
            this.name, 
            {
                fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
                color: 'white',
                fontSize: '40px'
            }
        )

        const healthBarBgImage = this._scene.add.image(-200,-50,BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1, scaleHealthBarBackgroundImageByY)

        const monsterHealthBarLevelText = this._scene.add.text(monsterNameGameText.width + 40, 50, `L${this.level}`, {
                fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
                color: 'red',
                fontSize: '38px',
                fontStyle: 'italic',
            })

        const monsterHpText = this._scene.add.text(-150,100, 'HP',{
                fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
                color: 'green',
                fontSize: '40px',
                fontStyle: 'italic',
            })

        //Crea el contenedor del enemgio
        this._phaserHealthBarGameContainer = this._scene.add.container(1300,500,[
            healthBarBgImage,
            monsterNameGameText,
            this._healthBar.container,
            monsterHealthBarLevelText,
            monsterHpText
        ]).setAlpha(0);
    }

    /**
     * 
     * @param {number} damage 
     * @param {() => void } [callback] 
     */
    takeDamage(damage,callback){
        //actualizar la vida actual del personaje ademas de animar la barra de vida
        this._currentHealth -= damage
        if(this._currentHealth < 0 ){
            this._currentHealth = 0;
        }
        this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth , {callback})
    }

    /**
     * @param {number} amount
     */
    reduceAccuracy(amount) {
        this._currentAccuracy -= amount;
        if (this._currentAccuracy < 0) {
            this._currentAccuracy = 0;
        }
        console.log(`${this.name}'s accuracy reduced by ${amount}. Current: ${this._currentAccuracy}`);
    }

    /**
     * 
     * @param {() => void} callback 
     * @returns {void}
     */
    playMonsterAppearAnimation(callback) {
        throw new Error('playMonsterAppearAnimation is not implemented')
    }

    /**
     * 
     * @param {() => void} callback 
     * @returns {void}
     */
    playMonsterHealthBarAppearAnimation(callback) {
        throw new Error('playMonsterHealthBarAppearAnimation is not implemented')
    }

     /**
     * 
     * @param {() => void} callback 
     * @returns {void}
     */
    playTakeDamageAnimation(callback) {
        if(this._skipBattleAnimations){
            this._phaserGameObject.setAlpha(1)
            callback()
            return
        }


        this._scene.tweens.add({
            delay: 0,
            duration: 150,
            targets: this._phaserGameObject,
            alpha: {
                from: 1,
                start: 1,
                to: 0,
            },
            repeat: 10,
            onComplete: () => {
                this._phaserGameObject.setAlpha(1)
                callback();
            }
        })
    }
    

    /**
     * 
     * @param {() => void} callback 
     * @returns {void}
     */
    playDeathAnimation(callback) {
        throw new Error('playDeathAnimation is not implemented')
    }

    destroy() {
        this._phaserGameObject.destroy();
        this._phaserHealthBarGameContainer.destroy();
    }
}