import { MONSTER_PARTY_ASSET_KEYS } from "../assets/asset-keys.js";
import { KENNEY_FUTURE_NARROW_FONT_NAME } from "../assets/font-keys.js";
import { Attack } from "../battle/attacks/attack.js";
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../utils/data-manager.js";
import { DataUtils } from "../utils/data-utils.js";
import { BaseScene } from "./base-scene.js";
import { SCENE_KEYS } from "./scene-keys.js";
import { i18n } from "../utils/i18n.js";

/**@type {Phaser.Types.GameObjects.Text.TextStyle} */
const UI_TEXT_STYLE = Object.freeze({
    fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
    color: '#FFFFFF',
    fontSize: '50px'
})
const MONSTER_MOVE_TEXT_STYLE = Object.freeze({
    fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
    color: '#000000',
    fontSize: '50px'
})

export class MonsterDetailsScene extends BaseScene {
    /**@type {import("../types/typedef.js").Monster} */
    #monsterDetails
    /**@type {import("../types/typedef.js").Attack[]} */
    #monsterAttacks
    /** @type {import('../utils/i18n.js').I18n} */
    #i18n;
    constructor() {
        super({
            key: SCENE_KEYS.MONSTER_DETAILS_SCENE
        })
        this._musicKey = 'OPTIONS';
    }

    init(data) {
        super.init(data)

        this.#monsterDetails = data.monster
        if (this.#monsterDetails === undefined) {
            this.#monsterDetails = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY)[0]
        }
        this.#monsterAttacks = [];
        this.#monsterDetails.attackIDs.forEach((attackId) => {
            const monsterAttack = DataUtils.getMonsterAttack(this, attackId)
            if (monsterAttack !== undefined) {
                this.#monsterAttacks.push(monsterAttack)
            }
        })
        this.#i18n = i18n(this);
    }

    create() {
        super.create()

        //create main background and tittle
        this.add.image(0, 0, MONSTER_PARTY_ASSET_KEYS.MONSTER_DETAILS_BACKGROUND).setOrigin(0).setScale(1.88, 1.88)
        this.add.text(20, 10, this.#i18n.t('MONSTER_DETAILS.TITLE'), {
            ...UI_TEXT_STYLE,
            fontSize: '72px',
        })

        //add monster details
        this.add.text(40, 115, `Lv. ${this.#monsterDetails.level}`, {
            ...UI_TEXT_STYLE,
            fontSize: '64px'
        })
        this.add.text(350, 115, this.#monsterDetails.name, {
            ...UI_TEXT_STYLE,
            fontSize: '64px'
        })

        this.add.image(450, 400, this.#monsterDetails.assetKey).setOrigin(0.5, 0.5).setScale(this.#monsterDetails.scale?.details || 1.5).setFlipX(!!this.#monsterDetails.flipX)

        if (this.#monsterAttacks[0] !== undefined) {
            const attackName = this.#i18n.t(`ATTACKS.${this.#monsterAttacks[0].id}`, { defaultValue: this.#monsterAttacks[0].name });
            this.add.text(1050, 155, attackName, {
                ...MONSTER_MOVE_TEXT_STYLE,
                fontSize: '72px',
            })
        }

        if (this.#monsterAttacks[1] !== undefined) {
            const attackName = this.#i18n.t(`ATTACKS.${this.#monsterAttacks[1].id}`, { defaultValue: this.#monsterAttacks[1].name });
            this.add.text(1050, 305, attackName, {
                ...MONSTER_MOVE_TEXT_STYLE,
                fontSize: '72px',
            })
        }

        if (this.#monsterAttacks[2] !== undefined) {
            const attackName = this.#i18n.t(`ATTACKS.${this.#monsterAttacks[2].id}`, { defaultValue: this.#monsterAttacks[2].name });
            this.add.text(1050, 455, attackName, {
                ...MONSTER_MOVE_TEXT_STYLE,
                fontSize: '72px',
            })
        }

        if (this.#monsterAttacks[3] !== undefined) {
            const attackName = this.#i18n.t(`ATTACKS.${this.#monsterAttacks[3].id}`, { defaultValue: this.#monsterAttacks[3].name });
            this.add.text(1050, 605, attackName, {
                ...MONSTER_MOVE_TEXT_STYLE,
                fontSize: '72px',
            })
        }
    }

    update() {
        super.update()

        if (this._controls.isInputLocked) {
            return
        }

        if (this._controls.wasBackKeyPressed()) {
            this.#goBackToPreviousScene()
            return;
        }

        if (this._controls.wasSpaceKeyPressed()) {
            this.#goBackToPreviousScene()
            return;
        }
    }

    #goBackToPreviousScene() {
        //
        this._controls.lockInput = true;
        this.scene.stop(SCENE_KEYS.MONSTER_DETAILS_SCENE)
        this.scene.resume(SCENE_KEYS.MONSTER_PARTY_SCENE)
    }
}