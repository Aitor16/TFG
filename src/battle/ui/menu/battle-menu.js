import { CHARACTER_ASSET_KEYS, UI_ASSET_KEYS } from "../../../assets/asset-keys.js";
import Phaser from "../../../lib/phaser.js";
import { SCENE_KEYS } from "../../../scenes/scene-keys.js";
import { DIRECTION } from "../../../common/direction.js";
import { exhaustiveGuard } from "../../../utils/guard.js";
import { ACTIVE_BATTLE_MENU, ATTACK_MOVE_OPTIONS, BATTLE_MENU_OPTIONS } from "./battle-menu-options.js";
import { BATTLE_UI_TEXT_STYLE } from "./battle-menu-config.js";
import { BattleMonster } from "../../monsters/battle-monster.js";
import { animateText } from "../../../utils/text-utils.js";
import { dataManager } from "../../../utils/data-manager.js";
import { i18n } from "../../../utils/i18n.js";

const BATTLE_MENU_CURSOR_POS = Object.freeze({
    x: 42,
    y: 38
})

const ATTACK_MENU_CURSOR_POS = Object.freeze({
    x: 20,
    y: 25,
})

const PLAYER_INPUT_CURSOR_POS = Object.freeze({
    x: 20,
    y: 920,
})

//CLASE
export class BattleMenu {
    //VARIABLES
    /** @type {Phaser.Scene}*/
    #scene;
    /** @type {Phaser.GameObjects.Container}*/
    #mainBattleMenuPhaserContainerObject;
    /** @type {Phaser.GameObjects.Container}*/
    #moveSelectionSubBattleMenuPhaserContainerObject;
    /** @type {Phaser.GameObjects.Text}*/
    #battleTextGameObjectLine1;
    /** @type {Phaser.GameObjects.Text}*/
    #battleTextGameObjectLine2;
    /** @type {Phaser.GameObjects.Image}*/
    #mainBattleMenuCursorPhaserImageObject;
    /** @type {Phaser.GameObjects.Image}*/
    #attackBattleMenuCursorPhaserImageObject;
    /** @type {import("./battle-menu-options.js").BattleMenuOptions}*/
    #selectedBattleMenuOption;
    /** @type {import("./battle-menu-options.js").AttackMoveOptions}*/
    #selectedAttackMenuOption;
    /**@type {import('./battle-menu-options.js').ActiveBattleMenu} */
    #activeBattleMenu;
    /**@type {string[]} */
    #queuedInfoPanelMessages;
    /**@type {() => void | undefined} */
    #queuedInfoPanelCallback;
    /**@type {boolean} */
    #waitingForPlayerInput
    /**@type {number | undefined} */
    #selectedAttackIndex;
    /**@type {BattleMonster} */
    #activePlayerMonster
    /**@type {Phaser.GameObjects.Image} */
    #userInputCursorPhaserImageGameObject;
    /**@type {Phaser.Tweens.Tween} */
    #userInputCursorPhaserTween;
    /**@type {boolean} */
    #skipAnimations;
    /**@type {boolean} */
    #queuedMessagesSkipAnimationPlaying
    /**@type {boolean} */
    #usedItem
    /**@type {import("../../../utils/i18n.js").I18n} */
    #i18n;

    /**
     * CONSTRUCTOR
     * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
     */
    constructor(scene, activePlayerMonster, skipBattleAnimations = false) {
        this.#scene = scene;
        this.#activePlayerMonster = activePlayerMonster
        this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
        this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
        this.#queuedInfoPanelCallback = undefined;
        this.#queuedInfoPanelMessages = [];
        this.#waitingForPlayerInput = false;
        this.#selectedAttackIndex = undefined;
        this.#skipAnimations = skipBattleAnimations;
        this.#queuedMessagesSkipAnimationPlaying = false;
        this.#usedItem = false;
        this.#i18n = i18n(this.#scene);
        this.#createMainInfoPane()
        this.#createMainBattleMenu()
        this.#createPlayerAttackSubMenu()
        this.#createPlayerInputCursor()

        this.#scene.events.on(Phaser.Scenes.Events.RESUME, this.#handleSceneResume, this)
        this.#scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.#scene.events.off(Phaser.Scenes.Events.RESUME, this.#handleSceneResume, this)
        }, this)

    }

    //OBTENER EL ATAQUE SELECCIONADO
    /**@types {number  | undefined} */
    get selectedAttack() {
        if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
            return this.#selectedAttackIndex;
        }
        return undefined;
    }

    get wasItemUsed() {
        return this.#usedItem;
    }

    //MOSTRAR EL MENU PRINCIPAL
    showMainBattleMenu() {
        console.log('MOSTRAMOS EL MENU PRINCIPAL')
        this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN
        this.#battleTextGameObjectLine1.setText(this.#i18n.t('BATTLE_MENU.WHAT_SHOULD_DO'))
        this.#battleTextGameObjectLine2.setText(`${this.#activePlayerMonster.name} ${this.#i18n.t('BATTLE_MENU.DO_NEXT')}`)
        this.#mainBattleMenuPhaserContainerObject.setAlpha(1);
        this.#battleTextGameObjectLine1.setAlpha(1)
        this.#battleTextGameObjectLine2.setAlpha(1)

        this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
        this.#mainBattleMenuCursorPhaserImageObject.setPosition(BATTLE_MENU_CURSOR_POS.x, BATTLE_MENU_CURSOR_POS.y)
        this.#selectedAttackIndex = undefined;
        this.#usedItem = false;
    }

    //ESCONDER EL MENU PRINCIPAL
    hideMainBattleMenu() {
        this.#mainBattleMenuPhaserContainerObject.setAlpha(0);
        this.#battleTextGameObjectLine1.setAlpha(0)
        this.#battleTextGameObjectLine2.setAlpha(0)
    }

    //MOSTRAR EL MENU DE ATAQUES
    showCharacterAttackSubmenu() {
        console.log('MOSTRAMOS EL MENU DE ATAQUES')
        this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT;
        this.#moveSelectionSubBattleMenuPhaserContainerObject.setAlpha(1);
    }

    //OCULTAR EL MENU DE ATAQUES
    hideCharacterAttackSubmenu() {
        this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
        this.#moveSelectionSubBattleMenuPhaserContainerObject.setAlpha(0);
    }

    //ACTIVA LA ANIMACION DEL CURSOR ANIMADO
    playInputCursorAnimation() {
        this.#userInputCursorPhaserImageGameObject.setAlpha(1)
        this.#userInputCursorPhaserTween.restart()
    }

    //OCULTA EL CURSOR ANIMADO
    hideInputCursor() {
        this.#userInputCursorPhaserImageGameObject.setAlpha(0)
        this.#userInputCursorPhaserTween.pause()
    }

    /**
     * MANEJAR LA ENTRADA DEL USUARIO EN EL MENU
     * @param { import('../../../common/direction.js').Direction | 'OK' | 'CANCEL'} input 
     */
    handlePlayerInput(input) {
        if (this.#queuedMessagesSkipAnimationPlaying && input === 'OK') {
            return;
        }
        if (this.#waitingForPlayerInput && (input === 'CANCEL' || input === 'OK')) {
            this.#updateInfoPaneWithMessage();
            return;
        }

        console.log(input);
        if (input === 'CANCEL') {
            this.#switchToMainBattleMenu();
            return;
        }
        if (input === 'OK') {
            if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
                this.#handlePlayerChooseMainBattleOption();
                return;
            }
            if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
                this.#handlePlayerChooseAttack();
                return
            }
            this.hideMainBattleMenu();
            this.showCharacterAttackSubmenu();
            return;
        }

        this.#updateSelectedBattleMenuOptionFromInput(input);
        this.#moveMainBattleMenuCursor();
        this.#updateSelectedMoveMenuOptionFromInput(input);
        this.#moveMoveSelectBattleMenuCursor();
    }

    /**
      * ACTUALIZAR CON LOS MENSAJES ESPERANDO BOTON
      * @param {string} message 
      * @param {() => void} [callback] 
      */
    updateInfoPaneMessageNoInputRequired(message, callback) {
        console.log('VACIAMOS TEXTO')
        this.#battleTextGameObjectLine1.setText('').setAlpha(1);

        console.log('CAMBIAMOS TEXTO')
        if (this.#skipAnimations) {
            console.log('SKIP ANIMATION ACTIVADO')
            this.#battleTextGameObjectLine1.setText(message);
            this.#waitingForPlayerInput = false;
            if (callback) {
                callback()
            }
            return
        }

        animateText(this.#scene, this.#battleTextGameObjectLine1, message, {
            delay: dataManager.getAnimatedTextSpeed(),
            callback: () => {
                this.#waitingForPlayerInput = false;
                if (callback) {
                    callback();
                }
            }
        })
    }


    /**
     * ACTUALIZAR CON LOS MENSAJES ESPERANDO BOTON
     * @param {string []} messages 
     * @param {() => void} [callback] 
     */
    updateInfoPaneMessagesWaitForInput(messages, callback) {
        this.#queuedInfoPanelMessages = messages;
        this.#queuedInfoPanelCallback = callback;

        this.#updateInfoPaneWithMessage();
    }

    //ACTUALIZAR EL PANEL CON MENSAJES
    #updateInfoPaneWithMessage() {
        this.#waitingForPlayerInput = false;
        this.#battleTextGameObjectLine1.setText('').setAlpha(1)
        this.#battleTextGameObjectLine2.setText('').setAlpha(1)
        this.hideInputCursor()

        if (this.#queuedInfoPanelMessages.length === 0) {
            if (this.#queuedInfoPanelCallback) {
                this.#queuedInfoPanelCallback();
                this.#queuedInfoPanelCallback = undefined;
            }
            return;
        }

        // get first message from queue and animate message
        const messageToDisplay = this.#queuedInfoPanelMessages.shift();

        if (this.#skipAnimations) {
            this.#battleTextGameObjectLine1.setText(messageToDisplay)
            this.#queuedMessagesSkipAnimationPlaying = false;
            this.#waitingForPlayerInput = true;
            this.playInputCursorAnimation()
            return
        }

        this.#queuedMessagesSkipAnimationPlaying = true;
        animateText(this.#scene, this.#battleTextGameObjectLine1, messageToDisplay, {
            delay: 50,
            callback: () => {
                this.playInputCursorAnimation()
                this.#waitingForPlayerInput = true
                this.#queuedMessagesSkipAnimationPlaying = false;
            },
        })
    }

    //CREAR MENU PRINCIPAL
    #createMainBattleMenu() {
        this.#battleTextGameObjectLine1 = this.#scene.add.text(70, 910, '', BATTLE_UI_TEXT_STYLE);
        this.#battleTextGameObjectLine2 = this.#scene.add.text(70, 980, '', BATTLE_UI_TEXT_STYLE)
        this.#mainBattleMenuCursorPhaserImageObject = this.#scene.add.image(42, 38, UI_ASSET_KEYS.CURSOR, 0).setOrigin(0.5).setScale(0.3)
        this.#mainBattleMenuPhaserContainerObject = this.#scene.add.container(1200, 875, [
            this.#createMainInfoSubPane(),
            this.#scene.add.text(55, 22, this.#i18n.t(`BATTLE_MENU.${BATTLE_MENU_OPTIONS.FIGHT}`), BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(400, 22, this.#i18n.t(`BATTLE_MENU.${BATTLE_MENU_OPTIONS.SWITCH}`), BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(400, 100, this.#i18n.t(`BATTLE_MENU.${BATTLE_MENU_OPTIONS.FLEE}`), BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(55, 100, this.#i18n.t(`BATTLE_MENU.${BATTLE_MENU_OPTIONS.ITEM}`), BATTLE_UI_TEXT_STYLE),
            this.#mainBattleMenuCursorPhaserImageObject,
        ])


        this.hideMainBattleMenu();
    }

    //CREAR EL MENU DE ATAQUES
    #createPlayerAttackSubMenu() {
        this.#attackBattleMenuCursorPhaserImageObject = this.#scene.add.image(20, 25, UI_ASSET_KEYS.CURSOR, 0).setOrigin(0).setScale(0.3);

        /**@type {string[]} */
        const attackNames = [];
        for (let i = 0; i < 4; i += 1) {
            attackNames.push(this.#activePlayerMonster.attacks[i]?.name || '-')
        }


        this.#moveSelectionSubBattleMenuPhaserContainerObject = this.#scene.add.container(0, 875, [
            this.#scene.add.text(55, 22, this.#i18n.t(`ATTACKS.${this.#activePlayerMonster.attacks[0]?.id || 0}`), BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(800, 22, this.#i18n.t(`ATTACKS.${this.#activePlayerMonster.attacks[1]?.id || 0}`), BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(800, 100, this.#i18n.t(`ATTACKS.${this.#activePlayerMonster.attacks[2]?.id || 0}`), BATTLE_UI_TEXT_STYLE),
            this.#scene.add.text(55, 100, this.#i18n.t(`ATTACKS.${this.#activePlayerMonster.attacks[3]?.id || 0}`), BATTLE_UI_TEXT_STYLE),
            this.#attackBattleMenuCursorPhaserImageObject,
        ])
        this.hideCharacterAttackSubmenu();
    }

    //MOSTRAR MENU PRINCIPAL
    #createMainInfoPane() {
        const padding = 4;
        const rectHeight = 200;
        this.#scene.add.rectangle(
            0,
            this.#scene.scale.height - rectHeight - padding,
            this.#scene.scale.width - padding * 2,
            rectHeight,
            0xede4f3,
            1
        )
            .setOrigin(0)
            .setStrokeStyle(8, 0xe4434a, 1);
    }

    //CREAR UN CONTENEDOR PARA SUBPANEL
    #createMainInfoSubPane() {
        const rectWitdth = 800;
        const rectHeight = 200;
        return this.#scene.add.rectangle(0, 0, rectWitdth, rectHeight, 0xede4f3, 1)
            .setOrigin(0)
            .setStrokeStyle(8, 0x905ac2, 1);
    }

    /**
     * ACTUALIZAR CUANDO SE MUEVE EL CURSOR POR ATAQUES
     * @param { import('../../../common/direction.js').Direction} direction 
     */
    #updateSelectedBattleMenuOptionFromInput(direction) {
        if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
            return;
        }

        if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
            switch (direction) {
                case DIRECTION.RIGHT:
                    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
                    return;
                case DIRECTION.DOWN:
                    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM
                    return;
                case DIRECTION.LEFT:
                    return;
                case DIRECTION.UP:
                    return;
                case DIRECTION.NONE:
                    return;
                default:
                    exhaustiveGuard(direction);
            }
            return;
        }
        if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH) {
            switch (direction) {
                case DIRECTION.RIGHT:
                    return;
                case DIRECTION.DOWN:
                    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE
                    return;
                case DIRECTION.LEFT:
                    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
                    return;
                case DIRECTION.UP:
                    return;
                case DIRECTION.NONE:
                    return;
                default:
                    exhaustiveGuard(direction);
            }
            return;
        }
        if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE) {
            switch (direction) {
                case DIRECTION.RIGHT:
                    return;
                case DIRECTION.DOWN:
                    return;
                case DIRECTION.LEFT:
                    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM
                    return;
                case DIRECTION.UP:
                    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH
                    return;
                case DIRECTION.NONE:
                    return;
                default:
                    exhaustiveGuard(direction);
            }
            return;
        }
        if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
            switch (direction) {
                case DIRECTION.RIGHT:
                    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE
                    return;
                case DIRECTION.DOWN:
                    return;
                case DIRECTION.LEFT:
                    return;
                case DIRECTION.UP:
                    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
                    return;
                case DIRECTION.NONE:
                    return;
                default:
                    exhaustiveGuard(direction);
            }
            return;
        }

        exhaustiveGuard(this.#selectedBattleMenuOption);
    }

    //MOVER EL CURSOR POR EL MENU PRINCIPAL
    #moveMainBattleMenuCursor() {
        if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
            return;
        }
        switch (this.#selectedBattleMenuOption) {
            case BATTLE_MENU_OPTIONS.FIGHT:
                this.#mainBattleMenuCursorPhaserImageObject.setPosition(BATTLE_MENU_CURSOR_POS.x, BATTLE_MENU_CURSOR_POS.y)
                return;
            case BATTLE_MENU_OPTIONS.FLEE:
                this.#mainBattleMenuCursorPhaserImageObject.setPosition(380, 120)
                return;
            case BATTLE_MENU_OPTIONS.ITEM:
                this.#mainBattleMenuCursorPhaserImageObject.setPosition(BATTLE_MENU_CURSOR_POS.x, 120)
                return;
            case BATTLE_MENU_OPTIONS.SWITCH:
                this.#mainBattleMenuCursorPhaserImageObject.setPosition(380, BATTLE_MENU_CURSOR_POS.y)
                return;
            default:
                exhaustiveGuard(this.#selectedBattleMenuOption);
        }
    }

    /**
     * ACTUALIZAR CUANDO SE MUEVE EL CURSOR POR MENU PRINCIPAL
     * @param {import('../../../common/direction.js').Direction} direction 
     */
    #updateSelectedMoveMenuOptionFromInput(direction) {
        if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
            return;
        }

        if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_1) {
            switch (direction) {
                case DIRECTION.RIGHT:
                    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2
                    return;
                case DIRECTION.DOWN:
                    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3
                    return;
                case DIRECTION.LEFT:
                    return;
                case DIRECTION.UP:
                    return;
                case DIRECTION.NONE:
                    return;
                default:
                    exhaustiveGuard(direction);
            }
            return;
        }

        if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_2) {
            switch (direction) {
                case DIRECTION.RIGHT:
                    return;
                case DIRECTION.DOWN:
                    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4
                    return;
                case DIRECTION.LEFT:
                    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1
                    return;
                case DIRECTION.UP:
                    return;
                case DIRECTION.NONE:
                    return;
                default:
                    exhaustiveGuard(direction);
            }
            return;
        }

        if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_3) {
            switch (direction) {
                case DIRECTION.RIGHT:
                    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4
                    return;
                case DIRECTION.DOWN:
                    return;
                case DIRECTION.LEFT:
                    return;
                case DIRECTION.UP:
                    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1
                    return;
                case DIRECTION.NONE:
                    return;
                default:
                    exhaustiveGuard(direction);
            }
            return;
        }

        if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_4) {
            switch (direction) {
                case DIRECTION.RIGHT:
                    return;
                case DIRECTION.DOWN:
                    return;
                case DIRECTION.LEFT:
                    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3
                    return;
                case DIRECTION.UP:
                    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2
                    return;
                case DIRECTION.NONE:
                    return;
                default:
                    exhaustiveGuard(direction);
            }
            return;
        }
        exhaustiveGuard(this.#selectedAttackMenuOption);
    }


    //MOVER EL CURSOR POR EL MENU DE ATAQUES
    #moveMoveSelectBattleMenuCursor() {
        if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
            return;
        }
        switch (this.#selectedAttackMenuOption) {
            case ATTACK_MOVE_OPTIONS.MOVE_1:
                this.#attackBattleMenuCursorPhaserImageObject.setPosition(ATTACK_MENU_CURSOR_POS.x, ATTACK_MENU_CURSOR_POS.y)
                return;
            case ATTACK_MOVE_OPTIONS.MOVE_2:
                this.#attackBattleMenuCursorPhaserImageObject.setPosition(770, ATTACK_MENU_CURSOR_POS.y)
                return;
            case ATTACK_MOVE_OPTIONS.MOVE_3:
                this.#attackBattleMenuCursorPhaserImageObject.setPosition(ATTACK_MENU_CURSOR_POS.x, 105)
                return;
            case ATTACK_MOVE_OPTIONS.MOVE_4:
                this.#attackBattleMenuCursorPhaserImageObject.setPosition(770, 105)
                return;
            default:
                exhaustiveGuard(this.#selectedAttackMenuOption)
        }
    }

    //CAMBIAR DE MENU PRINCIPAL A MENU DE BATALLA
    #switchToMainBattleMenu() {
        this.#waitingForPlayerInput = false;
        this.hideInputCursor()
        this.hideCharacterAttackSubmenu();
        this.showMainBattleMenu();
    }

    //SELECCIONAR OPCION DEL MENU
    #handlePlayerChooseMainBattleOption() {
        this.hideMainBattleMenu();

        if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
            this.showCharacterAttackSubmenu();
            return;
        }

        if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
            this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_ITEM;
            const sceneDataToPass = {
                previousSceneName: SCENE_KEYS.BATTLE_SCENE,
            }
            this.#scene.scene.launch(SCENE_KEYS.INVENTORY_SCENE, sceneDataToPass);
            this.#scene.scene.pause(SCENE_KEYS.BATTLE_SCENE);
            return;
        }

        if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH) {
            //TODO
            this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_SWITCH;
            this.updateInfoPaneMessagesWaitForInput([this.#i18n.t('BATTLE_MENU.NO_ALLIES')], () => {
                this.#switchToMainBattleMenu();
            },);
            return;
        }

        if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE) {
            //TODO
            this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_FLEE;
            this.updateInfoPaneMessagesWaitForInput([this.#i18n.t('BATTLE_MENU.FAIL_FLEE')], () => {
                this.#switchToMainBattleMenu();
            },);
            return;
        }

        exhaustiveGuard(this.#selectedBattleMenuOption)
    }

    //SELECCIONAR ATAQUES
    #handlePlayerChooseAttack() {
        let selectedMoveIndex = 0;
        switch (this.#selectedAttackMenuOption) {
            case ATTACK_MOVE_OPTIONS.MOVE_1:
                selectedMoveIndex = 0;
                break;
            case ATTACK_MOVE_OPTIONS.MOVE_2:
                selectedMoveIndex = 1;
                break;
            case ATTACK_MOVE_OPTIONS.MOVE_3:
                selectedMoveIndex = 2;
                break;
            case ATTACK_MOVE_OPTIONS.MOVE_4:
                selectedMoveIndex = 3;
                break;
            default:
                exhaustiveGuard(this.#selectedAttackMenuOption)
        }

        this.#selectedAttackIndex = selectedMoveIndex;
    }

    //CREA CURSOR ANIMADO DE TEXTO
    #createPlayerInputCursor() {
        this.#userInputCursorPhaserImageGameObject = this.#scene.add.image(this.#battleTextGameObjectLine1.displayWidth + 750, 0, UI_ASSET_KEYS.CURSOR)
        this.#userInputCursorPhaserImageGameObject.setScale(0.3, 0.3).setAngle(-120)
        this.#userInputCursorPhaserImageGameObject.setAlpha(0)

        this.#userInputCursorPhaserTween = this.#scene.add.tween({
            delay: 0,
            duration: 500,
            repeat: -1,
            y: {
                from: PLAYER_INPUT_CURSOR_POS.y,
                start: PLAYER_INPUT_CURSOR_POS.y,
                to: PLAYER_INPUT_CURSOR_POS.y + 6,
            },
            targets: this.#userInputCursorPhaserImageGameObject
        })
        this.#userInputCursorPhaserImageGameObject.setAlpha(0)
        this.#userInputCursorPhaserTween.pause()
    }

    #handleSceneResume(sys, data) {
        console.log(`[${BattleMenu.name}] scene has been resumed, data provided: ${JSON.stringify(data)}`)

        if (!data || !data.itemUsed) {
            this.#switchToMainBattleMenu()
            return;
        }
        this.#usedItem = true;
        this.updateInfoPaneMessagesWaitForInput([this.#i18n.t('BATTLE_MENU.USED_ITEM', { itemName: this.#i18n.t(`ITEMS.${data.item.id}.NAME`) })]);
    }
}