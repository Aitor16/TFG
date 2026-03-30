import { BATTLE_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MONSTER_PARTY_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { HealthBar } from '../battle/ui/health-bar.js';
import { DIRECTION } from '../common/direction.js';
import Phaser from '../lib/phaser.js';
import { ITEM_EFFECT } from '../types/typedef.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from "./scene-keys.js";
import { i18n } from "../utils/i18n.js";


/**@type {Phaser.Types.GameObjects.Text.TextStyle} */
const UI_TEXT_STYLE = Object.freeze({
    fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
    color: '#FFFFFF',
    fontSize: '50px'
})

const MONSTER_PARTY_POSITIONS = Object.freeze({
    EVEN: {
        x: 0,
        y: 10
    },
    ODD: {
        x: 950,
        y: 40
    },
    increment: 280
})


export class MonsterPartyScene extends BaseScene {
    /**@type {Phaser.GameObjects.Image[]} */
    #monsterPartyBackgrounds;

    /**@type {Phaser.GameObjects.Image} */
    #cancelButton;

    /**@type {Phaser.GameObjects.Text} */
    #infoTextGameObject;

    /**@type {HealthBar[]} */
    #healthBars;

    /**@type {Phaser.GameObjects.Text[]} */
    #healthBarTextGameObjects;

    /**@type {number} */
    #selectedPartyMonsterIndex;

    /**@type {import('../types/typedef.js').Monster[]} */
    #monsters;
    /**@type {import('../types/typedef.js').MonsterPartySceneData} */
    #sceneData;
    /**@type {boolean} */
    #waitingForInput;
    /** @type {import('../utils/i18n.js').I18n} */
    #i18n;


    constructor() {
        super({
            key: SCENE_KEYS.MONSTER_PARTY_SCENE,
        })
    }

    /**
     * 
     * @returns {void}  
     */
    init(data) {
        super.init(data);

        this.#sceneData = data;
        this.#monsterPartyBackgrounds = [];
        this.#healthBars = [];
        this.#healthBarTextGameObjects = [];
        this.#selectedPartyMonsterIndex = 0;
        this.#monsters = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY);
        this.#waitingForInput = false;
        this.#i18n = i18n(this);
    }

    create() {
        super.create();

        // create custom background
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 1).setOrigin(0)
        this.add
            .tileSprite(0, 0, this.scale.width, this.scale.height, MONSTER_PARTY_ASSET_KEYS.PARTY_BACKGROUND, 0)
            .setOrigin(0)
            .setAlpha(0.7)

        // create button
        const buttonContainer = this.add.container(1600, 950, []);
        this.#cancelButton = this.add.image(0, 0, UI_ASSET_KEYS.BLUE_BUTTON, 0).setOrigin(0).setScale(1.5, 2).setAlpha(0.7)
        const cancelText = this.add.text(150.5, 40.6, this.#i18n.t('MONSTER_PARTY.CANCEL'), UI_TEXT_STYLE).setOrigin(0.5)
        buttonContainer.add([this.#cancelButton, cancelText])

        //create info container
        const infoContainer = this.add.container(20, this.scale.height - 150, [])
        const infoDisplay = this.add.rectangle(0, 0, 1550, 130, 0xede4f3, 1).setOrigin(0).setStrokeStyle(8, 0x905ac2, 1)
        this.#infoTextGameObject = this.add.text(35, 14, '', {
            fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
            color: '#000000',
            fontSize: '50px'
        })
        infoContainer.add([infoDisplay, this.#infoTextGameObject])
        this.#updateInfoContainerText();

        //create monster in party
        this.#monsters.forEach((monster, index) => {
            const isEven = index % 2 === 0
            const x = isEven ? MONSTER_PARTY_POSITIONS.EVEN.x : MONSTER_PARTY_POSITIONS.ODD.x;
            const y = (isEven ? MONSTER_PARTY_POSITIONS.EVEN.y : MONSTER_PARTY_POSITIONS.ODD.y) + MONSTER_PARTY_POSITIONS.increment * Math.floor(index / 2);
            this.#createMonster(x, y, monster)
        })
        this.#movePlayerInputCursor(DIRECTION.NONE)
    };

    update() {
        super.update();

        if (this._controls.isInputLocked) {
            return
        }

        if (this._controls.wasBackKeyPressed()) {
            if (this.#waitingForInput) {
                this.#updateInfoContainerText();
                this.#waitingForInput = false;
                return;
            }
            this.#goBackToPreviousScene(false);
            return;
        }

        const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
        if (wasSpaceKeyPressed) {
            if (this.#waitingForInput) {
                this.#updateInfoContainerText();
                this.#waitingForInput = false;
                return;
            }
            if (this.#selectedPartyMonsterIndex === -1) {
                this.#goBackToPreviousScene(false);
                return
            }

            if (this.#sceneData.previousSceneName === SCENE_KEYS.INVENTORY_SCENE && this.#sceneData.itemSelected) {
                this.#handleItemUsed();
                return;
            }

            const sceneDataToPass = {
                monster: this.#monsters[this.#selectedPartyMonsterIndex]
            }
            this._controls.lockInput = true;
            this.scene.launch(SCENE_KEYS.MONSTER_DETAILS_SCENE, sceneDataToPass)
            this.scene.pause(SCENE_KEYS.MONSTER_PARTY_SCENE)
            return;
        }

        if (this.#waitingForInput) {
            return;
        }


        const selectedDirection = this._controls.getDirectionKeyJustPressed();
        if (selectedDirection !== DIRECTION.NONE) {
            this.#movePlayerInputCursor(selectedDirection)
            this.#updateInfoContainerText()
        }
    }


    #updateInfoContainerText() {
        if (this.#selectedPartyMonsterIndex === -1) {
            this.#infoTextGameObject.setText(this.#i18n.t('MONSTER_PARTY.GO_BACK_PREVIOUS'))
            return;
        }
        this.#infoTextGameObject.setText(this.#i18n.t('MONSTER_PARTY.CHOOSE_MONSTER'))
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {import('../types/typedef.js').Monster} monsterDetails
     * @returns 
     */
    #createMonster(x, y, monsterDetails) {
        const container = this.add.container(x, y, [])
        const background = this.add.image(0, 10, BATTLE_ASSET_KEYS.MOSNTER_PARTY_BACKGROUND).setOrigin(0).setScale(0.55, 0.3)
        this.#monsterPartyBackgrounds.push(background)

        const leftShadowCap = this.add
            .image(340, 115, HEALTH_BAR_ASSET_KEYS.LEFT_CAP_SHADOW)
            .setOrigin(0).setAlpha(0.5).setScale(1, 1)

        const middleShadowCap = this.add
            .image(leftShadowCap.x + leftShadowCap.width, 140, HEALTH_BAR_ASSET_KEYS.MIDDLE_SHADOW)
            .setOrigin(0, 0.5).setAlpha(0.5)


        middleShadowCap.displayWidth = 360;

        const rightShadowCap = this.add
            .image(middleShadowCap.x + middleShadowCap.displayWidth, 115, HEALTH_BAR_ASSET_KEYS.RIGHT_CAP_SHADOW)
            .setOrigin(0).setAlpha(0.5)


        const healthBar = new HealthBar(this, 170, 70, 360)
        healthBar.setMeterPercentageAnimated(monsterDetails.currentHP / monsterDetails.maxHP, {
            duration: 0,
            skipBattleAnimations: true
        })
        this.#healthBars.push(healthBar)

        //Crea el nombre del enemigo
        const monsterNameGameText = this.add.text(
            460,
            70,
            monsterDetails.name,
            {
                fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
                color: 'white',
                fontSize: '40px'
            }
        )

        const monsterHealthBarLevelText = this.add.text(monsterNameGameText.width + 40, 200, `L${monsterDetails.level}`, {
            fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
            color: 'white',
            fontSize: '38px',
            fontStyle: 'italic',
        })

        const monsterHpText = this.add.text(280, 115, 'HP', {
            fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
            color: 'white',
            fontSize: '40px',
            fontStyle: 'italic',
        })

        const healthBarTextGameObject = this.add
            .text(460, 170, `${monsterDetails.currentHP}/${monsterDetails.maxHP}`, {
                fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
                color: 'white',
                fontSize: '40px',
                fontStyle: 'italic',
            })
        this.#healthBarTextGameObjects.push(healthBarTextGameObject);

        container.add([
            background
        ])

        const mosnterImage = this.add.image(230, 135, monsterDetails.assetKey).setOrigin(0.5, 0.5).setScale(monsterDetails.scale?.party || 0.6).setFlipX(!!monsterDetails.flipX)

        container.add([background, healthBar.container, mosnterImage, monsterNameGameText, monsterHealthBarLevelText, healthBarTextGameObject, monsterHpText, leftShadowCap, middleShadowCap, rightShadowCap])

        return container;
    }

    #goBackToPreviousScene(itemUsed) {
        //
        this._controls.lockInput = true;
        this.scene.stop(SCENE_KEYS.MONSTER_PARTY_SCENE)
        this.scene.resume(this.#sceneData.previousSceneName, { itemUsed })
    }

    /**
     * 
     * @param {import('../common/direction.js').Direction} direction 
     * @returns {void}
     */
    #movePlayerInputCursor(direction) {
        //
        switch (direction) {
            case DIRECTION.UP:
                if (this.#selectedPartyMonsterIndex === -1) {
                    this.#selectedPartyMonsterIndex = this.#monsters.length;
                }
                this.#selectedPartyMonsterIndex -= 1;
                if (this.#selectedPartyMonsterIndex < 0) {
                    this.#selectedPartyMonsterIndex = 0;
                }
                this.#monsterPartyBackgrounds[this.#selectedPartyMonsterIndex].setAlpha(1)
                this.#cancelButton.setTexture(UI_ASSET_KEYS.BLUE_BUTTON, 0).setAlpha(0.7)
                this
                break;
            case DIRECTION.DOWN:
                if (this.#selectedPartyMonsterIndex === -1) {
                    break;
                }
                this.#selectedPartyMonsterIndex += 1;
                if (this.#selectedPartyMonsterIndex > this.#monsters.length - 1) {
                    this.#selectedPartyMonsterIndex = -1;
                }
                if (this.#selectedPartyMonsterIndex === -1) {
                    this.#cancelButton.setTexture(UI_ASSET_KEYS.BLUE_BUTTON_SELECTED, 0).setAlpha(1)
                    break;
                }
                this.#monsterPartyBackgrounds[this.#selectedPartyMonsterIndex].setAlpha(1)
                break;
            case DIRECTION.LEFT:
            case DIRECTION.RIGHT:
            case DIRECTION.NONE:
                break;
            default:
                exhaustiveGuard(direction)

        }

        this.#monsterPartyBackgrounds.forEach((obj, index) => {
            if (index === this.#selectedPartyMonsterIndex) {
                return;
            }

            obj.setAlpha(0.7)
        });
    }

    #handleItemUsed() {
        switch (this.#sceneData.itemSelected.effect) {
            case ITEM_EFFECT.HEAL_20:
                this.#handleHealItemUsed(20);
                break;
            default:
                exhaustiveGuard(this.#sceneData.itemSelected.effect);
        }
    }
    /**
     * 
     * @param {number} amount 
     * @returns {void}
     */
    #handleHealItemUsed(amount) {

        // confirmar que el objetivo no esta muerto
        if (this.#monsters[this.#selectedPartyMonsterIndex].currentHP === 0) {
            this.#infoTextGameObject.setText(this.#i18n.t('MONSTER_PARTY.CANNOT_HEAL_FAINTED'));
            this.#waitingForInput = true;
            return;
        }
        // confirmar que el objetivo no esta a vida máxima
        if (this.#monsters[this.#selectedPartyMonsterIndex].currentHP === this.#monsters[this.#selectedPartyMonsterIndex].maxHP) {
            this.#infoTextGameObject.setText(this.#i18n.t('MONSTER_PARTY.ALREADY_FULL_HP'));
            this.#waitingForInput = true;
            return;
        }


        // sino curar al objetivo
        this._controls.lockInput = true;
        this.#monsters[this.#selectedPartyMonsterIndex].currentHP += amount;
        if (this.#monsters[this.#selectedPartyMonsterIndex].currentHP > this.#monsters[this.#selectedPartyMonsterIndex].maxHP) {
            this.#monsters[this.#selectedPartyMonsterIndex].currentHP = this.#monsters[this.#selectedPartyMonsterIndex].maxHP;
        }
        this.#infoTextGameObject.setText(this.#i18n.t('MONSTER_PARTY.HEALED_BY', { amount }));
        this.#healthBars[this.#selectedPartyMonsterIndex].setMeterPercentageAnimated(
            this.#monsters[this.#selectedPartyMonsterIndex].currentHP / this.#monsters[this.#selectedPartyMonsterIndex].maxHP,
            {
                callback: () => {
                    this.#healthBarTextGameObjects[this.#selectedPartyMonsterIndex].setText(
                        `${this.#monsters[this.#selectedPartyMonsterIndex].currentHP} / ${this.#monsters[this.#selectedPartyMonsterIndex].maxHP
                        }`
                    );
                    dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY, this.#monsters);
                    this.time.delayedCall(300, () => {
                        this.#goBackToPreviousScene(true);
                    });
                },
            }
        );
    }

    handleSceneCleanup() {
        super.handleSceneCleanup();
    }
}
