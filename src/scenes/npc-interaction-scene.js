import { SCENE_KEYS } from "./scene-keys.js";
import { BaseScene } from "./base-scene.js";
import { DialogUi } from "../world/characters/dialog-ui.js";

export class NPCInteractionScene extends BaseScene {
    /** @type {string[]} */
    #messages;
    /** @type {string} */
    #backgroundImageKey;
    /** @type {DialogUi} */
    #dialogUi;

    constructor() {
        super({
            key: SCENE_KEYS.NPC_DIALOG_SCENE
        });
    }

    /**
     * @param {{messages: string[], backgroundImageKey: string}} data 
     */
    init(data) {
        super.init(data);
        this.#messages = data.messages || ['...'];
        this.#backgroundImageKey = data.backgroundImageKey || 'ZOMBIE';
    }

    create() {
        super.create();

        // Fondo oscuro para dar profundidad y resaltar la imagen
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7).setOrigin(0);

        // 1. Añadimos la imagen del NPC/Escena centrada
        // La posicionamos ligeramente hacia arriba para dejar espacio al diálogo
        const bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY - 50, this.#backgroundImageKey);
        
        // La escalamos para que sea "mediana/grande" (ej: 70% de la altura de la pantalla)
        const targetHeight = this.cameras.main.height * 0.7;
        const scale = targetHeight / bg.height;
        bg.setScale(scale);

        // 2. Creamos la interfaz de diálogo en la parte inferior
        this.#dialogUi = new DialogUi(this, 1920);
        
        // Mostramos el diálogo del NPC con el que interactuamos
        this.#dialogUi.showDialogModal(this.#messages, () => {
            // Cuando termine el diálogo, volvemos a la escena del mundo
            this.scene.stop(SCENE_KEYS.NPC_DIALOG_SCENE);
            this.scene.resume(SCENE_KEYS.WORLD_SCENE);
        });
    }

    update() {
        if (this._controls.wasSpaceKeyPressed()) {
            if (this.#dialogUi.isAnimationPlaying) {
                return;
            }

            if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
                this.#dialogUi.showNextMessage();
                return;
            }

            if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
                this.#dialogUi.hideDialogModal();
            }
        }
    }
}
