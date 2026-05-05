//Paquete global de phaser
import { ATTACK_ASSET_KEYS, BATTLE_ASSET_KEYS, CHARACTER_ASSET_KEYS, DATA_ASSET_KEYS, ENEMIES_BACKGROUND_ASSET_KEYS, ENTITIES_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, INVENTORY_ASSET_KEYS, MAIN_BACKGROUND_ASSET_KEYS, MONSTER_PARTY_ASSET_KEYS, TITLE_ASSET_KEYS, UI_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
//Paquete de id's de escenas
import { SCENE_KEYS } from './scene-keys.js'
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js'
import { WebFontFileLoader } from '../assets/web-font-file-loader.js'
import { DataUtils } from '../utils/data-utils.js'
import { dataManager } from '../utils/data-manager.js'
import { BaseScene } from './base-scene.js'
import { NPC_DIALOG_BACKGROUNDS } from '../config.js'

//Exporta la clase PreloadScene donde se crea una clase escena heredando todas las funciones y propiedades de PhaserScenas
export class PreloadScene extends BaseScene {
    constructor() {
        super({
            key: SCENE_KEYS.PRELOAD_SCENE,
            //active: true
        })
        console.log(SCENE_KEYS.PRELOAD_SCENE, PreloadScene)
    }

    init() {
        console.log('init')
    }

    preload() {
        super.preload()
        console.log(`[${PreloadScene.name}: preload] invoked`)
        const backgroundPostFinemPath = 'assets/images/post-finem/images-backgrounds'
        const npcPostFinemPath = 'assets/images/post-finem/npc'
        const uiPostFinemPath = 'assets/images/post-finem/ui'
        const monsterTamerPath = 'assets/images/monster-tamer/'
        const pimenAssetPath = 'assets/images/pimen'
        const axulArtAssetPath = 'assets/images/axulart'
        const parrabellumGamesAssetPath = 'assets/images/parabellum-games'
        const kenneyAssetPath = 'assets/images/kenneys-assets'
        const dialogAssetPath = 'assets/images/dialog'
        const attackAssetPath = 'assets/images/attacks'

        //npc dialog background
        this.load.image(NPC_DIALOG_BACKGROUNDS.npc,
            `${dialogAssetPath}/dialog-npc1.png`
        )
        this.load.image(NPC_DIALOG_BACKGROUNDS.npc2,
            `${dialogAssetPath}/dialog-npc2.png`
        )

        //BATTLE BACKGROUNDS
        this.load.image(MAIN_BACKGROUND_ASSET_KEYS.CITY,
            `${backgroundPostFinemPath}/main-background.png`
        )

        //HEALTH BAR ASSET
        this.load.image(BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND,
            `${uiPostFinemPath}/healthContainer.png`
        )
        this.load.image(BATTLE_ASSET_KEYS.MOSNTER_PARTY_BACKGROUND,
            `${uiPostFinemPath}/monsterPartyOptionBackground.png`
        )
        this.load.image(HEALTH_BAR_ASSET_KEYS.RIGHT_CAP,
            `${uiPostFinemPath}/rightBar.png`
        )
        this.load.image(HEALTH_BAR_ASSET_KEYS.LEFT_CAP,
            `${uiPostFinemPath}/leftBar.png`
        )
        this.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE,
            `${uiPostFinemPath}/middleBar.png`
        ),
            this.load.image(HEALTH_BAR_ASSET_KEYS.RIGHT_CAP_SHADOW,
                `${uiPostFinemPath}/rightBarShadow.png`
            )
        this.load.image(HEALTH_BAR_ASSET_KEYS.LEFT_CAP_SHADOW,
            `${uiPostFinemPath}/leftBarShadow.png`
        )
        this.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE_SHADOW,
            `${uiPostFinemPath}/middleBarShadow.png`
        )


        //ENEMY
        this.load.image(
            ENEMIES_BACKGROUND_ASSET_KEYS.ZOMBIE,
            `${npcPostFinemPath}/zombie.png`
        )

        //CHARACTER
        this.load.image(
            CHARACTER_ASSET_KEYS.SOLDIER,
            `${npcPostFinemPath}/soldier.png`
        )
        this.load.image(
            CHARACTER_ASSET_KEYS.PERROZ,
            `${npcPostFinemPath}/perroZ.png`
        )

        //CURSOR
        this.load.image(
            UI_ASSET_KEYS.CURSOR,
            `${uiPostFinemPath}/cursor.png`
        )
        //WALKIE
        this.load.image(
            UI_ASSET_KEYS.MENU_WALKIE,
            `${monsterTamerPath}/map/walkie.png`
        )
        this.load.image(
            UI_ASSET_KEYS.CURSOR_WHITE,
            `${uiPostFinemPath}/cursor_white.png`
        )
        this.load.image(
            UI_ASSET_KEYS.MENU_BACKGROUND,
            `${kenneyAssetPath}/ui-space-expansion/glassPanel.png`
        )
        this.load.image(
            UI_ASSET_KEYS.MENU_BACKGROUND_PURPLE,
            `${kenneyAssetPath}/ui-space-expansion/glassPanel_purple.png`
        )
        this.load.image(
            UI_ASSET_KEYS.MENU_BACKGROUND_GREEN,
            `${kenneyAssetPath}/ui-space-expansion/glassPanel_green.png`
        )
        this.load.image(
            UI_ASSET_KEYS.BLUE_BUTTON,
            `${kenneyAssetPath}/ui-pack/blue_button01.png`
        )
        this.load.image(
            UI_ASSET_KEYS.BLUE_BUTTON_SELECTED,
            `${kenneyAssetPath}/ui-pack/blue_button00.png`
        )

        //LOAD JSON DATA
        this.load.json(DATA_ASSET_KEYS.ATTACKS, '/assets/data/attacks.json')
        this.load.json(DATA_ASSET_KEYS.ANIMATIONS, '/assets/data/animations.json')
        this.load.json(DATA_ASSET_KEYS.ITEMS, '/assets/data/items.json')
        this.load.json(DATA_ASSET_KEYS.I18N_EN, '/assets/data/i18n/en.json')
        this.load.json(DATA_ASSET_KEYS.I18N_ES, '/assets/data/i18n/es.json')


        // load custom fonts
        this.load.addFile(new WebFontFileLoader(this.load, [KENNEY_FUTURE_NARROW_FONT_NAME]))

        //load attack assets
        this.load.spritesheet(ATTACK_ASSET_KEYS.GRENADE, `${pimenAssetPath}/grenade/explosion.png`, {
            frameWidth: 48,
            frameHeight: 48
        })
        this.load.spritesheet(ATTACK_ASSET_KEYS.SLASH, `${pimenAssetPath}/heavySlash/slash.png`, {
            frameWidth: 128,
            frameHeight: 128
        })
        this.load.spritesheet(ATTACK_ASSET_KEYS.BITE, `${attackAssetPath}/Bite.png`, {
            frameWidth: 128,
            frameHeight: 128
        })
        this.load.spritesheet(ATTACK_ASSET_KEYS.SMOKEBOMB, `${pimenAssetPath}/smokebomb/smokeGrenade.png`, {
            frameWidth: 724,
            frameHeight: 724
        })

        //load world assets
        this.load.image(
            WORLD_ASSET_KEYS.WORLD_BACKGROUND,
            `${monsterTamerPath}/map/level_background.png`
        )
        this.load.tilemapTiledJSON(
            WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL,
            `assets/data/level.json`
        )
        this.load.image(
            WORLD_ASSET_KEYS.WORLD_COLLISION,
            `${monsterTamerPath}/map/collision.png`
        )
        this.load.image(
            WORLD_ASSET_KEYS.WORLD_FOREGROUND,
            `${monsterTamerPath}/map/level_foreground.png`
        )
        this.load.image(
            WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE,
            `${monsterTamerPath}/map/encounter.png`
        )

        //load character images
        this.load.spritesheet(ENTITIES_ASSET_KEYS.PLAYER, `${axulArtAssetPath}/character/custom.png`, {
            frameWidth: 64,
            frameHeight: 88
        })

        this.load.spritesheet(ENTITIES_ASSET_KEYS.NPC, `${parrabellumGamesAssetPath}/characters.png`, {
            frameWidth: 16,
            frameHeight: 16
        })

        this.load.spritesheet(ENTITIES_ASSET_KEYS.NPC_WALKING, `${npcPostFinemPath}/walking-npc.png`, {
            frameWidth: 64,
            frameHeight: 64
        })

        this.load.spritesheet(ENTITIES_ASSET_KEYS.NPC_DOWN, `${npcPostFinemPath}/npc-down.png`, {
            frameWidth: 64,
            frameHeight: 64
        })

        // ui components for title
        this.load.image(
            TITLE_ASSET_KEYS.BACKGROUND,
            `${monsterTamerPath}/ui/title/menu.png`
        )
        this.load.image(
            TITLE_ASSET_KEYS.PANEL,
            `${monsterTamerPath}/ui/title/title_background.png`
        )
        this.load.image(
            TITLE_ASSET_KEYS.TITLE,
            `${monsterTamerPath}/ui/title/title_text.png`
        )


        //**
        // ==========================================
        //            ASSET DEL MONSTER PARTY      ||
        // ==========================================
        // */
        this.load.image(MONSTER_PARTY_ASSET_KEYS.PARTY_BACKGROUND, `${monsterTamerPath}/ui/monster-party/background.png`)
        this.load.image(MONSTER_PARTY_ASSET_KEYS.MONSTER_DETAILS_BACKGROUND, `${monsterTamerPath}/ui/monster-party/monster-details-background.png`)

        //**
        // ==========================================
        //               ASSET DEL INVENTARIO      ||
        // ==========================================
        // */
        this.load.image(INVENTORY_ASSET_KEYS.INVENTORY_BACKGROUND, `${monsterTamerPath}/ui/inventory/inventario.png`)
        //this.load.image(INVENTORY_ASSET_KEYS.INVENTORY_BAG, `${monsterTamerPath}/ui/inventory/bag.png`)

        // AUDIO
        this.load.audio('TITLE', 'assets/audio/Titulo.mp3');
        this.load.audio('BATTLE', 'assets/audio/Battle.mp3');
        this.load.audio('WORLD', 'assets/audio/World.mp3');
        this.load.audio('OPTIONS', 'assets/audio/Opciones.mp3');
    }

    async create() {
        super.create()
        console.log(`[${PreloadScene.name}: create] invoked`)
        this.#createAnimation()
        console.log(`[${PreloadScene.name}:create] starting data load`);
        await dataManager.loadData();
        console.log(`[${PreloadScene.name}:create] data loaded, starting title scene`);
        this.scene.start(SCENE_KEYS.BATTLE_SCENE)
    }

    #createAnimation() {
        const animations = DataUtils.getAnimations(this)
        animations.forEach((animation) => {
            const frames = animation.frames ? this.anims.generateFrameNumbers(animation.assetKey, { frames: animation.frames }) : this.anims.generateFrameNumbers(animation.assetKey)
            this.anims.create({
                key: animation.key,
                frames: frames,
                frameRate: animation.frameRate,
                repeat: animation.repeat,
                delay: animation.delay,
                yoyo: animation.yoyo
            })
        })


    }
}