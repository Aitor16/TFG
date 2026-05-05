//Paquete global de phaser
import { BATTLE_ASSET_KEYS, CHARACTER_ASSET_KEYS, ENEMIES_BACKGROUND_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MAIN_BACKGROUND_ASSET_KEYS } from '../assets/asset-keys.js'
import { BattleMenu } from '../battle/ui/menu/battle-menu.js'
import Phaser from '../lib/phaser.js'
//Paquete de id's de escenas
import { SCENE_KEYS } from './scene-keys.js'
import { DIRECTION } from '../common/direction.js'
import { Background } from '../battle/background.js'
import { EnemyBattleMonster } from '../battle/monsters/enemy-battle-monster.js'
import { PlayerBattleMonster } from '../battle/monsters/player-battle-monster.js'
import { StateMachine } from '../utils/state-machine.js'
import { ATTACK_TARGET, AttackManager } from '../battle/attacks/attack-manager.js'
import { createSceneTransition } from '../utils/scene-transition.js'
import { Controls } from '../utils/controls.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js'
import { BATTLE_SCENE_OPTIONS } from '../common/options.js'
import { BaseScene } from './base-scene.js'
import { i18n } from '../utils/i18n.js'

//CONSTANTES DE ESTADO DE LA BATALLA
const BATTLE_STATES = Object.freeze({
    INTRO: 'INTRO',
    PRE_BATTLE_INFO: 'PRE_BATTLE_INFO',
    BRING_OUT_MONSTER: 'BRING_OUT_MONSTER',
    PLAYER_INPUT: 'PLAYER_INPUT',
    ENEMY_INPUT: 'ENEMY_INPUT',
    BATTLE: 'BATTLE',
    POST_ATTACK_CHECK: 'POST_ATTACK_CHECK',
    FINISHED: 'FINISHED',
    FLEE_ATTEMPT: 'FLEE_ATTEMPT',
    RECHECK: 'RECHECK',
})

//Exporta la clase PreloadScene donde se crea una clase escena heredando todas las funciones y propiedades de PhaserScenas
export class BattleScene extends BaseScene {
    /**@type {BattleMenu} */
    #battleMenu
    /**@type {EnemyBattleMonster} */
    #activeEnemyMonster
    /**@type {PlayerBattleMonster} */
    #activePlayerMonster
    /**@type {number}*/
    #activePlayerAttackIndex;
    /**@type {StateMachine} */
    #battleStateMachine
    /**@type {AttackManager} */
    #attackManager;
    /**@type {boolean} */
    #skipAnimations;
    /** @type {import('../utils/i18n.js').I18n} */
    #i18n;

    /**@type {Phaser.GameObjects.Graphics} */
    #rustOverlay;
    /**@type {Phaser.GameObjects.Container} */
    #dustContainer;
    /**@type {Phaser.GameObjects.Rectangle} */
    #vignetteEffect;
    /**@type {Phaser.Time.TimerEvent} */
    #dustTimer;
    /**@type {Phaser.GameObjects.Rectangle} */
    #sunnyWeatherOverlay;

    //Constructor de la escena principal con la KEY y log
    constructor() {
        super({
            key: SCENE_KEYS.BATTLE_SCENE,
            //active: true
        })
        this._musicKey = 'BATTLE';
        console.log(`[${BattleScene.name}: constructor] invoked`)
    }

    //Inicio de escena con log en consola
    init() {
        super.init()
        this.#activePlayerAttackIndex = -1;
        this.#i18n = i18n(this);
        const chosenBattleSceneOption = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS)
        if (chosenBattleSceneOption === undefined || chosenBattleSceneOption === BATTLE_SCENE_OPTIONS.ON) {
            this.#skipAnimations = false;
        } else {
            this.#skipAnimations = true
        }
        console.log('Battle-Scene iniciado')
    }

    //Crea la escena y los monstruos
    create() {
        super.create()
        //Log para ver que funciona
        console.log(`[${BattleScene.name}: create] invoked`)

        // Crear fondo postapocalíptico
        this.#createApocalypticBattleBackground();

        // Crear efectos de polvo y ceniza
        this.#createDustAndAsh();

        // Crear efecto de viñeta para dar sensación de peligro
        this.#createVignetteEffect();

        //Crear el fondo principal como objeto (ahora con temática apocalíptica)
        const background = new Background(this);
        background.showCity(); // Mantenemos la ciudad pero con overlay apocalíptico

        //Crea el monstruo enemigo con estilo más oscuro
        this.#activeEnemyMonster = new EnemyBattleMonster({
            scene: this,
            monsterDetails: {
                id: 2,
                monsterId: 2,
                name: ENEMIES_BACKGROUND_ASSET_KEYS.ZOMBIE,
                assetKey: ENEMIES_BACKGROUND_ASSET_KEYS.ZOMBIE,
                assetFrame: 0,
                currentHP: 25,
                maxHP: 25,
                attackIDs: [1],
                baseAttack: 5,
                baseAccuracy: 100,
                baseSpeed: 7,
                level: 5,
            },
            skipBattleAnimations: this.#skipAnimations,
        })

        //Crea el monstruo del jugador con efecto de desgaste
        this.#activePlayerMonster = new PlayerBattleMonster({
            scene: this,
            monsterDetails: dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY)[0],
            skipBattleAnimations: this.#skipAnimations,
        });

        // Aplicar filtro de desaturación a los monstruos para dar sensación apocalíptica
        this.#applyPostApocalypticFilter(this.#activeEnemyMonster);
        this.#applyPostApocalypticFilter(this.#activePlayerMonster);

        //Renderizar los paneles de informacion
        this.#battleMenu = new BattleMenu(this, this.#activePlayerMonster, this.#skipAnimations);
        this.#createBattleStateMachine();
        this.#attackManager = new AttackManager(this, this.#skipAnimations)

        // Crear efecto de clima de sol
        this.#createSunnyWeatherEffect();

        //Crea los cursores
        this._controls.lockInput = true;

        // Efecto de entrada con temblor
        this.cameras.main.shake(300, 0.008);
    }

    #createApocalypticBattleBackground() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Gradiente apocalíptico para el fondo
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x2a1a15, 0x3a2a1a, 0x2a1a15, 0x3a2a1a, 1);
        bgGraphics.fillRect(0, 0, width, height);

        // Textura de ruido para suciedad
        const noiseTexture = this.#createNoiseTexture();
        const noiseOverlay = this.add.image(0, 0, noiseTexture).setOrigin(0).setAlpha(0.25);
        noiseOverlay.setDisplaySize(width, height);

        // Siluetas de edificios destruidos al fondo
        const ruinsGraphics = this.add.graphics();
        ruinsGraphics.fillStyle(0x1a0f0a, 0.5);

        for (let i = 0; i < 12; i++) {
            const x = i * 110 + Math.random() * 40;
            const y = height - (Math.random() * 150 + 60);
            ruinsGraphics.fillRect(x, y, 45, height - y);

            // Grietas en los edificios
            ruinsGraphics.fillStyle(0x000000, 0.4);
            ruinsGraphics.fillRect(x + 15, y + 20, 4, (height - y) * 0.6);
        }

        // Efecto de niebla tóxica
        const fogGraphics = this.add.graphics();
        fogGraphics.fillStyle(0x6a4a2a, 0.2);
        fogGraphics.fillRect(0, 0, width, height);

        this.tweens.add({
            targets: fogGraphics,
            alpha: 0.3,
            duration: 3000,
            yoyo: true,
            repeat: -1
        });
    }

    #createNoiseTexture() {
        const textureKey = 'battle_noise_texture';

        if (!this.textures.exists(textureKey)) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            for (let i = 0; i < canvas.width; i++) {
                for (let j = 0; j < canvas.height; j++) {
                    const value = Math.random() * 100;
                    ctx.fillStyle = `rgba(${value + 50}, ${value + 30}, ${value + 20}, ${Math.random() * 0.3})`;
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

        // Polvo y ceniza que flotan en el campo de batalla
        for (let i = 0; i < 120; i++) {
            const dust = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 3 + 1,
                0x8b5a2b,
                Math.random() * 0.4 + 0.1
            );

            this.tweens.add({
                targets: dust,
                y: dust.y - (Math.random() * 200 + 80),
                x: dust.x + (Math.random() - 0.5) * 100,
                alpha: 0,
                duration: Math.random() * 12000 + 6000,
                repeat: -1,
                onComplete: () => {
                    dust.y = height + 30;
                    dust.x = Math.random() * width;
                    dust.setAlpha(Math.random() * 0.4 + 0.1);
                }
            });

            this.#dustContainer.add(dust);
        }

        // Partículas de sangre/óxido que caen
        for (let i = 0; i < 40; i++) {
            const blood = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 2 + 1,
                0x8b3a2a,
                Math.random() * 0.5 + 0.2
            );

            this.tweens.add({
                targets: blood,
                y: height + 50,
                duration: Math.random() * 8000 + 4000,
                repeat: -1,
                onComplete: () => {
                    blood.y = -10;
                    blood.x = Math.random() * width;
                }
            });

            this.#dustContainer.add(blood);
        }
    }

    #createVignetteEffect() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.#vignetteEffect = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        this.#vignetteEffect.setOrigin(0);

        // Crear máscara de viñeta
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0xffffff, 1);
        maskGraphics.fillRect(0, 0, width, height);

        // Degradado radial para la viñeta
        const radius = Math.min(width, height) * 0.6;
        maskGraphics.fillStyle(0x000000, 1);
        maskGraphics.fillCircle(width / 2, height / 2, radius);

        // Aplicar viñeta pulsante
        this.tweens.add({
            targets: this.#vignetteEffect,
            alpha: 0.4,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    #createSunnyWeatherEffect() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Overlay amarillo para el sol - Más notable
        this.#sunnyWeatherOverlay = this.add.rectangle(0, 0, width, height, 0xffcc00, 0.25);
        this.#sunnyWeatherOverlay.setOrigin(0);
        this.#sunnyWeatherOverlay.setDepth(100); // Encima de los monstruos para que sea más notable
        this.#sunnyWeatherOverlay.setAlpha(0);
    }

    #flashSunnyWeather(callback) {
        this.tweens.add({
            targets: this.#sunnyWeatherOverlay,
            alpha: 0.6,
            duration: 300,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (callback) callback();
            }
        });
    }

    #applyPostApocalypticFilter(gameObject) {
        // Aplicar tintes oscuros a los monstruos para dar sensación de desgaste
        if (gameObject && gameObject.setTint) {
            gameObject.setTint(0xcd7a32);
        }
    }

    //ACTUALIZACION DE FRAMES
    update() {
        super.update()
        this.#battleStateMachine.update()

        if (this._controls.isInputLocked) {
            return
        }

        //Variable de Tecla pulsada
        const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();

        //limit input based on the current battle state we are in
        //if we are not in the right battle state, return early and do not process input
        if (wasSpaceKeyPressed && (
            this.#battleStateMachine.currentStateName === BATTLE_STATES.PRE_BATTLE_INFO ||
            this.#battleStateMachine.currentStateName === BATTLE_STATES.FLEE_ATTEMPT ||
            (this.#battleStateMachine.currentStateName === BATTLE_STATES.BATTLE && this.#battleMenu.isWaitingForInput) ||
            (this.#battleStateMachine.currentStateName === BATTLE_STATES.POST_ATTACK_CHECK && this.#battleMenu.isWaitingForInput)
        )) {
            this.#battleMenu.handlePlayerInput('OK');
            return;
        }

        if (this.#battleStateMachine.currentStateName !== BATTLE_STATES.PLAYER_INPUT) {
            return;
        }

        if (wasSpaceKeyPressed) {
            this.#battleMenu.handlePlayerInput('OK');

            if (this.#battleMenu.wasItemUsed) {
                this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT)
                return;
            }


            if (this.#battleMenu.wasFleeSelected) {
                console.log('HUIDA DETECTADA EN BATTLE SCENE');
                this.#battleStateMachine.setState(BATTLE_STATES.FLEE_ATTEMPT)
                return;
            }

            //check if the player selected an attack, and update display text
            if (this.#battleMenu.selectedAttack === undefined) {
                return;
            }

            this.#activePlayerAttackIndex = this.#battleMenu.selectedAttack

            if (!this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex]) {
                return;
            }

            console.log(`Player selected the following move: ${this.#battleMenu.selectedAttack}`)

            this.#battleMenu.hideCharacterAttackSubmenu()
            this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT)
        }

        if (this._controls.wasBackKeyPressed()) {
            this.#battleMenu.handlePlayerInput('CANCEL');
            return;
        }

        const selectedDirection = this._controls.getDirectionKeyJustPressed();

        if (selectedDirection !== DIRECTION.NONE) {
            this.#battleMenu.handlePlayerInput(selectedDirection);
        }
    }

    handleSceneResume(sys, data) {
        super.handleSceneResume(sys, data);
        console.log(`[${BattleScene.name}:handleSceneResume] invoked, data: ${JSON.stringify(data)}`);
        if (data && data.monsterSwitched) {
            this.#handleMonsterSwitch();
        }
    }

    //EJECUTA UN ATAQUE DE UN JUGADOR
    #playerAttack(callback) {
        if (this.#activePlayerAttackIndex === -1) {
            if (callback) callback();
            return;
        }

        const attack = this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex];
        console.log(`JUGADOR VA A USAR: ${attack.name}`);

        // Comprobar precisión
        const hitChance = this.#activePlayerMonster.currentAccuracy;
        const randomRoll = Math.random() * 100;
        const isHit = randomRoll < hitChance;

        this.#battleMenu.updateInfoPaneMessageNoInputRequired(
            this.#i18n.t('BATTLE.PLAYER_USED_ATTACK', {
                monster: this.#activePlayerMonster.name,
                attack: this.#i18n.t(`ATTACKS.${attack.id}`),
            }),
            () => {
                this.time.delayedCall(500, () => {
                    if (!isHit) {
                        // Falló el ataque
                        this.#battleMenu.updateInfoPaneMessagesWaitForInput(
                            [this.#i18n.t('BATTLE.ATTACK_MISSED', { monster: this.#activePlayerMonster.name })],
                            () => {
                                if (callback) callback();
                            }
                        );
                        return;
                    }

                    this.#attackManager.playAttackAnimation(attack.animationName, ATTACK_TARGET.ENEMY, () => {
                        // Aplicar daño si tiene
                        if (attack.damage > 0) {
                            this.#activeEnemyMonster.playTakeDamageAnimation(() => {
                                this.#activeEnemyMonster.takeDamage(attack.damage, () => {
                                    // Efecto de sangre/óxido al dañar
                                    this.#createDamageEffect(this.#activeEnemyMonster);
                                    this.#handleAttackEffect(attack, this.#activeEnemyMonster, callback);
                                })
                            })
                        } else {
                            // Si no tiene daño, procesar efecto directamente
                            this.#handleAttackEffect(attack, this.#activeEnemyMonster, callback);
                        }
                    })
                })
            })
    }

    #handleAttackEffect(attack, target, callback) {
        if (attack.effect === 'LOWER_ACCURACY_15') {
            target.reduceAccuracy(15);
            this.#battleMenu.updateInfoPaneMessagesWaitForInput(
                [this.#i18n.t('BATTLE.ACCURACY_LOWERED', { monster: target.name })],
                () => {
                    if (callback) callback();
                }
            );
        } else {
            if (callback) callback();
        }
    }

    #createDamageEffect(target) {
        // Crear efecto de salpicadura de sangre/óxido
        const effectGraphics = this.add.graphics();
        effectGraphics.fillStyle(0x8b3a2a, 0.8);

        for (let i = 0; i < 15; i++) {
            const x = target.x + (Math.random() - 0.5) * 50;
            const y = target.y + (Math.random() - 0.5) * 50;
            const size = Math.random() * 8 + 2;

            effectGraphics.fillCircle(x, y, size);

            this.tweens.add({
                targets: effectGraphics,
                alpha: 0,
                scale: 1.5,
                duration: 500,
                onComplete: () => effectGraphics.destroy()
            });
        }
    }

    //EJECUTA UN ATAQUE DE UN ENEMIGO
    #enemyAttack(callback) {
        if (this.#activeEnemyMonster.isFainted) {
            console.log('NO ATACAR A UN ENEMIGO MUERTO')
            if (callback) callback();
            return;
        }

        const attack = this.#activeEnemyMonster.attacks[0];

        // Comprobar precisión
        const hitChance = this.#activeEnemyMonster.currentAccuracy;
        const randomRoll = Math.random() * 100;
        const isHit = randomRoll < hitChance;

        const attackMsg = this.#i18n.t('BATTLE.ENEMY_USED_ATTACK', {
            monster: this.#activeEnemyMonster.name,
            attack: this.#i18n.t(`ATTACKS.${attack.id}`),
        });
        this.#battleMenu.updateInfoPaneMessageNoInputRequired(attackMsg, () => {
            this.time.delayedCall(1200, () => {
                if (!isHit) {
                    // Falló el ataque
                    this.#battleMenu.updateInfoPaneMessagesWaitForInput(
                        [this.#i18n.t('BATTLE.ATTACK_MISSED', { monster: this.#activeEnemyMonster.name })],
                        () => {
                            if (callback) callback();
                        }
                    );
                    return;
                }

                this.#attackManager.playAttackAnimation(attack.animationName, ATTACK_TARGET.PLAYER, () => {
                    if (attack.damage > 0) {
                        this.#activePlayerMonster.playTakeDamageAnimation(() => {
                            this.#activePlayerMonster.takeDamage(attack.damage, () => {
                                // Efecto de daño al jugador
                                this.#createDamageEffect(this.#activePlayerMonster);

                                // Sincronizar la vida del jugador con el DataManager después del daño
                                const party = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY);
                                if (party && party[0]) {
                                    party[0].currentHP = this.#activePlayerMonster.currentHP;
                                    dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY, party);
                                }

                                this.#handleAttackEffect(attack, this.#activePlayerMonster, callback);
                            })
                        })
                    } else {
                        this.#handleAttackEffect(attack, this.#activePlayerMonster, callback);
                    }
                })
            })
        })
    }

    //CHECKEA DESPUES DE UNA BATALLA SI ALGUIEN HA MUERTO
    #postBattleSequenceCheck() {
        console.log('COMPROBAR SI ALGUIEN A MUERTO')
        if (this.#activeEnemyMonster.isFainted) {
            console.log('ENEMIGO MUERTO')
            this.#activeEnemyMonster.playDeathAnimation(() => {
                // Efecto de desintegración para el enemigo
                this.#createDeathEffect(this.#activeEnemyMonster);

                this.#battleMenu.updateInfoPaneMessageNoInputRequired(
                    this.#i18n.t('BATTLE.ENEMY_FAINTED', { monster: this.#activeEnemyMonster.name }),
                    () => {
                        // Obtener pocion tras combate
                        dataManager.addItem(1, 1);
                        const potionName = this.#i18n.t('ITEMS.1.NAME');
                        this.#battleMenu.updateInfoPaneMessagesWaitForInput(
                            [this.#i18n.t('BATTLE.GOT_ITEM', { itemName: potionName })],
                            () => {
                                this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
                            }
                        )
                    }
                )
            })
            return
        }

        if (this.#activePlayerMonster.isFainted) {
            this.#battleMenu.updateInfoPaneMessagesWaitForInput(
                [this.#i18n.t('BATTLE.PLAYER_FAINTED', { monster: this.#activePlayerMonster.name })],
                () => {
                    this.#activePlayerMonster.playDeathAnimation(() => {
                        this.#createDeathEffect(this.#activePlayerMonster);

                        // Verificar si al jugador le quedan más monstruos vivos
                        const party = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY);
                        const hasLivingMonster = party.some(monster => monster.currentHP > 0);

                        if (hasLivingMonster) {
                            // Si tiene más monstruos, forzar el cambio sin perder el turno
                            this.#battleMenu.hideMainBattleMenu();
                            this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, {
                                previousSceneName: SCENE_KEYS.BATTLE_SCENE,
                                isForcedSwitch: true
                            });
                            this.scene.pause();
                        } else {
                            // Si no tiene más monstruos, mostrar mensaje y terminar la batalla
                            this.#battleMenu.updateInfoPaneMessageNoInputRequired(
                                this.#i18n.t('BATTLE.NO_MORE_MONSTERS'),
                                () => {
                                    this.time.delayedCall(1800, () => {
                                        this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
                                    });
                                }
                            );
                        }
                    })
                }
            )
            return
        }

        // Daño de clima (Sol) al final del turno
        const enemyWeatherDamage = Math.round(this.#activeEnemyMonster.maxHP / 8);
        const playerWeatherDamage = Math.round(this.#activePlayerMonster.maxHP / 8);

        this.#battleMenu.updateInfoPaneMessagesWaitForInput(
            [this.#i18n.t('BATTLE.SUNNY_WEATHER_DAMAGE')],
            () => {
                this.time.delayedCall(500, () => {
                    // Flash visual sincronizado con el daño
                    this.#flashSunnyWeather(() => {
                        // Daño al enemigo
                        this.#activeEnemyMonster.playTakeDamageAnimation(() => {
                            this.#activeEnemyMonster.takeDamage(enemyWeatherDamage, () => {
                                // Daño al jugador
                                this.#activePlayerMonster.playTakeDamageAnimation(() => {
                                    this.#activePlayerMonster.takeDamage(playerWeatherDamage, () => {
                                        if (this.#activeEnemyMonster.isFainted || this.#activePlayerMonster.isFainted) {
                                            this.#battleStateMachine.setState(BATTLE_STATES.RECHECK);
                                        } else {
                                            // Sincronizar la vida del jugador con el DataManager después del daño de clima
                                            const party = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY);
                                            if (party && party[0]) {
                                                party[0].currentHP = this.#activePlayerMonster.currentHP;
                                                dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY, party);
                                            }
                                            this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            }
        );
    }

    #createDeathEffect(target) {
        // Efecto de desintegración para monstruos derrotados
        const deathEffect = this.add.sprite(target.x, target.y, '');

        // Crear partículas de desintegración
        for (let i = 0; i < 30; i++) {
            const particle = this.add.circle(
                target.x + (Math.random() - 0.5) * 60,
                target.y + (Math.random() - 0.5) * 60,
                Math.random() * 4 + 1,
                0x6a3a2a,
                0.8
            );

            this.tweens.add({
                targets: particle,
                y: particle.y - (Math.random() * 100 + 50),
                x: particle.x + (Math.random() - 0.5) * 80,
                alpha: 0,
                scale: 0,
                duration: 1000,
                onComplete: () => particle.destroy()
            });
        }
    }

    #handleMonsterSwitch() {
        this._controls.lockInput = true;
        this.#battleMenu.hideMainBattleMenu();
        this.#battleMenu.hideCharacterAttackSubmenu();

        const selectedMonsterIndex = this.#battleMenu.selectedMonsterIndex;
        const party = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY);

        const [selectedMonster] = party.splice(selectedMonsterIndex, 1);
        party.unshift(selectedMonster);
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY, party);

        this.#battleMenu.updateInfoPaneMessageNoInputRequired(
            this.#i18n.t('BATTLE.COME_BACK_MONSTER', { monster: this.#activePlayerMonster.name }),
            () => {
                this.time.delayedCall(500, () => {
                    const isForcedSwitch = this.#activePlayerMonster.isFainted;
                    this.#activePlayerMonster.destroy();

                    this.#activePlayerMonster = new PlayerBattleMonster({
                        scene: this,
                        monsterDetails: party[0],
                        skipBattleAnimations: this.#skipAnimations,
                    });
                    this.#applyPostApocalypticFilter(this.#activePlayerMonster);

                    this.#battleMenu.updateActiveMonster(this.#activePlayerMonster);

                    this.#activePlayerMonster.playMonsterAppearAnimation(() => {
                        this.#activePlayerMonster.playMonsterHealthBarAppearAnimation(() => undefined);
                        const goMsg = this.#i18n.t('BATTLE.GO_MONSTER', { monster: this.#activePlayerMonster.name });
                        this.#battleMenu.updateInfoPaneMessageNoInputRequired(goMsg, () => {
                            this.time.delayedCall(1200, () => {
                                this._controls.lockInput = false;
                                this.#battleMenu.clearMonsterSwitched();
                                // Si el cambio fue por debilitamiento, el jugador no pierde el turno
                                this.#battleStateMachine.setState(isForcedSwitch ? BATTLE_STATES.PLAYER_INPUT : BATTLE_STATES.ENEMY_INPUT);
                            });
                        });
                    });
                });
            }
        );
    }

    //EFECTO DE TRANSICION EN ESCENAS
    #transitionToNextScene() {
        console.log('PROCEDIENDO A HACER LA ANIMACION DE FINAL DE BATALLA')
        console.log('===================================')

        // Sincronizar la vida del monstruo con el DataManager antes de salir
        const party = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY);
        if (party && party[0]) {
            party[0].currentHP = this.#activePlayerMonster.currentHP;
            dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY, party);
        }

        // Efecto de fade out con temblor final
        this.cameras.main.shake(200, 0.01);

        console.log('Iniciando fade out hacia WorldScene...');
        this.time.delayedCall(300, () => {
            this.cameras.main.fadeOut(1000, 0, 0, 0); // Reducido a 1s para probar
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                console.log('Fade out completado, iniciando WorldScene');
                this.scene.start(SCENE_KEYS.WORLD_SCENE);
            });
        });
    }

    //CREA LA MAQUINA DE ESTADOS
    #createBattleStateMachine() {
        console.log('CREANDO MAQUINA DE ESTADOS')
        this.#battleStateMachine = new StateMachine('battle', this);
        this.#battleStateMachine.addState({
            name: BATTLE_STATES.INTRO,
            onEnter: () => {
                console.log('ESTADO DE INTRO')
                // wait for any scene setup and transitions to complete
                createSceneTransition(this, {
                    skipSceneTransition: this.#skipAnimations,
                    callback: () => {
                        this.#battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO)
                    }
                })
            }
        })

        this.#battleStateMachine.addState({
            name: BATTLE_STATES.PRE_BATTLE_INFO,
            onEnter: () => {
                console.log('ESTADO DE INFORMACION ANTES DEL COMBATE')
                //wait for enemy monster to appear on the screen and notify player about the wild monster
                this.#activeEnemyMonster.playMonsterAppearAnimation(() => {
                    this.#activeEnemyMonster.playMonsterHealthBarAppearAnimation(() => undefined)
                    this._controls.lockInput = false;

                    // Mensaje más dramático para batalla postapocalíptica
                    const appearMsg = this.#i18n.t('BATTLE.WILD_MONSTER_APPEARED', { monster: this.#activeEnemyMonster.name });
                    this.#battleMenu.updateInfoPaneMessagesWaitForInput([appearMsg],
                        () => {
                            //wait fot text animation to complete and move to next state
                            this.#battleStateMachine.setState(BATTLE_STATES.BRING_OUT_MONSTER)
                        },
                    )
                })
            }
        })

        this.#battleStateMachine.addState({
            name: BATTLE_STATES.BRING_OUT_MONSTER,
            onEnter: () => {
                this.#activePlayerMonster.playMonsterAppearAnimation(() => {
                    this.#activePlayerMonster.playMonsterHealthBarAppearAnimation(() => undefined)
                    const goMsg = this.#i18n.t('BATTLE.GO_MONSTER', { monster: this.#activePlayerMonster.name });
                    this.#battleMenu.updateInfoPaneMessageNoInputRequired(goMsg, () => {
                        this.time.delayedCall(1200, () => {
                            this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT)
                        })
                    })
                })
            }
        })

        this.#battleStateMachine.addState({
            name: BATTLE_STATES.PLAYER_INPUT,
            onEnter: () => {
                //CAMBIANDO AL ESTADO DE PLAYER INPUT
                this.#battleMenu.showMainBattleMenu();
            }
        })

        this.#battleStateMachine.addState({
            name: BATTLE_STATES.BATTLE,
            onEnter: () => {
                //general battle flow
                // show attack used, brief pause
                // then play attack animation, brief pause
                //then play damage animation, brief pause
                //then play health bar animation, brief pause
                //then repeat the steps above for the other monster

                if (this.#battleMenu.wasItemUsed || this.#battleMenu.wasMonsterSwitched) {
                    if (this.#battleMenu.wasItemUsed) {
                        this.#activePlayerMonster.updateMonsterHealth(dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTER_IN_PARTY)[0].currentHP)
                        this.#battleMenu.resetHasUsedItem();
                    }
                    this.time.delayedCall(500, () => {
                        this.#enemyAttack(() => {
                            this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
                        });
                    })
                    return;
                }

                // Determinar el orden de ataque basado en la velocidad
                const playerSpeed = this.#activePlayerMonster.baseSpeed;
                const enemySpeed = this.#activeEnemyMonster.baseSpeed;

                if (playerSpeed >= enemySpeed) {
                    // Jugador ataca primero
                    this.#playerAttack(() => {
                        if (this.#activeEnemyMonster.isFainted) {
                            this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
                        } else {
                            this.#enemyAttack(() => {
                                this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
                            });
                        }
                    });
                } else {
                    // Enemigo ataca primero
                    this.#enemyAttack(() => {
                        if (this.#activePlayerMonster.isFainted) {
                            this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
                        } else {
                            this.#playerAttack(() => {
                                this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
                            });
                        }
                    });
                }
            }
        })

        this.#battleStateMachine.addState({
            name: BATTLE_STATES.POST_ATTACK_CHECK,
            onEnter: () => {
                console.log('ENTRANDO EN EL ESTADO DE CHECK')
                this.#postBattleSequenceCheck();
            }
        })

        this.#battleStateMachine.addState({
            name: BATTLE_STATES.ENEMY_INPUT,
            onEnter: () => {
                //TODO
                //pick a random move for the enemy monster, and in the future implement some type of AI behaviour
                this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
            }
        })

        this.#battleStateMachine.addState({
            name: BATTLE_STATES.FINISHED,
            onEnter: () => {
                console.log('ENTRANDO EN EL ESTADO DE ACABADO')
                this.#transitionToNextScene()
            }
        })
        this.#battleStateMachine.addState({
            name: BATTLE_STATES.FLEE_ATTEMPT,
            onEnter: () => {
                const fleeMsg = this.#i18n.t('BATTLE.FLEE_SUCCESS');
                this.#battleMenu.updateInfoPaneMessagesWaitForInput([fleeMsg], () => {
                    this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
                })
            }
        })

        this.#battleStateMachine.addState({
            name: BATTLE_STATES.RECHECK,
            onEnter: () => {
                this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
            }
        })

        //start the state machine
        this.#battleStateMachine.setState('INTRO')
    }

    handleSceneCleanup() {
        super.handleSceneCleanup();

        if (this.#dustTimer) {
            this.#dustTimer.remove();
        }

        if (this.#dustContainer) {
            this.#dustContainer.destroy();
        }

        if (this.#vignetteEffect) {
            this.#vignetteEffect.destroy();
        }

        if (this.#sunnyWeatherOverlay) {
            this.#sunnyWeatherOverlay.destroy();
        }
    }
}