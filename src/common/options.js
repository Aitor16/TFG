/**
 * @typedef {keyof typeof OPTION_MENU_OPTIONS} OptionsMenuOptions
 */

/**@enum {OptionsMenuOptions} */
export const OPTION_MENU_OPTIONS = Object.freeze({
    TEXT_SPEED: 'TEXT_SPEED',
    BATTLE_SCENE: 'BATTLE_SCENE',
    BATTLE_STYLE: 'BATTLE_STYLE',
    SOUND: 'SOUND',
    VOLUME: 'VOLUME',
    MENU_COLOR: 'MENU_COLOR',
    LANGUAGE: 'LANGUAGE',
    CONFIRM: 'CONFIRM'
})

/**
 * @typedef {keyof typeof LANGUAGE_OPTIONS} LanguageMenuOptions
 */

/**@enum {LanguageMenuOptions} */
export const LANGUAGE_OPTIONS = Object.freeze({
    ENGLISH: 'ENGLISH',
    SPANISH: 'SPANISH',
})

/**
 * @typedef {keyof typeof TEXT_SPEED_OPTIONS} TextSpeedMenuOptions
 */

/**@enum {TextSpeedMenuOptions} */
export const TEXT_SPEED_OPTIONS = Object.freeze({
    SLOW: 'SLOW',
    MID: 'MID',
    FAST: 'FAST',
})

/**
 * @typedef {keyof typeof BATTLE_SCENE_OPTIONS} BattleSceneMenuOptions
 */

/**@enum {BattleSceneMenuOptions} */
export const BATTLE_SCENE_OPTIONS = Object.freeze({
    ON: 'ON',
    OFF: 'OFF'
})

/**
 * @typedef {keyof typeof BATTLE_STYLE_OPTIONS} BattleStyleOptions
 */

/**@enum {BattleStyleOptions} */
export const BATTLE_STYLE_OPTIONS = Object.freeze({
    SET: 'SET',
    SHIFT: 'SHIFT'
})

/**
 * @typedef {keyof typeof SOUND_OPTIONS} SoundMenuOptions
 */

/**@enum {SoundMenuOptions} */
export const SOUND_OPTIONS = Object.freeze({
    ON: 'ON',
    OFF: 'OFF'
})

/**
 * @typedef {0 | 1 | 2 | 3 | 4 } VolumeMenuOptions
 */


/**
 * @typedef {0 | 1 | 2  } MenuColorOptions
 */


