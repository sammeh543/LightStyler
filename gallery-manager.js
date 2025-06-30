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
     * Get current character avatar filename
     * @returns {string|null} Current character avatar filename
     */
    getCurrentCharacterAvatar() {
        const context = this.getContext();
        if (!context) return null;

        if (context.characterId !== undefined && context.characters[context.characterId]) {
            return context.characters[context.characterId].avatar;
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
        
        // Trigger theme update if this is the current character
        const currentChar = this.getCurrentCharacterName();
        if (currentChar === characterName) {
            this.updateCurrentCharacterImage();
        }
    },

    /**
     * Reset character to default avatar
     * @param {string} characterName - Name of the character
     */
    resetCharacterToDefault(characterName) {
        if (!characterName) return;

        this.currentSelections.delete(characterName);
        this.saveSelections();
        
        // Trigger theme update if this is the current character
        const currentChar = this.getCurrentCharacterName();
        if (currentChar === characterName) {
            this.updateCurrentCharacterImage();
        }
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
     * Update the current character's image in the theme
     */
    updateCurrentCharacterImage() {
        const characterName = this.getCurrentCharacterName();
        if (!characterName) {
            // Clear any existing override if no character is selected
            document.documentElement.style.removeProperty('--lightstyler-character-override');
            return;
        }

        const altImage = this.getCharacterAlternativeImage(characterName);
        
        if (altImage) {
            // Use alternative image with proper URL formatting
            const cleanUrl = altImage.startsWith('/') ? altImage : `/${altImage}`;
            document.documentElement.style.setProperty('--lightstyler-character-override', `url('${cleanUrl}')`);
        } else {
            // Remove override to use default
            document.documentElement.style.removeProperty('--lightstyler-character-override');
        }

        // Trigger a message reprocess to update all visible messages
        if (window.LightStyler?.processAllMessages) {
            setTimeout(() => {
                window.LightStyler.processAllMessages();
            }, 100); // Small delay to ensure CSS has been applied
        }
    },

    /**
     * Save current selections to localStorage
     */
    saveSelections() {
        try {
            const selectionsObj = Object.fromEntries(this.currentSelections);
            localStorage.setItem('lightstyler_character_images', JSON.stringify(selectionsObj));
        } catch (error) {
            console.error('Error saving character image selections:', error);
        }
    },

    /**
     * Load selections from localStorage
     */
    loadSelections() {
        try {
            const saved = localStorage.getItem('lightstyler_character_images');
            if (saved) {
                const selectionsObj = JSON.parse(saved);
                this.currentSelections = new Map(Object.entries(selectionsObj));
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
