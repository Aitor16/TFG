export const TILE_SIZE = 64
export const TILED_COLLISION_LAYER_ALPHA = 0.7
export const TEXT_SPEED = Object.freeze({
    SLOW: 50,
    MEDIUM: 30,
    FAST: 15
})

/**
 * Mapeo de nombres de NPCs (en Tiled) a sus fondos de diálogo (Asset Keys).
 * @type {Object.<string, string>}
 */
export const NPC_DIALOG_BACKGROUNDS = Object.freeze({
    // 'NombreNPC': 'NombreDeLaKey',
    'npc': 'PERROZ',
    'npc2': 'SOLDIER'
})