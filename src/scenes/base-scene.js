import Phaser from '../lib/phaser.js';
import { Controls } from '../utils/controls.js';
import { dataManager, DATA_MANAGER_STORE_KEYS } from '../utils/data-manager.js';
import { SOUND_OPTIONS } from '../common/options.js';

export class BaseScene extends Phaser.Scene {

  /** @protected @type {Controls} */
  _controls;

  /** @protected @type {string | undefined} */
  _musicKey;

  /**
   * @param {string | Phaser.Types.Scenes.SettingsConfig} [config]
   */
  constructor(config) {
    super(config);
    if (this.constructor === BaseScene) {
      throw new Error('BaseScene is an abstract class and cannot be instantiated.');
    }
  }

  /**
   * @returns {void}
   */
  init(data) {
    this._log(`[${this.constructor.name}:init] invoked`);
  }

  /**
   * @returns {void}
   */
  preload() {
    this._log(`[${this.constructor.name}:preload] invoked`);
  }

  /**
   * @returns {void}
   */
  create() {
    this._log(`[${this.constructor.name}:create] invoked`);

    this._controls = new Controls(this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneCleanup, this)

    this.scene.bringToTop();

    this.#startMusic();
  }

  /**
   * @param {DOMHighResTimeStamp} [time]
   * @returns {void}
   */
  update(time) { }

  handleSceneResume(sys, data) {
    this._controls.lockInput = false;
    this.#startMusic();

    if (data) {
      this._log(`[${this.constructor.name}:handleSceneResume] invoked, data provided: ${JSON.stringify(data)}`)
      return
    }
    this._log(`[${this.constructor.name}:handleSceneResume] invoked`)
  }

  /**
   * @protected
   * @param {string} message
   */
  _log(message) {
    console.log(`%c${message}`, 'color: orange; background: black;');
  }

  handleSceneCleanup() {
    this._log(`[${this.constructor.name}:handleSceneCleanup] invoked`)
    this.events.off(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this)
  }

  #startMusic() {
    if (!this._musicKey) {
      return;
    }

    const isSoundOn = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) === SOUND_OPTIONS.ON;
    if (!isSoundOn) {
      this.sound.stopAll();
      return;
    }

    const soundManager = this.sound;
    const targetVolume = (dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME) / 4) * 0.2;

    // Detenemos progresivamente las otras canciones  que estén sonando para que no se solapen
    const allPlaying = soundManager.getAllPlaying();
    allPlaying.forEach(sound => {
      if (sound.key !== this._musicKey) {
        this.tweens.add({
          targets: sound,
          volume: 0,
          duration: 500,
          onComplete: () => {
            sound.stop();
          }
        });
      }
    });

    const existingSound = soundManager.get(this._musicKey);
    // Si ya está sonando este audio, aseguramos que su volumen es el correcto
    if (existingSound && existingSound.isPlaying) {
      this.tweens.add({
        targets: existingSound,
        volume: targetVolume,
        duration: 500
      });
      return;
    }

    try {
      const newMusic = this.sound.add(this._musicKey, {
        loop: true,
        volume: 0
      });
      newMusic.play();

      this.tweens.add({
        targets: newMusic,
        volume: targetVolume,
        duration: 500
      });
    } catch (e) {
      console.warn(`Could not play music ${this._musicKey}:`, e);
    }
  }
}
