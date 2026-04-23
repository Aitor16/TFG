/**
 * Cloud Save Manager - Integración con MongoDB
 */

const API_URL = 'http://localhost:5000/api';

export class CloudSaveManager {
    constructor() {
        this.currentSaveId = null;
        this.sessionStartTime = Date.now();
        this.autoSaveInterval = null;
        this.isOnline = true;
        this.pendingSaves = []; // Cola de guardados pendientes cuando no hay conexión
    }

    /**
     * Verificar conexión con el servidor
     */
    async checkConnection() {
        try {
            const response = await fetch(`${API_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            this.isOnline = response.ok;
            return this.isOnline;
        } catch (error) {
            this.isOnline = false;
            console.warn('Cloud save server unavailable, using local storage only');
            return false;
        }
    }

    /**
     * Obtener todos los slots de guardado disponibles
     */
    async getSaveSlots() {
        if (!this.isOnline) {
            await this.checkConnection();
            if (!this.isOnline) return [];
        }

        try {
            const response = await fetch(`${API_URL}/saves/slots`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            return data.data;
        } catch (error) {
            console.error('Error fetching save slots:', error);
            this.isOnline = false;
            return [];
        }
    }

    /**
     * Crear nueva partida en la nube
     */
    async createNewSave(slot, playerName, gameData) {
        if (!this.isOnline) {
            await this.checkConnection();
            if (!this.isOnline) {
                throw new Error('Cloud save unavailable, playing in offline mode');
            }
        }

        try {
            const response = await fetch(`${API_URL}/saves`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slot,
                    playerName,
                    gameData: this.#prepareGameData(gameData),
                    inventory: gameData.inventory || [],
                    monsters: gameData.monsters || [],
                    playerStats: gameData.playerStats || {}
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            this.currentSaveId = data.data.saveId;
            this.sessionStartTime = Date.now();
            
            // Guardar referencia local
            localStorage.setItem('current_cloud_save_id', this.currentSaveId);
            localStorage.setItem('current_save_slot', slot.toString());
            
            return data.data;
        } catch (error) {
            console.error('Error creating new save:', error);
            this.isOnline = false;
            throw error;
        }
    }

    /**
     * Cargar partida existente desde la nube
     */
    async loadSave(saveId) {
        if (!this.isOnline) {
            await this.checkConnection();
            if (!this.isOnline) {
                throw new Error('Cloud save unavailable, cannot load');
            }
        }

        try {
            const response = await fetch(`${API_URL}/saves/${saveId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            this.currentSaveId = data.data.saveId;
            this.sessionStartTime = Date.now();
            
            // Guardar referencia local
            localStorage.setItem('current_cloud_save_id', this.currentSaveId);
            localStorage.setItem('current_save_slot', data.data.slot.toString());
            
            return data.data;
        } catch (error) {
            console.error('Error loading save:', error);
            this.isOnline = false;
            throw error;
        }
    }

    /**
     * Cargar partida por slot
     */
    async loadSaveBySlot(slot) {
        if (!this.isOnline) {
            await this.checkConnection();
            if (!this.isOnline) {
                throw new Error('Cloud save unavailable, cannot load');
            }
        }

        try {
            const response = await fetch(`${API_URL}/saves/slot/${slot}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            this.currentSaveId = data.data.saveId;
            this.sessionStartTime = Date.now();
            
            localStorage.setItem('current_cloud_save_id', this.currentSaveId);
            localStorage.setItem('current_save_slot', slot.toString());
            
            return data.data;
        } catch (error) {
            console.error('Error loading save by slot:', error);
            this.isOnline = false;
            throw error;
        }
    }

    /**
     * Guardar progreso actual en la nube
     */
    async saveProgress(gameData) {
        if (!this.currentSaveId) {
            throw new Error('No active save game');
        }

        if (!this.isOnline) {
            // Guardar en cola para sincronizar después
            this.pendingSaves.push({
                timestamp: Date.now(),
                gameData: { ...gameData }
            });
            console.log('Offline: Save queued for later sync');
            return { queued: true };
        }

        try {
            const playTimeIncrement = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            
            const response = await fetch(`${API_URL}/saves/${this.currentSaveId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameData: this.#prepareGameData(gameData),
                    inventory: gameData.inventory,
                    monsters: gameData.monsters,
                    playerStats: gameData.playerStats
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            this.sessionStartTime = Date.now();
            
            return data.data;
        } catch (error) {
            console.error('Error saving progress:', error);
            this.isOnline = false;
            
            // Guardar en cola para sincronizar después
            this.pendingSaves.push({
                timestamp: Date.now(),
                gameData: { ...gameData }
            });
            
            throw error;
        }
    }

    /**
     * Sincronizar guardados pendientes
     */
    async syncPendingSaves() {
        if (!this.isOnline || this.pendingSaves.length === 0) {
            return;
        }

        console.log(`Syncing ${this.pendingSaves.length} pending saves...`);
        
        // Tomar el último guardado (más reciente)
        const lastSave = this.pendingSaves[this.pendingSaves.length - 1];
        
        try {
            await this.saveProgress(lastSave.gameData);
            this.pendingSaves = [];
            console.log('Pending saves synced successfully');
        } catch (error) {
            console.error('Failed to sync pending saves:', error);
        }
    }

    /**
     * Guardado rápido (autoguardado)
     */
    async quickSave(gameData) {
        if (!this.currentSaveId) {
            return;
        }

        if (!this.isOnline) {
            return;
        }

        try {
            const playTimeIncrement = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            
            const response = await fetch(`${API_URL}/saves/${this.currentSaveId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playTimeIncrement,
                    currentLocation: gameData.playerStats?.location,
                    playerStats: gameData.playerStats
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.sessionStartTime = Date.now();
            }
        } catch (error) {
            console.error('Error during quick save:', error);
            this.isOnline = false;
        }
    }

    /**
     * Eliminar partida en la nube
     */
    async deleteSave(saveId) {
        if (!this.isOnline) {
            await this.checkConnection();
            if (!this.isOnline) {
                throw new Error('Cloud save unavailable, cannot delete');
            }
        }

        try {
            const response = await fetch(`${API_URL}/saves/${saveId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            if (this.currentSaveId === saveId) {
                this.currentSaveId = null;
                localStorage.removeItem('current_cloud_save_id');
                localStorage.removeItem('current_save_slot');
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting save:', error);
            this.isOnline = false;
            throw error;
        }
    }

    /**
     * Iniciar autoguardado automático
     */
    startAutoSave(gameDataProvider, intervalSeconds = 60) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            if (this.currentSaveId && gameDataProvider) {
                const gameData = gameDataProvider();
                this.quickSave(gameData);
            }
        }, intervalSeconds * 1000);
    }

    /**
     * Detener autoguardado
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Preparar datos del juego para guardar
     */
    #prepareGameData(gameData) {
        return {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            ...gameData
        };
    }

    /**
     * Obtener estadísticas del jugador
     */
    async getPlayerStats(playerName) {
        if (!this.isOnline) {
            await this.checkConnection();
            if (!this.isOnline) return null;
        }

        try {
            const response = await fetch(`${API_URL}/saves/stats/${encodeURIComponent(playerName)}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            return data.data;
        } catch (error) {
            console.error('Error getting player stats:', error);
            this.isOnline = false;
            return null;
        }
    }

    /**
     * Verificar si hay una partida activa
     */
    hasActiveSave() {
        return this.currentSaveId !== null;
    }

    /**
     * Obtener el slot actual
     */
    getCurrentSlot() {
        return localStorage.getItem('current_save_slot');
    }
}

export const cloudSaveManager = new CloudSaveManager();