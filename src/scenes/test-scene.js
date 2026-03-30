import Phaser from '../lib/phaser.js';
import TweakPane from '../lib/tweakpane.js';
import { Background } from '../battle/background.js';
import { ATTACK_KEYS } from '../battle/attacks/attack-key.js';
import { Slash } from '../battle/attacks/slash.js';
import { CHARACTER_ASSET_KEYS, ENEMIES_BACKGROUND_ASSET_KEYS } from '../assets/asset-keys.js';
import { SCENE_KEYS } from './scene-keys.js';
import { makeDraggable } from '../utils/draggable.js';
import { Grenade } from '../battle/attacks/grenade.js';

export class TestScene extends Phaser.Scene {
  /** @type {import('../battle/attacks/attack-key.js').AttackKeys} */
  #selectedAttack;
  /** @type {Grenade} */
  #grenadeAttack;
  /** @type {Slash} */
  #slashAttack;
  /** @type {Phaser.GameObjects.Image} */
  #playerMonster;
  /** @type {Phaser.GameObjects.Image} */
  #enemyMonster;

  constructor() {
    super({ key: SCENE_KEYS.TEST_SCENE });
  }

  /**
   * @returns {void}
   */
  init() {
    this.#selectedAttack = ATTACK_KEYS.SLASH;
  }

  /**
   * @returns {void}
   */
  create() {
    const background = new Background(this);
    background.showCity();

    this.#playerMonster = this.add.image(256, 316, CHARACTER_ASSET_KEYS.SOLDIER, 0).setFlipX(true);
    this.#enemyMonster = this.add.image(768, 144, ENEMIES_BACKGROUND_ASSET_KEYS.ZOMBIE, 0).setFlipX(false);
    makeDraggable(this.#enemyMonster, true);

    this.#grenadeAttack = new Grenade(this, { x: 256, y: 344 });
    this.#slashAttack = new Slash(this, { x: 745, y: 140 });

    this.#addDataGui();
  }

  /**
   * @returns {void}
   */
  #addDataGui() {
    const pane = new TweakPane.Pane();

    const f1 = pane.addFolder({
      title: 'Monster',
      expanded: true,

    })
    
    const playerMonsterFolder = f1.addFolder({
      title: 'Player',
      expanded: true,
    })

    playerMonsterFolder.addBinding(this.#playerMonster, 'x', {
      min: 0,
      max: 1920,
      step: 100
    })
    playerMonsterFolder.addBinding(this.#playerMonster, 'y', {
      min: 0,
      max: 1080,
      step: 100
    })

    const enemyMonsterFolder = f1.addFolder({
      title: 'Enemy',
      expanded: true,
    })

    enemyMonsterFolder.addBinding(this.#enemyMonster, 'x', {
      readonly: true
    })
    enemyMonsterFolder.addBinding(this.#enemyMonster, 'y', {
      readonly: true
    })


    const f2 = pane.addFolder({
      title: 'Attacks',
      expanded: true
    })


    const f2Params = {
      attack: this.#selectedAttack,
      x: 745,
      y: 120
    }

    f2.addBinding(f2Params, 'attack', {
      options: {
        [ATTACK_KEYS.SLASH]: ATTACK_KEYS.SLASH,
        [ATTACK_KEYS.GRENADE]: ATTACK_KEYS.GRENADE
      }
    }).on('change', (ev) => {
      console.log(ev.value)
      if(ev.value === ATTACK_KEYS.GRENADE){
        this.#selectedAttack = ATTACK_KEYS.GRENADE
        f2Params.x = this.#grenadeAttack.gameObject.x
        f2Params.y = this.#grenadeAttack.gameObject.y
        f2.refresh();
        return;
      }
      if(ev.value === ATTACK_KEYS.SLASH){
        this.#selectedAttack = ATTACK_KEYS.SLASH
        f2Params.x = this.#slashAttack.gameObject.x
        f2Params.y = this.#slashAttack.gameObject.y
        f2.refresh();
        return;
      }
    })

    const playAttackButton = f2.addButton({
      title: 'Play'
    })

    playAttackButton.on('click', () => {
      if(this.#selectedAttack === ATTACK_KEYS.GRENADE){
        this.#grenadeAttack.playAnimation()
        return
      }
      if(this.#selectedAttack === ATTACK_KEYS.SLASH){
        this.#slashAttack.playAnimation()
        return
      }
    })

    f2.addBinding(f2Params, 'x', {
      min: 0,
      max: 1920,
      step: 100
    }).on('change', (ev) => {
      this.#updateAttackGameObjectPosition('x', ev.value)
      return
    })
    f2.addBinding(f2Params, 'y', {
      min: 0,
      max: 1080,
      step: 100
    }).on('change', (ev) => {
      this.#updateAttackGameObjectPosition('y', ev.value)
      return
    })
  }

  /**
   * @param {'x' | 'y'} param
   * @param {number} value
   * @returns {void}
   */
  #updateAttackGameObjectPosition(param, value) {
    if (param === 'x') {
      if (this.#selectedAttack === ATTACK_KEYS.SLASH) {
        this.#slashAttack.gameObject.setX(value);
        return;
      }
      if (this.#selectedAttack === ATTACK_KEYS.GRENADE) {
        this.#grenadeAttack.gameObject.setX(value);
        return;
      }
    }
    if (this.#selectedAttack === ATTACK_KEYS.SLASH) {
      this.#slashAttack.gameObject.setY(value);
      return;
    }
    if (this.#selectedAttack === ATTACK_KEYS.GRENADE) {
      this.#grenadeAttack.gameObject.setY(value);
      return;
    }
  }
}