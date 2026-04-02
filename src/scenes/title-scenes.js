import { TITLE_ASSET_KEYS, UI_ASSET_KEYS } from "../assets/asset-keys.js"
import { KENNEY_FUTURE_NARROW_FONT_NAME } from "../assets/font-keys.js"
import { DIRECTION } from "../common/direction.js"
import Phaser from "../lib/phaser.js"
import { Controls } from "../utils/controls.js"
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../utils/data-manager.js"
import { exhaustiveGuard } from "../utils/guard.js"
import { NineSlice } from "../utils/nine-slice.js"
import { BaseScene } from "./base-scene.js"
import { SCENE_KEYS } from './scene-keys.js'
import { i18n } from "../utils/i18n.js"


//ESTILO DE TEXTO DEL MENU
/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
export const MENU_TEXT_STYLE = Object.freeze({
    fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
    color: '#8B5A2B',
    fontSize: '42px',
    fontStyle: 'bold',
    shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        stroke: false,
        fill: true
    }
})

/**
 * @typedef {keyof typeof MAIN_MENU_OPTIONS} MainMenuOptions
 */

//OPCIONES DEL MENU
/**@enum {MainMenuOptions} */
const MAIN_MENU_OPTIONS = Object.freeze({
    NEW_GAME: 'NEW_GAME',
    CONTINUE: 'CONTINUE',
    OPTIONS: 'OPTIONS'
})

//CREAMOS LA ESCENA
export class TitleScene extends BaseScene {
    /**@type {MainMenuOptions} */
    #selectedMenuOptions;
    /**@type {boolean} */
    #isContinueButtonEnabled
    /**@type {NineSlice} */
    #nineSliceMenu;
    /**@type {Phaser.GameObjects.Rectangle} */
    #selectionGlow;
    /**@type {Phaser.GameObjects.Text[]} */
    #menuItems;
    /**@type {Phaser.Time.TimerEvent} */
    #dustTimer;
    /**@type {Phaser.GameObjects.Graphics} */
    #crackGraphics;
    /**@type {Phaser.GameObjects.Container} */
    #dustContainer;
    /**@type {Phaser.GameObjects.Image} */
    #radiationEffect;
    /**@type {Phaser.GameObjects.Sprite} */
    #fireEffect;
    /**@type {import('../utils/i18n.js').I18n} */
    #i18n;

    constructor() {
        super({
            key: SCENE_KEYS.TITLE_SCENE,
        })
    }

    init() {
        super.init()
        console.log(`[${TitleScene.name}:init] invoked`);

        this.#nineSliceMenu = new NineSlice({
            cornerCutSize: 32,
            textureManager: this.sys.textures,
            assetKeys: [UI_ASSET_KEYS.MENU_BACKGROUND, UI_ASSET_KEYS.MENU_BACKGROUND_GREEN, UI_ASSET_KEYS.MENU_BACKGROUND_PURPLE]
        })
        this.#i18n = i18n(this);
    }

    create() {
        super.create()
        console.log(`[${TitleScene.name}:create] invoked`)

        this.#selectedMenuOptions = MAIN_MENU_OPTIONS.NEW_GAME
        this.#isContinueButtonEnabled = dataManager.store.get(DATA_MANAGER_STORE_KEYS.GAME_STARTED) || false

        

        // Fondo postapocalíptico
        this.#createApocalypticBackground()

        // Grietas y texturas de desgaste
        this.#createCracksAndRust()

        // Partículas de polvo y ceniza
        this.#createDustAndAsh()

        // Efecto de radiación/neblina tóxica
        this.#createRadiationFog()

        // Título estilo postapocalíptico
        this.#createApocalypticTitle()

        // Menú con estilo oxidado
        this.#createRustedMenu()

        // Efecto de selección con fuego/óxido
        this.#createRustySelectionGlow()

        // Iniciar animaciones de entrada
        this.#startApocalypticAnimations()

        // Evento de fade out
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, async () => {
            if (this.#selectedMenuOptions === MAIN_MENU_OPTIONS.OPTIONS) {
                this.scene.start(SCENE_KEYS.OPTION_SCENE, { previousSceneName: SCENE_KEYS.TITLE_SCENE })
                return
            }

            if (this.#selectedMenuOptions === MAIN_MENU_OPTIONS.NEW_GAME) {
                await dataManager.startNewGame()
            } else if (this.#selectedMenuOptions === MAIN_MENU_OPTIONS.CONTINUE) {
                await dataManager.loadData();
            }

            this.scene.start(SCENE_KEYS.WORLD_SCENE)
        })

        // Efecto de temblor ocasional
        this.#startEarthquakeEffect()
    }

    #createApocalypticBackground() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Fondo completo de la escena titulo
        this.add.image(0, 0, TITLE_ASSET_KEYS.BACKGROUND)
            .setOrigin(0)
            .setDisplaySize(this.scale.width, this.scale.height);
        

        // Gradiente de colores apocalípticos (óxido, sangre, tierra quemada)
        //const bgGraphics = this.add.graphics();

        // Colores postapocalípticos
        const colors = [
            { r: 30, g: 20, b: 15 },   // Marrón oscuro
            { r: 45, g: 25, b: 20 },   // Rojo óxido
            { r: 35, g: 20, b: 18 },   // Marrón rojizo
            { r: 25, g: 18, b: 15 }    // Tierra quemada
        ];

        let time = 0;
        /*this.tweens.addCounter({
            from: 0,
            to: colors.length - 1,
            duration: 12000,
            repeat: -1,
            yoyo: true,
            onUpdate: (tween) => {
                const value = tween.getValue();
                const index = Math.floor(value);
                const nextIndex = Math.min(index + 1, colors.length - 1);
                const progress = value - index;

                const color1 = colors[index];
                const color2 = colors[nextIndex];

                const r = Math.floor(color1.r + (color2.r - color1.r) * progress);
                const g = Math.floor(color1.g + (color2.g - color1.g) * progress);
                const b = Math.floor(color1.b + (color2.b - color1.b) * progress);

                bgGraphics.clear();
                bgGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
                bgGraphics.fillRect(0, 0, width, height);
            }
        });*/

        // Añadir textura de ruido para dar sensación de suciedad
        const noiseTexture = this.#createNoiseTexture();
        const noiseOverlay = this.add.image(0, 0, noiseTexture).setOrigin(0).setAlpha(0.15);
        noiseOverlay.setDisplaySize(width, height);

        // Siluetas de edificios destruidos al fondo
        this.#createRuinsSkyline();
    }

    #createNoiseTexture() {
        const textureKey = 'noise_texture';

        if (!this.textures.exists(textureKey)) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            for (let i = 0; i < canvas.width; i++) {
                for (let j = 0; j < canvas.height; j++) {
                    const value = Math.random() * 255;
                    ctx.fillStyle = `rgba(${value}, ${value}, ${value}, ${Math.random() * 0.3})`;
                    ctx.fillRect(i, j, 1, 1);
                }
            }

            this.textures.addCanvas(textureKey, canvas);
        }

        return textureKey;
    }

    #createRuinsSkyline() {
        const width = this.scale.width;
        const height = this.scale.height;
        const ruinsGraphics = this.add.graphics();

        ruinsGraphics.fillStyle(0x2a1e15, 0.4);

        // Crear siluetas de edificios derruidos
        const buildingHeights = [120, 80, 150, 60, 100, 40, 90, 70, 110, 50];
        const buildingWidth = 45;

        for (let i = 0; i < buildingHeights.length; i++) {
            const x = (i * buildingWidth) + (Math.random() * 20);
            const y = height - buildingHeights[i];

            ruinsGraphics.fillRect(x, y, buildingWidth - 5, buildingHeights[i]);

            // Añadir grietas verticales
            ruinsGraphics.fillStyle(0x000000, 0.3);
            ruinsGraphics.fillRect(x + 15, y, 3, buildingHeights[i] * 0.6);
            ruinsGraphics.fillRect(x + 30, y + 20, 2, buildingHeights[i] * 0.4);
        }
    }

    #createCracksAndRust() {
        this.#crackGraphics = this.add.graphics();
        const width = this.scale.width;
        const height = this.scale.height;

        // Dibujar grietas aleatorias
        this.#crackGraphics.lineStyle(3, 0x4a2a1a, 0.6);

        for (let i = 0; i < 30; i++) {
            const startX = Math.random() * width;
            const startY = Math.random() * height;

            this.#crackGraphics.beginPath();
            this.#crackGraphics.moveTo(startX, startY);

            let currentX = startX;
            let currentY = startY;

            for (let j = 0; j < 5; j++) {
                currentX += (Math.random() - 0.5) * 40;
                currentY += Math.random() * 30;
                this.#crackGraphics.lineTo(currentX, currentY);
            }

            this.#crackGraphics.strokePath();
        }

        // Añadir manchas de óxido
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 15 + 5;

            this.#crackGraphics.fillStyle(0x8b4513, Math.random() * 0.3);
            this.#crackGraphics.fillCircle(x, y, radius);
        }
    }

    #createDustAndAsh() {
        this.#dustContainer = this.add.container();
        const width = this.scale.width;
        const height = this.scale.height;

        // Crear partículas de polvo (como círculos pequeños)
        for (let i = 0; i < 100; i++) {
            const dust = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 3 + 1,
                0x6a4a2a,
                Math.random() * 0.4 + 0.1
            );

            // Animación de flotación
            this.tweens.add({
                targets: dust,
                y: dust.y - (Math.random() * 100 + 50),
                x: dust.x + (Math.random() - 0.5) * 50,
                alpha: 0,
                duration: Math.random() * 8000 + 4000,
                repeat: -1,
                ease: 'Linear',
                onComplete: () => {
                    dust.y = height + 10;
                    dust.x = Math.random() * width;
                    dust.setAlpha(Math.random() * 0.4 + 0.1);
                }
            });

            this.#dustContainer.add(dust);
        }

        // Ceniza que cae
        for (let i = 0; i < 50; i++) {
            const ash = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 2 + 1,
                0x4a3a2a,
                Math.random() * 0.5 + 0.2
            );

            this.tweens.add({
                targets: ash,
                y: height + 50,
                duration: Math.random() * 10000 + 5000,
                repeat: -1,
                ease: 'Linear',
                onComplete: () => {
                    ash.y = -10;
                    ash.x = Math.random() * width;
                }
            });

            this.#dustContainer.add(ash);
        }
    }

    #createRadiationFog() {
        // Efecto de niebla tóxica/radiación
        const width = this.scale.width;
        const height = this.scale.height;

        this.#radiationEffect = this.add.image(width / 2, height / 2, null);
        this.#radiationEffect.setDisplaySize(width, height);

        // Crear un gradiente radial para la niebla
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, 'rgba(100, 50, 30, 0)');
        gradient.addColorStop(0.5, 'rgba(80, 40, 25, 0.3)');
        gradient.addColorStop(1, 'rgba(60, 30, 20, 0.6)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        const textureKey = 'radiation_fog';
        this.textures.addCanvas(textureKey, canvas);
        this.#radiationEffect.setTexture(textureKey);

        // Animar la niebla
        this.tweens.add({
            targets: this.#radiationEffect,
            alpha: 0.6,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    #createApocalypticTitle() {
        const titleX = this.scale.width / 2;
        const titleY = 160;
        const gameTitle = "WASTELAND TAMER"; // Cambia esto por el título de tu juego

        // Textura de metal oxidado para el título
        const rustTexture = this.#createRustTexture();

        // Capa principal del título con estilo metálico
        const mainTitle = this.add.text(titleX, titleY, gameTitle, {
            fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
            fontSize: '88px',
            fontStyle: 'bold',
            color: '#cd7a32',
            stroke: '#4a2a1a',
            strokeThickness: 4,
            shadow: {
                offsetX: 6,
                offsetY: 6,
                color: '#000000',
                blur: 10,
                fill: true
            }
        }).setOrigin(0.5);

        // Efecto de óxido sobre el título
        const rustOverlay = this.add.image(titleX, titleY, rustTexture).setOrigin(0.5).setAlpha(0.4);
        rustOverlay.setDisplaySize(mainTitle.width + 40, mainTitle.height + 20);

        // Subtítulo con mensaje postapocalíptico
        const subtitle = this.add.text(titleX, titleY + 70, this.#i18n.t('TITLE_MENU.SUBTITLE'), {
            fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
            fontSize: '22px',
            color: '#b87c4a',
            fontStyle: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5).setAlpha(0.8);

        // Animación de parpadeo para el subtítulo
        this.tweens.add({
            targets: subtitle,
            alpha: 0.4,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // Línea decorativa oxidada bajo el título
        const rustLine = this.add.rectangle(titleX, titleY + 95, 0, 4, 0xcd7a32, 0.8);
        this.tweens.add({
            targets: rustLine,
            width: 450,
            duration: 1000,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: rustLine,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    #createRustTexture() {
        const textureKey = 'rust_texture';

        if (!this.textures.exists(textureKey)) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Fondo base
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Manchas de óxido
            for (let i = 0; i < 2000; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const radius = Math.random() * 8 + 2;
                const opacity = Math.random() * 0.6;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(139, 69, 19, ${opacity})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x - 2, y - 1, radius * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(205, 122, 50, ${opacity * 0.8})`;
                ctx.fill();
            }

            this.textures.addCanvas(textureKey, canvas);
        }

        return textureKey;
    }

    #createRustedMenu() {
        const menuBgWidth = 750;
        const menuItemsY = [50, 150, 250];

        // Panel del menú con apariencia de metal oxidado
        const menuBg = this.add.graphics();
        menuBg.fillStyle(0x2a1e15, 0.85);
        menuBg.fillRoundedRect(0, 0, menuBgWidth, 380, 15);

        // Borde metálico
        menuBg.lineStyle(4, 0xcd7a32, 0.8);
        menuBg.strokeRoundedRect(0, 0, menuBgWidth, 380, 15);

        // Añadir remaches oxidados
        const rivetPositions = [
            [20, 20], [menuBgWidth - 20, 20],
            [20, 360], [menuBgWidth - 20, 360]
        ];

        rivetPositions.forEach(pos => {
            menuBg.fillStyle(0x8b5a2b, 1);
            menuBg.fillCircle(pos[0], pos[1], 8);
            menuBg.fillStyle(0xcd7a32, 0.8);
            menuBg.fillCircle(pos[0], pos[1], 5);
        });

        const menuContainer = this.add.container(
            this.scale.width / 2 - menuBgWidth / 2,
            280,
            [menuBg]
        );

        // Botones del menú estilo postapocalíptico
        const menuLabels = [
            this.#i18n.t('TITLE_MENU.NEW_GAME'),
            this.#i18n.t('TITLE_MENU.CONTINUE'),
            this.#i18n.t('TITLE_MENU.OPTIONS')
        ];
        const menuDescriptions = [
            this.#i18n.t('TITLE_MENU.NEW_GAME_DESC'),
            this.#i18n.t('TITLE_MENU.CONTINUE_DESC'),
            this.#i18n.t('TITLE_MENU.OPTIONS_DESC')
        ];

        this.#menuItems = [];

        menuLabels.forEach((label, index) => {
            const isContinue = index === 1;
            const isEnabled = !isContinue || this.#isContinueButtonEnabled;

            // Texto principal del botón
            const menuItem = this.add.text(menuBgWidth / 2, menuItemsY[index], label, {
                fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
                fontSize: '38px',
                fontStyle: 'bold',
                color: isEnabled ? '#e89a4a' : '#6a4a2a',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 4,
                    fill: true
                }
            }).setOrigin(0.5);

            // Descripción del botón
            const description = this.add.text(menuBgWidth / 2, menuItemsY[index] + 35, menuDescriptions[index], {
                fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
                fontSize: '16px',
                color: '#b87c4a',
                fontStyle: 'italic'
            }).setOrigin(0.5).setAlpha(0.7);

            if (isEnabled) {
                menuItem.setInteractive({ useHandCursor: true });

                // Efectos hover con sonido de metal
                menuItem.on('pointerover', () => {
                    this.tweens.add({
                        targets: menuItem,
                        scale: 1.05,
                        color: '#ffaa66',
                        duration: 150,
                        ease: 'Back.easeOut'
                    });
                    description.setAlpha(1);
                });

                menuItem.on('pointerout', () => {
                    this.tweens.add({
                        targets: menuItem,
                        scale: 1,
                        color: '#e89a4a',
                        duration: 150
                    });
                    description.setAlpha(0.7);
                });

                menuItem.on('pointerdown', () => {
                    this.#selectedMenuOptions = Object.values(MAIN_MENU_OPTIONS)[index];
                    this.cameras.main.fadeOut(800, 0, 0, 0);
                    this._controls.lockInput = true;
                });
            }

            this.#menuItems.push(menuItem);
            menuContainer.add([menuItem, description]);
        });

        // Animación de entrada del menú (como si emergiera de la tierra)
        menuContainer.setAlpha(0);
        menuContainer.setY(600);
        this.tweens.add({
            targets: menuContainer,
            alpha: 1,
            y: 280,
            duration: 800,
            ease: 'Back.easeOut',
            delay: 400
        });
    }

    #createRustySelectionGlow() {
        // Efecto de selección con apariencia de óxido brillante
        this.#selectionGlow = this.add.rectangle(420, 390, 330, 65, 0xcd7a32, 0);
        this.#selectionGlow.setStrokeStyle(3, 0xffaa66, 0.8);

        // Animación de pulso como fuego
        this.tweens.add({
            targets: this.#selectionGlow,
            alpha: 0.3,
            scaleX: 1.02,
            scaleY: 1.08,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.#updateSelectionPosition();
    }

    #updateSelectionPosition() {
        if (!this.#selectionGlow) return;

        const positions = [340, 440, 540];
        const index = Object.values(MAIN_MENU_OPTIONS).indexOf(this.#selectedMenuOptions);

        if (this.#selectedMenuOptions === MAIN_MENU_OPTIONS.CONTINUE && !this.#isContinueButtonEnabled) {
            return;
        }

        this.tweens.add({
            targets: this.#selectionGlow,
            x: 950,
            y: positions[index],
            duration: 200,
            ease: 'Power2'
        });
    }

    #startApocalypticAnimations() {
        // Animación de entrada con efecto de temblor
        this.cameras.main.setAlpha(0);
        this.cameras.main.shake(500, 0.01);

        this.tweens.add({
            targets: this.cameras.main,
            alpha: 1,
            duration: 1200,
            ease: 'Cubic.easeInOut'
        });

        // Hacer que el polvo aparezca gradualmente
        if (this.#dustContainer) {
            this.#dustContainer.setAlpha(0);
            this.tweens.add({
                targets: this.#dustContainer,
                alpha: 1,
                duration: 2000,
                delay: 500
            });
        }
    }

    #startEarthquakeEffect() {
        // Efecto de temblor ocasional para ambiente postapocalíptico
        this.time.addEvent({
            delay: 15000,
            callback: () => {
                if (!this._controls.isInputLocked) {
                    this.cameras.main.shake(400, 0.008);

                    // Hacer caer más polvo
                    for (let i = 0; i < 20; i++) {
                        const dust = this.add.circle(
                            Math.random() * this.scale.width,
                            -10,
                            Math.random() * 3 + 1,
                            0x6a4a2a,
                            0.5
                        );

                        this.tweens.add({
                            targets: dust,
                            y: this.scale.height + 20,
                            x: dust.x + (Math.random() - 0.5) * 50,
                            duration: 2000,
                            onComplete: () => dust.destroy()
                        });
                    }
                }
            },
            loop: true
        });
    }

    update() {
        super.update()

        if (this._controls.isInputLocked) {
            return
        }

        const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed()
        if (wasSpaceKeyPressed) {
            this.cameras.main.fadeOut(800, 0, 0, 0)
            this._controls.lockInput = true
            return
        }

        const selectedDirection = this._controls.getDirectionKeyPressedDown();

        if (selectedDirection !== DIRECTION.NONE) {
            this.#moveMenuSelectCursor(selectedDirection);
        }
    }

    #moveMenuSelectCursor(direction) {
        this.#updateSelectedMenuOptionFromInput(direction)
        this.#updateSelectionPosition();

        // Temblor al cambiar selección
        this.cameras.main.shake(80, 0.003);
    }

    /**
     * 
     * @param {import('../common/direction.js').Direction} direction 
     * @returns {void}
     */
    #updateSelectedMenuOptionFromInput(direction) {
        const options = Object.values(MAIN_MENU_OPTIONS);
        let currentIndex = options.indexOf(this.#selectedMenuOptions);

        switch (direction) {
            case DIRECTION.UP:
                if (currentIndex > 0) {
                    const newIndex = currentIndex - 1;
                    const newOption = options[newIndex];

                    if (newOption === MAIN_MENU_OPTIONS.CONTINUE && !this.#isContinueButtonEnabled) {
                        if (currentIndex > 1) {
                            this.#selectedMenuOptions = options[currentIndex - 2];
                        }
                        return;
                    }

                    this.#selectedMenuOptions = newOption;
                }
                break;

            case DIRECTION.DOWN:
                if (currentIndex < options.length - 1) {
                    const newIndex = currentIndex + 1;
                    const newOption = options[newIndex];

                    if (newOption === MAIN_MENU_OPTIONS.CONTINUE && !this.#isContinueButtonEnabled) {
                        if (currentIndex < options.length - 2) {
                            this.#selectedMenuOptions = options[currentIndex + 2];
                        }
                        return;
                    }

                    this.#selectedMenuOptions = newOption;
                }
                break;

            case DIRECTION.LEFT:
            case DIRECTION.RIGHT:
            case DIRECTION.NONE:
                break;

            default:
                exhaustiveGuard(direction)
        }
    }

    handleSceneCleanup() {
        super.handleSceneCleanup();

        if (this.#dustTimer) {
            this.#dustTimer.remove();
        }

        if (this.#dustContainer) {
            this.#dustContainer.destroy();
        }

        if (this.#radiationEffect) {
            this.#radiationEffect.destroy();
        }
    }
}