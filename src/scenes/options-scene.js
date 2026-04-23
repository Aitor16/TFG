import { UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { DIRECTION } from '../common/direction.js';
import { BATTLE_SCENE_OPTIONS, BATTLE_STYLE_OPTIONS, LANGUAGE_OPTIONS, OPTION_MENU_OPTIONS, SOUND_OPTIONS, TEXT_SPEED_OPTIONS } from '../common/options.js';
import Phaser from '../lib/phaser.js'
import { Controls } from '../utils/controls.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { i18n } from '../utils/i18n.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { NineSlice } from '../utils/nine-slice.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from "./scene-keys.js";

/**@type {Phaser.Types.GameObjects.Text.TextStyle} */
const OPTIONS_TEXT_STYLE = Object.freeze({
    fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
    color: '#b87c4a',
    fontSize: '28px',
    fontStyle: 'bold',
    shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 3,
        fill: true
    }
})

/**@type {Phaser.Types.GameObjects.Text.TextStyle} */
const OPTIONS_TITLE_STYLE = Object.freeze({
    fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
    color: '#cd7a32',
    fontSize: '48px',
    fontStyle: 'bold',
    shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 5,
        fill: true
    }
})



const TEXT_FONT_COLOR = Object.freeze({
    NOT_SELECTED: '#8B5A2B',
    SELECTED: '#ffaa66',
    HOVER: '#e89a4a'
})

export class OptionsScene extends BaseScene {
    constructor() {
        super({
            key: SCENE_KEYS.OPTION_SCENE,
        })
        this._musicKey = 'OPTIONS';
    }

    /**@type {Phaser.GameObjects.Container} */
    #mainContainer;

    /**@type {NineSlice}*/
    #nineSliceMainContainer;

    /**@type {Phaser.GameObjects.Group} */
    #textSpeedOptionTextGameObjects;

    /**@type {Phaser.GameObjects.Group} */
    #battleSceneOptionTextGameObjects;

    /**@type {Phaser.GameObjects.Group} */
    #battleStyleOptionTextGameObjects;

    /**@type {Phaser.GameObjects.Group} */
    #soundOptionTextGameObjects;

    /**@type {Phaser.GameObjects.Rectangle} */
    #volumeOptionsMenuCursor;

    /**@type {Phaser.GameObjects.Text} */
    #volumeOptionsValueText

    /**@type {Phaser.GameObjects.Text} */
    #selectedMenuColorTextGameObject

    /**@type {Phaser.GameObjects.Container} */
    #infoContainer

    /**@type {Phaser.GameObjects.Text} */
    #selectedOptionInfoMsgTextGameObject

    /**@type {Phaser.GameObjects.Rectangle} */
    #optionsMenuCursor;

    /**@type {import('../utils/i18n.js').I18n} */
    #i18n;

    /**@type {Phaser.GameObjects.Group} */
    #languageOptionTextGameObjects;

    /**@type {import('../common/options.js').OptionsMenuOptions} */
    #selectedOptionMenu;

    /**@type {import('../common/options.js').TextSpeedMenuOptions} */
    #selectedTextSpeedOption;

    /**@type {import('../common/options.js').BattleSceneMenuOptions} */
    #selectedBattleSceneOption;

    /**@type {import('../common/options.js').BattleStyleOptions} */
    #selectedBattleStyleOption;

    /**@type {import('../common/options.js').SoundMenuOptions} */
    #selectedSoundMenuOption;

    /**@type {import('../common/options.js').VolumeMenuOptions} */
    #selectedVolumeOption;

    /**@type {import('../common/options.js').MenuColorOptions} */
    #selectedMenuColorOption;

    /**@type {import('../common/options.js').LanguageMenuOptions} */
    #selectedLanguageOption;

    /**@type {Phaser.GameObjects.Graphics} */
    #rustOverlay;

    /**@type {Phaser.GameObjects.Container} */
    #dustContainer;

    /**@type {Phaser.Time.TimerEvent} */
    #dustTimer;

    /** @type {string} */
    #previousSceneName;

    init(data) {
        super.init(data)
        console.log(`[${OptionsScene.name}:init] invoked`, data);
        this.#previousSceneName = (data && data.previousSceneName) || SCENE_KEYS.TITLE_SCENE;

        this.#nineSliceMainContainer = new NineSlice({
            cornerCutSize: 32,
            textureManager: this.sys.textures,
            assetKeys: [UI_ASSET_KEYS.MENU_BACKGROUND, UI_ASSET_KEYS.MENU_BACKGROUND_GREEN, UI_ASSET_KEYS.MENU_BACKGROUND_PURPLE]
        })

        this.#selectedOptionMenu = OPTION_MENU_OPTIONS.TEXT_SPEED;
        this.#selectedTextSpeedOption = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED);
        this.#selectedBattleSceneOption = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS)
        this.#selectedBattleStyleOption = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE)
        this.#selectedSoundMenuOption = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND)
        this.#selectedVolumeOption = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME)
        this.#selectedMenuColorOption = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR)
        this.#selectedLanguageOption = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_LANGUAGE)
        this.#i18n = i18n(this);
    }

    create() {
        super.create()
        console.log(`[${OptionsScene.name}:create] invoked`)

        // Fondo apocalíptico
        this.#createApocalypticBackground();

        // Polvo y ceniza
        this.#createDustAndAsh();

        // Grietas decorativas
        this.#createRustyCracks();

        const { width, height } = this.scale;
        const optionMenuWidth = width - 200;

        //main options container
        this.#mainContainer = this.#nineSliceMainContainer.createNineSliceContainer(this, optionMenuWidth, 500, UI_ASSET_KEYS.MENU_BACKGROUND)
        this.#mainContainer.setX(100).setY(20);

        // Añadir remaches al contenedor principal
        this.#addRivetsToContainer(this.#mainContainer, optionMenuWidth, 500);

        //create main option sections
        const titleText = this.add.text(width / 2, 40, this.#i18n.t('OPTIONS_MENU.TITLE'), OPTIONS_TITLE_STYLE).setOrigin(0.5);
        this.tweens.add({
            targets: titleText,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        const menuOptionsPosition = {
            x: 35,
            yStart: 65,
            yIncrement: 52
        }

        const menuOptions = [
            this.#i18n.t('OPTIONS_MENU.TEXT_SPEED'),
            this.#i18n.t('OPTIONS_MENU.BATTLE_SCENE'),
            this.#i18n.t('OPTIONS_MENU.BATTLE_STYLE'),
            this.#i18n.t('OPTIONS_MENU.SOUND'),
            this.#i18n.t('OPTIONS_MENU.VOLUME'),
            this.#i18n.t('OPTIONS_MENU.RUST_PATTERN'),
            this.#i18n.t('OPTIONS_MENU.LANGUAGE'),
            this.#i18n.t('OPTIONS_MENU.SURVIVE')
        ];
        menuOptions.forEach((option, index) => {
            const x = menuOptionsPosition.x;
            const y = menuOptionsPosition.yStart + menuOptionsPosition.yIncrement * index;
            const textGameObject = this.add.text(x, y, option, OPTIONS_TEXT_STYLE);

            // Efecto hover
            textGameObject.setInteractive({ useHandCursor: true });
            textGameObject.on('pointerover', () => {
                textGameObject.setColor(TEXT_FONT_COLOR.HOVER);
                textGameObject.setScale(1.02);
            });
            textGameObject.on('pointerout', () => {
                textGameObject.setColor(TEXT_FONT_COLOR.NOT_SELECTED);
                textGameObject.setScale(1);
            });

            this.#mainContainer.add(textGameObject)
        });

        //create text speed options
        this.#textSpeedOptionTextGameObjects = this.add.group([
            this.#createRustedOptionText(420, 65, this.#i18n.t('OPTIONS_MENU.TEXT_SPEED_OPTIONS.SLOW')),
            this.#createRustedOptionText(590, 65, this.#i18n.t('OPTIONS_MENU.TEXT_SPEED_OPTIONS.MID')),
            this.#createRustedOptionText(760, 65, this.#i18n.t('OPTIONS_MENU.TEXT_SPEED_OPTIONS.FAST')),
        ])
        this.#mainContainer.add(this.#textSpeedOptionTextGameObjects.getChildren());

        //create battle scene options
        this.#battleSceneOptionTextGameObjects = this.add.group([
            this.#createRustedOptionText(420, 117, this.#i18n.t('OPTIONS_MENU.BATTLE_SCENE_OPTIONS.ON')),
            this.#createRustedOptionText(590, 117, this.#i18n.t('OPTIONS_MENU.BATTLE_SCENE_OPTIONS.OFF'))
        ])
        this.#mainContainer.add(this.#battleSceneOptionTextGameObjects.getChildren());

        //create battle style options
        this.#battleStyleOptionTextGameObjects = this.add.group([
            this.#createRustedOptionText(420, 169, this.#i18n.t('OPTIONS_MENU.BATTLE_STYLE_OPTIONS.SET')),
            this.#createRustedOptionText(590, 169, this.#i18n.t('OPTIONS_MENU.BATTLE_STYLE_OPTIONS.SHIFT'))
        ])
        this.#mainContainer.add(this.#battleStyleOptionTextGameObjects.getChildren());

        //create sounds options
        this.#soundOptionTextGameObjects = this.add.group([
            this.#createRustedOptionText(420, 221, this.#i18n.t('OPTIONS_MENU.SOUND_OPTIONS.ON')),
            this.#createRustedOptionText(590, 221, this.#i18n.t('OPTIONS_MENU.SOUND_OPTIONS.OFF'))
        ])
        this.#mainContainer.add(this.#soundOptionTextGameObjects.getChildren());

        //volume options con estilo oxidado
        const volumeTrack = this.add.rectangle(420, 293, 300, 6, 0x4a2a1a, 1).setOrigin(0, 0.5);
        volumeTrack.setStrokeStyle(2, 0xcd7a32, 0.5);
        this.#mainContainer.add(volumeTrack);

        this.#volumeOptionsMenuCursor = this.add.rectangle(710, 293, 12, 30, 0xffaa66, 1).setOrigin(0, 0.5);
        this.#volumeOptionsMenuCursor.setStrokeStyle(2, 0xcd7a32, 0.8);
        this.#mainContainer.add(this.#volumeOptionsMenuCursor);

        this.#volumeOptionsValueText = this.#createRustedOptionText(760, 273, '100%');
        this.#mainContainer.add(this.#volumeOptionsValueText);

        //frame options con estilo oxidado
        this.#selectedMenuColorTextGameObject = this.#createRustedOptionText(595, 325, '');
        this.#selectedMenuColorTextGameObject.setOrigin(0.5, 0).setFontSize('32px');
        this.#mainContainer.add(this.#selectedMenuColorTextGameObject);

        //create language options
        this.#languageOptionTextGameObjects = this.add.group([
            this.#createRustedOptionText(420, 377, this.#i18n.t('OPTIONS_MENU.LANGUAGE_OPTIONS.ENGLISH')),
            this.#createRustedOptionText(620, 377, this.#i18n.t('OPTIONS_MENU.LANGUAGE_OPTIONS.SPANISH')),
        ]);
        this.#mainContainer.add(this.#languageOptionTextGameObjects.getChildren());

        // Flechas decorativas oxidadas
        const leftArrow = this.add.image(530, 328, UI_ASSET_KEYS.CURSOR_WHITE).setOrigin(1, 0).setScale(0.1).setFlipX(true);
        const rightArrow = this.add.image(660, 328, UI_ASSET_KEYS.CURSOR_WHITE).setOrigin(0, 0).setScale(0.1);
        leftArrow.setTint(0xcd7a32);
        rightArrow.setTint(0xcd7a32);
        this.#mainContainer.add([leftArrow, rightArrow]);

        this.tweens.add({
            targets: [leftArrow, rightArrow],
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        //option details container con estilo
        this.#infoContainer = this.#nineSliceMainContainer.createNineSliceContainer(this, optionMenuWidth, 120, UI_ASSET_KEYS.MENU_BACKGROUND);
        this.#infoContainer.setX(100).setY(height - 130);
        this.#addRivetsToContainer(this.#infoContainer, optionMenuWidth, 120);

        this.#selectedOptionInfoMsgTextGameObject = this.add.text(width / 2, height - 70, this.#i18n.t('OPTIONS_MENU.INFO.TEXT_SPEED'), {
            ...OPTIONS_TEXT_STYLE,
            fontSize: '20px',
            wordWrap: { width: width - 250, useAdvancedWrap: true },
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.9);

        // Cursor de selección estilo oxidado
        this.#optionsMenuCursor = this.add.rectangle(115, 80, optionMenuWidth - 30, 45, 0xffaa66, 0).setOrigin(0).setStrokeStyle(3, 0xffaa66, 0.8);

        // Animación de pulso para el cursor
        this.tweens.add({
            targets: this.#optionsMenuCursor,
            alpha: 0.3,
            scaleX: 1.01,
            scaleY: 1.05,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.#updateTextSpeedGameObjects();
        this.#updateBattleSceneOptionGameObjects();
        this.#updateBattleStyleOptionGameObjects();
        this.#updateSoundOptionGameObjects();
        this.#updateVolumeSlider();
        this.#updateMenuColorDisplayText()
        this.#updateLanguageOptionGameObjects()

        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start(this.#previousSceneName);
        })

        // Animación de entrada
        this.cameras.main.setAlpha(0);
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 1,
            duration: 1000,
            ease: 'Cubic.easeInOut'
        });
    }

    #createApocalypticBackground() {
        const width = this.scale.width;
        const height = this.scale.height;

        const bgGraphics = this.add.graphics();

        // Gradiente apocalíptico
        bgGraphics.fillGradientStyle(0x2a1a15, 0x3a2a1a, 0x2a1a15, 0x3a2a1a, 1);
        bgGraphics.fillRect(0, 0, width, height);

        // Textura de ruido
        const noiseTexture = this.#createNoiseTexture();
        const noiseOverlay = this.add.image(0, 0, noiseTexture).setOrigin(0).setAlpha(0.15);
        noiseOverlay.setDisplaySize(width, height);

        // Siluetas de ruinas
        const ruinsGraphics = this.add.graphics();
        ruinsGraphics.fillStyle(0x1a0f0a, 0.3);

        for (let i = 0; i < 12; i++) {
            const x = i * 90 + Math.random() * 30;
            const y = height - (Math.random() * 100 + 50);
            ruinsGraphics.fillRect(x, y, 35, height - y);
        }
    }

    #createNoiseTexture() {
        const textureKey = 'options_noise_texture';

        if (!this.textures.exists(textureKey)) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            for (let i = 0; i < canvas.width; i++) {
                for (let j = 0; j < canvas.height; j++) {
                    const value = Math.random() * 100;
                    ctx.fillStyle = `rgba(${value + 50}, ${value + 30}, ${value + 20}, ${Math.random() * 0.2})`;
                    ctx.fillRect(i, j, 1, 1);
                }
            }

            this.textures.addCanvas(textureKey, canvas);
        }

        return textureKey;
    }

    #createDustAndAsh() {
        this.#dustContainer = this.add.container();
        const width = this.scale.width;
        const height = this.scale.height;

        // Polvo flotante
        for (let i = 0; i < 80; i++) {
            const dust = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 2 + 1,
                0x8b5a2b,
                Math.random() * 0.3 + 0.1
            );

            this.tweens.add({
                targets: dust,
                y: dust.y - (Math.random() * 150 + 50),
                x: dust.x + (Math.random() - 0.5) * 80,
                alpha: 0,
                duration: Math.random() * 10000 + 5000,
                repeat: -1,
                onComplete: () => {
                    dust.y = height + 20;
                    dust.x = Math.random() * width;
                    dust.setAlpha(Math.random() * 0.3 + 0.1);
                }
            });

            this.#dustContainer.add(dust);
        }
    }

    #createRustyCracks() {
        const crackGraphics = this.add.graphics();
        const width = this.scale.width;
        const height = this.scale.height;

        crackGraphics.lineStyle(2, 0x6a3a1a, 0.4);

        for (let i = 0; i < 20; i++) {
            const startX = Math.random() * width;
            const startY = Math.random() * height;

            crackGraphics.beginPath();
            crackGraphics.moveTo(startX, startY);

            let currentX = startX;
            let currentY = startY;

            for (let j = 0; j < 4; j++) {
                currentX += (Math.random() - 0.5) * 30;
                currentY += Math.random() * 25;
                crackGraphics.lineTo(currentX, currentY);
            }

            crackGraphics.strokePath();
        }

        // Manchas de óxido
        for (let i = 0; i < 50; i++) {
            crackGraphics.fillStyle(0x8b4513, Math.random() * 0.25);
            crackGraphics.fillCircle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 12 + 3
            );
        }
    }

    #createRustedOptionText(x, y, text) {
        const textObj = this.add.text(x, y, text, OPTIONS_TEXT_STYLE);
        textObj.setInteractive({ useHandCursor: true });

        textObj.on('pointerover', () => {
            textObj.setColor(TEXT_FONT_COLOR.HOVER);
            textObj.setScale(1.05);
        });

        textObj.on('pointerout', () => {
            textObj.setColor(TEXT_FONT_COLOR.NOT_SELECTED);
            textObj.setScale(1);
        });

        return textObj;
    }

    #addRivetsToContainer(container, width, height) {
        const rivetGraphics = this.add.graphics();
        const rivetPositions = [
            [20, 20], [width - 20, 20],
            [20, height - 20], [width - 20, height - 20]
        ];

        rivetPositions.forEach(pos => {
            rivetGraphics.fillStyle(0x8b5a2b, 1);
            rivetGraphics.fillCircle(pos[0], pos[1], 6);
            rivetGraphics.fillStyle(0xcd7a32, 0.8);
            rivetGraphics.fillCircle(pos[0], pos[1], 4);
        });

        container.add(rivetGraphics);
    }

    update() {
        super.update()

        if (this._controls.isInputLocked) {
            return
        }

        if (this._controls.wasBackKeyPressed()) {
            this._controls.lockInput = true;
            this.cameras.main.fadeOut(500, 0, 0, 0)
            return;
        }

        if (this._controls.wasSpaceKeyPressed() && this.#selectedOptionMenu === OPTION_MENU_OPTIONS.CONFIRM) {
            this._controls.lockInput = true;
            this.#updateOptionDataInDataManager().then(() => {
                this.cameras.main.fadeOut(500, 0, 0, 0)
            });
            return
        }

        const selectedDirection = this._controls.getDirectionKeyJustPressed();

        if (selectedDirection !== DIRECTION.NONE) {
            this.#moveOptionMenuCursor(selectedDirection);
        }
    }

    async #updateOptionDataInDataManager() {
        dataManager.store.set({
            [DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED]: this.#selectedTextSpeedOption,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS]: this.#selectedBattleSceneOption,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE]: this.#selectedBattleStyleOption,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND]: this.#selectedSoundMenuOption,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME]: this.#selectedVolumeOption,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR]: this.#selectedMenuColorOption,
            [DATA_MANAGER_STORE_KEYS.OPTIONS_LANGUAGE]: this.#selectedLanguageOption,
        })
        await dataManager.saveData();
    }

    /**
     * 
     * @param {import('../common/direction.js').Direction} direction 
     */
    #moveOptionMenuCursor(direction) {
        if (direction === DIRECTION.NONE) {
            return;
        }

        this.#updateSelectedOptionMenuFromInput(direction);

        switch (this.#selectedOptionMenu) {
            case OPTION_MENU_OPTIONS.TEXT_SPEED:
                this.#optionsMenuCursor.setY(80);
                break;
            case OPTION_MENU_OPTIONS.BATTLE_SCENE:
                this.#optionsMenuCursor.setY(132);
                break;
            case OPTION_MENU_OPTIONS.BATTLE_STYLE:
                this.#optionsMenuCursor.setY(184);
                break;
            case OPTION_MENU_OPTIONS.SOUND:
                this.#optionsMenuCursor.setY(236);
                break;
            case OPTION_MENU_OPTIONS.VOLUME:
                this.#optionsMenuCursor.setY(288);
                break;
            case OPTION_MENU_OPTIONS.MENU_COLOR:
                this.#optionsMenuCursor.setY(340);
                break;
            case OPTION_MENU_OPTIONS.LANGUAGE:
                this.#optionsMenuCursor.setY(392);
                break;
            case OPTION_MENU_OPTIONS.CONFIRM:
                this.#optionsMenuCursor.setY(444);
                break;
            default:
                exhaustiveGuard(this.#selectedOptionMenu)
        }
        this.#selectedOptionInfoMsgTextGameObject.setText(this.#i18n.t(`OPTIONS_MENU.INFO.${this.#selectedOptionMenu}`))

        // Pequeño temblor al cambiar selección
        this.cameras.main.shake(30, 0.002);
    }

    /**
     * 
     * @param {import('../common/direction.js').Direction} direction 
     * 
     */
    #updateSelectedOptionMenuFromInput(direction) {
        if (direction === DIRECTION.NONE) {
            return;
        }

        if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.TEXT_SPEED) {
            switch (direction) {
                case DIRECTION.DOWN:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.BATTLE_SCENE
                    return
                case DIRECTION.UP:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.CONFIRM
                    return
                case DIRECTION.LEFT:
                case DIRECTION.RIGHT:
                    this.#updateTextSpeedOption(direction)
                    this.#updateTextSpeedGameObjects()
                    return
                default:
                    exhaustiveGuard(direction);
            }
            return
        }

        if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.BATTLE_SCENE) {
            switch (direction) {
                case DIRECTION.DOWN:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.BATTLE_STYLE
                    return
                case DIRECTION.UP:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.TEXT_SPEED
                    return
                case DIRECTION.LEFT:
                case DIRECTION.RIGHT:
                    this.#updateBattleSceneOption(direction)
                    this.#updateBattleSceneOptionGameObjects()
                    return
                default:
                    exhaustiveGuard(direction);
            }
            return
        }

        if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.BATTLE_STYLE) {
            switch (direction) {
                case DIRECTION.DOWN:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.SOUND
                    return
                case DIRECTION.UP:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.BATTLE_SCENE
                    return
                case DIRECTION.LEFT:
                case DIRECTION.RIGHT:
                    this.#updateBattleStyleOption(direction)
                    this.#updateBattleStyleOptionGameObjects()
                    return
                default:
                    exhaustiveGuard(direction);
            }
            return
        }

        if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.SOUND) {
            switch (direction) {
                case DIRECTION.DOWN:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.VOLUME
                    return
                case DIRECTION.UP:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.BATTLE_STYLE
                    return
                case DIRECTION.LEFT:
                case DIRECTION.RIGHT:
                    this.#updateSoundOption(direction)
                    this.#updateSoundOptionGameObjects()
                    return
                default:
                    exhaustiveGuard(direction);
            }
            return
        }

        if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.VOLUME) {
            switch (direction) {
                case DIRECTION.DOWN:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.MENU_COLOR
                    return
                case DIRECTION.UP:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.SOUND
                    return
                case DIRECTION.LEFT:
                case DIRECTION.RIGHT:
                    this.#updateVolumeOption(direction)
                    this.#updateVolumeSlider()
                    return
                default:
                    exhaustiveGuard(direction);
            }
            return
        }

        if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.MENU_COLOR) {
            switch (direction) {
                case DIRECTION.DOWN:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.LANGUAGE
                    return
                case DIRECTION.UP:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.VOLUME
                    return
                case DIRECTION.LEFT:
                case DIRECTION.RIGHT:
                    this.#updateMenuColorOption(direction)
                    this.#updateMenuColorDisplayText()
                    return
                default:
                    exhaustiveGuard(direction);
            }
            return
        }

        if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.LANGUAGE) {
            switch (direction) {
                case DIRECTION.DOWN:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.CONFIRM
                    return
                case DIRECTION.UP:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.MENU_COLOR
                    return
                case DIRECTION.LEFT:
                case DIRECTION.RIGHT:
                    this.#updateLanguageOption(direction)
                    this.#updateLanguageOptionGameObjects()
                    return
                default:
                    exhaustiveGuard(direction);
            }
            return
        }

        if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.CONFIRM) {
            switch (direction) {
                case DIRECTION.DOWN:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.TEXT_SPEED
                    return
                case DIRECTION.UP:
                    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.LANGUAGE
                    return
                case DIRECTION.LEFT:
                case DIRECTION.RIGHT:
                    return
                default:
                    exhaustiveGuard(direction);
            }
            return
        }

        exhaustiveGuard(this.#selectedOptionMenu)
    }

    /**
     * 
     * @param {'LEFT' | 'RIGHT'} direction 
     */
    #updateTextSpeedOption(direction) {
        if (direction === DIRECTION.LEFT) {
            if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.SLOW) {
                return;
            }
            if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.MID) {
                this.#selectedTextSpeedOption = TEXT_SPEED_OPTIONS.SLOW;
                return;
            }
            if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.FAST) {
                this.#selectedTextSpeedOption = TEXT_SPEED_OPTIONS.MID;
                return;
            }
            exhaustiveGuard(this.#selectedTextSpeedOption)
            return
        }

        if (direction === DIRECTION.RIGHT) {
            if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.FAST) {
                return;
            }
            if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.MID) {
                this.#selectedTextSpeedOption = TEXT_SPEED_OPTIONS.FAST;
                return;
            }
            if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.SLOW) {
                this.#selectedTextSpeedOption = TEXT_SPEED_OPTIONS.MID;
                return;
            }
            exhaustiveGuard(this.#selectedTextSpeedOption)
            return;
        }

        exhaustiveGuard(direction)
    }

    #updateTextSpeedGameObjects() {
        const textGameObjects = /** @type {Phaser.GameObjects.Text[]} */(
            this.#textSpeedOptionTextGameObjects.getChildren()
        )

        textGameObjects.forEach((obj) => {
            obj.setColor(TEXT_FONT_COLOR.NOT_SELECTED)
        })

        if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.SLOW) {
            textGameObjects[0].setColor(TEXT_FONT_COLOR.SELECTED);
            return
        }

        if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.MID) {
            textGameObjects[1].setColor(TEXT_FONT_COLOR.SELECTED);
            return
        }

        if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.FAST) {
            textGameObjects[2].setColor(TEXT_FONT_COLOR.SELECTED);
            return
        }

        exhaustiveGuard(this.#selectedTextSpeedOption);
    }

    /**
     * @param {'LEFT' | 'RIGHT'} direction
     */
    #updateBattleSceneOption(direction) {
        if (direction === DIRECTION.LEFT && this.#selectedBattleSceneOption === BATTLE_SCENE_OPTIONS.ON) {
            return
        }
        if (direction === DIRECTION.LEFT) {
            this.#selectedBattleSceneOption = BATTLE_SCENE_OPTIONS.ON
            return
        }

        if (direction === DIRECTION.RIGHT && this.#selectedBattleSceneOption === BATTLE_SCENE_OPTIONS.OFF) {
            return
        }
        if (direction === DIRECTION.RIGHT) {
            this.#selectedBattleSceneOption = BATTLE_SCENE_OPTIONS.OFF
            return
        }

        exhaustiveGuard(direction)
    }

    #updateBattleSceneOptionGameObjects() {
        const textGameObjects = /** @type {Phaser.GameObjects.Text[]} */(
            this.#battleSceneOptionTextGameObjects.getChildren()
        )

        textGameObjects.forEach((obj) => {
            obj.setColor(TEXT_FONT_COLOR.NOT_SELECTED)
        })

        if (this.#selectedBattleSceneOption === BATTLE_SCENE_OPTIONS.OFF) {
            textGameObjects[1].setColor(TEXT_FONT_COLOR.SELECTED)
            return
        }

        if (this.#selectedBattleSceneOption === BATTLE_SCENE_OPTIONS.ON) {
            textGameObjects[0].setColor(TEXT_FONT_COLOR.SELECTED)
            return
        }

        exhaustiveGuard(this.#selectedBattleSceneOption)
    }

    /**
     * @param {'LEFT' | 'RIGHT'} direction
     */
    #updateBattleStyleOption(direction) {
        if (direction === DIRECTION.LEFT && this.#selectedBattleStyleOption === BATTLE_STYLE_OPTIONS.SET) {
            return
        }
        if (direction === DIRECTION.LEFT) {
            this.#selectedBattleStyleOption = BATTLE_STYLE_OPTIONS.SET
            return
        }

        if (direction === DIRECTION.RIGHT && this.#selectedBattleStyleOption === BATTLE_STYLE_OPTIONS.SHIFT) {
            return
        }
        if (direction === DIRECTION.RIGHT) {
            this.#selectedBattleStyleOption = BATTLE_STYLE_OPTIONS.SHIFT
            return
        }

        exhaustiveGuard(direction)
    }

    #updateBattleStyleOptionGameObjects() {
        const textGameObjects = /** @type {Phaser.GameObjects.Text[]} */(
            this.#battleStyleOptionTextGameObjects.getChildren()
        )

        textGameObjects.forEach((obj) => {
            obj.setColor(TEXT_FONT_COLOR.NOT_SELECTED)
        })

        if (this.#selectedBattleStyleOption === BATTLE_STYLE_OPTIONS.SHIFT) {
            textGameObjects[1].setColor(TEXT_FONT_COLOR.SELECTED)
            return
        }

        if (this.#selectedBattleStyleOption === BATTLE_STYLE_OPTIONS.SET) {
            textGameObjects[0].setColor(TEXT_FONT_COLOR.SELECTED)
            return
        }

        exhaustiveGuard(this.#selectedBattleStyleOption)
    }

    /**
     * @param {'LEFT' | 'RIGHT'} direction
     */
    #updateSoundOption(direction) {
        if (direction === DIRECTION.LEFT && this.#selectedSoundMenuOption === SOUND_OPTIONS.ON) {
            return
        }
        if (direction === DIRECTION.LEFT) {
            this.#selectedSoundMenuOption = SOUND_OPTIONS.ON
            return
        }

        if (direction === DIRECTION.RIGHT && this.#selectedSoundMenuOption === SOUND_OPTIONS.OFF) {
            return
        }
        if (direction === DIRECTION.RIGHT) {
            this.#selectedSoundMenuOption = SOUND_OPTIONS.OFF
            return
        }

        exhaustiveGuard(direction)
    }

    #updateSoundOptionGameObjects() {
        const textGameObjects = /** @type {Phaser.GameObjects.Text[]} */(
            this.#soundOptionTextGameObjects.getChildren()
        )

        textGameObjects.forEach((obj) => {
            obj.setColor(TEXT_FONT_COLOR.NOT_SELECTED)
        })

        if (this.#selectedSoundMenuOption === SOUND_OPTIONS.ON) {
            textGameObjects[0].setColor(TEXT_FONT_COLOR.SELECTED)
            return
        }

        if (this.#selectedSoundMenuOption === SOUND_OPTIONS.OFF) {
            textGameObjects[1].setColor(TEXT_FONT_COLOR.SELECTED)
            return
        }

        exhaustiveGuard(this.#selectedSoundMenuOption)
    }

    /**
    * @param {'LEFT' | 'RIGHT'} direction
    */
    #updateVolumeOption(direction) {
        if (direction === DIRECTION.LEFT && this.#selectedVolumeOption === 0) {
            return
        }
        if (direction === DIRECTION.LEFT) {
            this.#selectedVolumeOption = /** @type {import('../common/options.js').VolumeMenuOptions} */(
                this.#selectedVolumeOption - 1
            )
            return
        }

        if (direction === DIRECTION.RIGHT && this.#selectedVolumeOption === 4) {
            return
        }
        if (direction === DIRECTION.RIGHT) {
            this.#selectedVolumeOption = /** @type {import('../common/options.js').VolumeMenuOptions} */(
                this.#selectedVolumeOption + 1
            )
            return
        }
    }

    #updateVolumeSlider() {
        switch (this.#selectedVolumeOption) {
            case 0:
                this.#volumeOptionsMenuCursor.setX(420)
                this.#volumeOptionsValueText.setText('0%')
                break;
            case 1:
                this.#volumeOptionsMenuCursor.setX(490)
                this.#volumeOptionsValueText.setText('25%')
                break;
            case 2:
                this.#volumeOptionsMenuCursor.setX(560)
                this.#volumeOptionsValueText.setText('50%')
                break;
            case 3:
                this.#volumeOptionsMenuCursor.setX(630)
                this.#volumeOptionsValueText.setText('75%')
                break;
            case 4:
                this.#volumeOptionsMenuCursor.setX(710)
                this.#volumeOptionsValueText.setText('100%')
                break;
            default:
                exhaustiveGuard(this.#selectedVolumeOption)
        }
    }

    /**
    * @param {'LEFT' | 'RIGHT'} direction
    */
    #updateMenuColorOption(direction) {
        if (direction === DIRECTION.LEFT && this.#selectedMenuColorOption === 0) {
            this.#selectedMenuColorOption = 2
            return
        }
        if (direction === DIRECTION.RIGHT && this.#selectedMenuColorOption === 2) {
            this.#selectedMenuColorOption = 0
            return
        }

        if (direction === DIRECTION.LEFT) {
            this.#selectedMenuColorOption -= 1
            return
        }
        if (direction === DIRECTION.RIGHT) {
            this.#selectedMenuColorOption += 1
            return
        }

        exhaustiveGuard(direction)
    }

    #updateMenuColorDisplayText() {
        switch (this.#selectedMenuColorOption) {
            case 0:
                this.#selectedMenuColorTextGameObject.setText('RUST-01')
                this.#nineSliceMainContainer.updateNineSliceContainerTexture(
                    this.sys.textures,
                    this.#mainContainer,
                    UI_ASSET_KEYS.MENU_BACKGROUND
                )
                this.#nineSliceMainContainer.updateNineSliceContainerTexture(
                    this.sys.textures,
                    this.#infoContainer,
                    UI_ASSET_KEYS.MENU_BACKGROUND
                )
                break;
            case 1:
                this.#selectedMenuColorTextGameObject.setText('RUST-02')
                this.#nineSliceMainContainer.updateNineSliceContainerTexture(
                    this.sys.textures,
                    this.#mainContainer,
                    UI_ASSET_KEYS.MENU_BACKGROUND_GREEN
                )
                this.#nineSliceMainContainer.updateNineSliceContainerTexture(
                    this.sys.textures,
                    this.#infoContainer,
                    UI_ASSET_KEYS.MENU_BACKGROUND_GREEN
                )
                break;
            case 2:
                this.#selectedMenuColorTextGameObject.setText('RUST-03')
                this.#nineSliceMainContainer.updateNineSliceContainerTexture(
                    this.sys.textures,
                    this.#mainContainer,
                    UI_ASSET_KEYS.MENU_BACKGROUND_PURPLE
                )
                this.#nineSliceMainContainer.updateNineSliceContainerTexture(
                    this.sys.textures,
                    this.#infoContainer,
                    UI_ASSET_KEYS.MENU_BACKGROUND_PURPLE
                )
                break;
            default:
                exhaustiveGuard(this.#selectedMenuColorOption)
        }
    }

    /**
     * @param {'LEFT' | 'RIGHT'} direction
     */
    #updateLanguageOption(direction) {
        if (direction === DIRECTION.LEFT && this.#selectedLanguageOption === LANGUAGE_OPTIONS.ENGLISH) {
            return
        }
        if (direction === DIRECTION.LEFT) {
            this.#selectedLanguageOption = LANGUAGE_OPTIONS.ENGLISH
            dataManager.store.set(DATA_MANAGER_STORE_KEYS.OPTIONS_LANGUAGE, this.#selectedLanguageOption);
            dataManager.saveData();
            this.#i18n.refresh()
            this.scene.restart({ previousSceneName: this.#previousSceneName })
            return
        }

        if (direction === DIRECTION.RIGHT && this.#selectedLanguageOption === LANGUAGE_OPTIONS.SPANISH) {
            return
        }
        if (direction === DIRECTION.RIGHT) {
            this.#selectedLanguageOption = LANGUAGE_OPTIONS.SPANISH
            dataManager.store.set(DATA_MANAGER_STORE_KEYS.OPTIONS_LANGUAGE, this.#selectedLanguageOption);
            dataManager.saveData();
            this.#i18n.refresh()
            this.scene.restart({ previousSceneName: this.#previousSceneName })
            return
        }

        exhaustiveGuard(direction)
    }

    #updateLanguageOptionGameObjects() {
        const textGameObjects = /** @type {Phaser.GameObjects.Text[]} */(
            this.#languageOptionTextGameObjects.getChildren()
        )

        textGameObjects.forEach((obj) => {
            obj.setColor(TEXT_FONT_COLOR.NOT_SELECTED)
        })

        if (this.#selectedLanguageOption === LANGUAGE_OPTIONS.ENGLISH) {
            textGameObjects[0].setColor(TEXT_FONT_COLOR.SELECTED)
            return
        }

        if (this.#selectedLanguageOption === LANGUAGE_OPTIONS.SPANISH) {
            textGameObjects[1].setColor(TEXT_FONT_COLOR.SELECTED)
            return
        }

        exhaustiveGuard(this.#selectedLanguageOption)
    }

    handleSceneCleanup() {
        super.handleSceneCleanup();

        if (this.#dustTimer) {
            this.#dustTimer.remove();
        }

        if (this.#dustContainer) {
            this.#dustContainer.destroy();
        }
    }
}