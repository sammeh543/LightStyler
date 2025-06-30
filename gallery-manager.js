/**
 * Gallery Manager for LightStyler Extension
 * Manages alternative character header images using SillyTavern's Gallery extension
 */

const GalleryManager = {
    // Cache for available images per character
    imageCache: new Map(),
    
    // Current selection cache
    currentSelections: new Map(),

    /**
     * Initialize gallery manager
     */
    async init() {
        this.loadSelections();
    },

    /**
     * Get SillyTavern context safely
     */
    getContext() {
        return window.SillyTavern?.getContext?.() || null;
    },

    /**
     * Get available images for a specific character
     * @param {string} characterName - Name of the character
     * @returns {Promise<Array>} Array of image objects
     */
    async getCharacterImages(characterName) {
        if (!characterName) return [];

        // Check cache first
        if (this.imageCache.has(characterName)) {
            return this.imageCache.get(characterName);
        }

        try {
            const response = await fetch('/api/images/list', {
                method: 'POST',
                headers: this.getRequestHeaders(),
                body: JSON.stringify({
                    folder: characterName,
                    sortField: 'date',
                    sortOrder: 'desc',
                }),
            });

            if (!response.ok) {
                console.warn(`Failed to fetch images for character: ${characterName}`);
                return [];
            }

            const files = await response.json();
            const images = files.map(file => ({
                filename: file,
                url: `user/images/${encodeURIComponent(characterName)}/${encodeURIComponent(file)}`,
                name: file.replace(/\.[^/.]+$/, '') // Remove extension for display
            }));

            // Cache the results
            this.imageCache.set(characterName, images);
            return images;

        } catch (error) {
            console.error('Error fetching character images:', error);
            return [];
        }
    },

    /**
     * Get all available character folders
     * @returns {Promise<Array>} Array of character folder names
     */
    async getCharacterFolders() {
        try {
            const response = await fetch('/api/images/folders', {
                method: 'POST',
                headers: this.getRequestHeaders(),
            });

            if (!response.ok) {
                return [];
            }

            const folders = await response.json();
            return folders.filter(folder => folder && folder.trim() !== '');

        } catch (error) {
            console.error('Error fetching character folders:', error);
            return [];
        }
    },

    /**
     * Get current character name from SillyTavern
     * @returns {string|null} Current character name
     */
    getCurrentCharacterName() {
        const context = this.getContext();
        if (!context) return null;

        if (context.groupId) {
            // In group chat, we might need to handle differently
            return null;
        }

        if (context.characterId !== undefined && context.characters[context.characterId]) {
            return context.characters[context.characterId].name;
        }

        return null;
    },

    /**
     * Set alternative image for a character
     * @param {string} characterName - Name of the character
     * @param {string} imageUrl - URL of the alternative image
     */
    setCharacterAlternativeImage(characterName, imageUrl) {
        if (!characterName) return;

        this.currentSelections.set(characterName, imageUrl);
        this.saveSelections();
        
        // Trigger message reprocess to update all visible messages
        this.updateAllCharacterImages();
    },

    /**
     * Reset character to default avatar
     * @param {string} characterName - Name of the character
     */
    resetCharacterToDefault(characterName) {
        if (!characterName) return;

        this.currentSelections.delete(characterName);
        this.saveSelections();
        
        // Trigger message reprocess to update all visible messages
        this.updateAllCharacterImages();
    },

    /**
     * Get alternative image for a character
     * @param {string} characterName - Name of the character
     * @returns {string|null} Alternative image URL or null for default
     */
    getCharacterAlternativeImage(characterName) {
        if (!characterName) return null;
        return this.currentSelections.get(characterName) || null;
    },

    /**
     * Update all character images in the current chat
     */
    updateAllCharacterImages() {
        // Process all messages to apply character-specific overrides
        if (window.LightStyler?.processAllMessages) {
            // Small delay to ensure any previous operations are complete
            setTimeout(() => {
                window.LightStyler.processAllMessages();
            }, 50);
        }
    },

    /**
     * Save current selections to extensionSettings
     */
    saveSelections() {
        try {
            const context = this.getContext();
            if (!context) return;
            
            const { extensionSettings, saveSettingsDebounced } = context;
            
            if (!extensionSettings.LightStyler) {
                extensionSettings.LightStyler = {};
            }
            
            if (!extensionSettings.LightStyler.characterImages) {
                extensionSettings.LightStyler.characterImages = {};
            }
            
            extensionSettings.LightStyler.characterImages = Object.fromEntries(this.currentSelections);
            saveSettingsDebounced();
        } catch (error) {
            console.error('Error saving character image selections:', error);
        }
    },

    /**
     * Load selections from extensionSettings
     */
    loadSelections() {
        try {
            const context = this.getContext();
            if (!context) return;
            
            const { extensionSettings } = context;
            
            // Load from new extensionSettings location
            if (extensionSettings.LightStyler?.characterImages) {
                this.currentSelections = new Map(Object.entries(extensionSettings.LightStyler.characterImages));
            } else {
                // Migration: check for old localStorage data
                const oldSaved = localStorage.getItem('lightstyler_character_images');
                if (oldSaved) {
                    const selectionsObj = JSON.parse(oldSaved);
                    this.currentSelections = new Map(Object.entries(selectionsObj));
                    
                    // Migrate to new storage and remove old
                    this.saveSelections();
                    localStorage.removeItem('lightstyler_character_images');
                    console.log('LightStyler: Migrated character images from localStorage to extensionSettings');
                } else {
                    this.currentSelections = new Map();
                }
            }
        } catch (error) {
            console.error('Error loading character image selections:', error);
            this.currentSelections = new Map();
        }
    },

    /**
     * Get request headers for API calls
     */
    getRequestHeaders() {
        const context = this.getContext();
        if (context && typeof context.getRequestHeaders === 'function') {
            return context.getRequestHeaders();
        }
        
        // Fallback headers
        return {
            'Content-Type': 'application/json',
        };
    },

    /**
     * Clear cache for a specific character or all characters
     * @param {string} [characterName] - Character to clear cache for, or undefined for all
     */
    clearCache(characterName) {
        if (characterName) {
            this.imageCache.delete(characterName);
        } else {
            this.imageCache.clear();
        }
    }
};

// Export for use in other files
window.LightStylerGalleryManager = GalleryManager;
