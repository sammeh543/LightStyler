// /MyLightweightStyler/index.js
/*
================================================================================
 Light Weight Styler v17
================================================================================
  AUTHORS: AI Archaea
  LAST UPDATED: June 29, 2025

  FEATURES:
  - Styler allows pulling of UID and Avatars to use with CSS snippets
  - Whisper Light Check box allows for UI theme via style.css
    when deselected allows us to keep the UID and Avartar grabbing
    but makes it so other Whisper Light specific stuff wont interfere with
    our UI when the theme is off.
================================================================================
*/

jQuery(function () {
    const context = SillyTavern.getContext();
    const { extensionSettings, saveSettingsDebounced } = context;

    //================================================================================
    // CONSTANTS & CONFIGURATION
    //================================================================================

    const CONSTANTS = {
        MODULE_NAME: 'LightStyler',
        PATHS: {
            SETTINGS_HTML: 'scripts/extensions/third-party/LightStyler/settings.html',
            STYLESHEET: 'scripts/extensions/third-party/LightStyler/style.css',
            GALLERY_MANAGER: 'scripts/extensions/third-party/LightStyler/gallery-manager.js',
        },
        DOM: {
            STYLESHEET_ID: 'lightstyler-style',
            WHISPER_LIGHT_TOGGLE: 'lightstyler_whisper_light',
            THEME_SETTINGS_CONTAINER: 'lightstyler_theme_settings',
            LARGE_MODE_RADIO: 'lightstyler_large_avatar_mode',
            SMALL_MODE_RADIO: 'lightstyler_small_avatar_mode',
            AVATAR_WIDTH_INPUT: 'lightstyler_avatar_width',
            EDIT_OFFSET_INPUT: 'lightstyler_edit_offset',
            AVATAR_RESET_BUTTON: 'lightstyler_reset_button',
            PERSONA_BANNER_POS_INPUT: 'lightstyler_persona_banner_pos',
            CHARACTER_BANNER_POS_INPUT: 'lightstyler_character_banner_pos',
            BANNER_POS_RESET_BUTTON: 'lightstyler_bannerpos_reset_button',
            EXTENSIONS_SETTINGS: '#extensions_settings',
            CHAT_CONTAINER: '#chat',
            CHAT_MESSAGE: '.mes',
            AVATAR_MODE_RADIO_CHECKED: 'input[name="avatar_mode"]:checked',
            // Gallery Manager Elements
            CHARACTER_SELECT: 'lightstyler_character_select',
            IMAGE_SELECT: 'lightstyler_image_select',
            IMAGE_SELECTION_CONTAINER: 'lightstyler_image_selection',
            REFRESH_CHARACTERS_BUTTON: 'lightstyler_refresh_characters',
            PREVIEW_IMAGE_BUTTON: 'lightstyler_preview_image',
            APPLY_IMAGE_BUTTON: 'lightstyler_apply_image',
            RESET_CHARACTER_BUTTON: 'lightstyler_reset_character',
            IMAGE_PREVIEW_CONTAINER: 'lightstyler_image_preview',
            PREVIEW_IMG: 'lightstyler_preview_img',
        },
        CSS_VARS: {
            AVATAR_WIDTH: '--avatar-width',
            EDIT_OFFSET: '--edit-buttons-top-offset',
            PERSONA_BANNER: '--persona-banner-pos',
            CHARACTER_BANNER: '--character-banner-pos',
            MESSAGE_AVATAR_URL: '--mes-avatar-url',
            CHARACTER_OVERRIDE: '--lightstyler-character-override',
        },
    };

    const defaultSettings = {
        whisperLight: true,
        avatarMode: 'large',
        avatar_width_large: 304,
        edit_offset_large: 390,
        avatar_width_small: 70,
        edit_offset_small: 90,
        personaBannerPos: 15,
        characterBannerPos: 27,
    };

    //================================================================================
    // SETTINGS MANAGEMENT
    //================================================================================

    function getSettings() {
        if (!extensionSettings[CONSTANTS.MODULE_NAME]) {
            extensionSettings[CONSTANTS.MODULE_NAME] = structuredClone(defaultSettings);
        }
        const settings = extensionSettings[CONSTANTS.MODULE_NAME];
        for (const key in defaultSettings) {
            if (settings[key] === undefined) {
                settings[key] = defaultSettings[key];
            }
        }
        return settings;
    }

    //================================================================================
    // MESSAGE & AVATAR PROCESSING
    //================================================================================

    function getMessageAuthorUid(message) {
        const avatarImg = message.querySelector(".avatar img");
        if (!avatarImg) return null;

        const isUser = message.getAttribute("is_user") === "true";
        const nameElement = message.querySelector(".name_text");
        const charName = nameElement ? nameElement.textContent.trim() : null;

        const avatarSrc = avatarImg.getAttribute("src");
        if (!avatarSrc || !charName) return null;

        const charType = isUser ? "persona" : "character";
        const avatarFileName = avatarSrc.split("/").pop().split("?").shift();

        return `${charType}|${charName}|${avatarFileName}`;
    }

    function processMessage(message) {
        const uid = getMessageAuthorUid(message);
        if (!message.hasAttribute("csc-author-uid") && uid) {
            message.setAttribute("csc-author-uid", uid);
        }

        const avatarImg = message.querySelector(".avatar img");
        if (avatarImg && message.style.getPropertyValue(CONSTANTS.CSS_VARS.MESSAGE_AVATAR_URL) === "") {
            let avatarSrc = avatarImg.getAttribute("src");
            if (avatarSrc) {
                // Check for character override
                const isUser = message.getAttribute("is_user") === "true";
                if (!isUser && window.LightStylerGalleryManager) {
                    const nameElement = message.querySelector(".name_text");
                    const charName = nameElement ? nameElement.textContent.trim() : null;
                    
                    if (charName) {
                        const altImage = window.LightStylerGalleryManager.getCharacterAlternativeImage(charName);
                        if (altImage) {
                            message.style.setProperty(CONSTANTS.CSS_VARS.MESSAGE_AVATAR_URL, `url('${altImage}')`);
                            return;
                        }
                    }
                }
                
                // Use default avatar
                if (!avatarSrc.startsWith("/") && !avatarSrc.startsWith("http")) {
                    avatarSrc = "/" + avatarSrc;
                }
                const escapedSrc = avatarSrc.replace(/['"()\s]/g, "\\$&");
                message.style.setProperty(CONSTANTS.CSS_VARS.MESSAGE_AVATAR_URL, `url('${escapedSrc}')`);
            }
        }
    }

    function processAllMessages() {
        document.querySelectorAll(`${CONSTANTS.DOM.CHAT_CONTAINER} ${CONSTANTS.DOM.CHAT_MESSAGE}`).forEach(processMessage);
    }

    // Export processAllMessages for gallery manager to use
    window.LightStyler = { processAllMessages };

    //================================================================================
    // GALLERY MANAGER INTEGRATION
    //================================================================================

    async function loadGalleryManager() {
        if (window.LightStylerGalleryManager) return;
        
        try {
            const script = document.createElement('script');
            script.src = CONSTANTS.PATHS.GALLERY_MANAGER;
            script.async = true;
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
            
            if (window.LightStylerGalleryManager) {
                await window.LightStylerGalleryManager.init();
            }
        } catch (error) {
            console.error('Failed to load gallery manager:', error);
        }
    }

    async function setupGalleryUI() {
        const elements = {
            characterSelect: document.getElementById(CONSTANTS.DOM.CHARACTER_SELECT),
            imageSelect: document.getElementById(CONSTANTS.DOM.IMAGE_SELECT),
            imageSelection: document.getElementById(CONSTANTS.DOM.IMAGE_SELECTION_CONTAINER),
            refreshButton: document.getElementById(CONSTANTS.DOM.REFRESH_CHARACTERS_BUTTON),
            previewButton: document.getElementById(CONSTANTS.DOM.PREVIEW_IMAGE_BUTTON),
            applyButton: document.getElementById(CONSTANTS.DOM.APPLY_IMAGE_BUTTON),
            resetButton: document.getElementById(CONSTANTS.DOM.RESET_CHARACTER_BUTTON),
            previewContainer: document.getElementById(CONSTANTS.DOM.IMAGE_PREVIEW_CONTAINER),
            previewImg: document.getElementById(CONSTANTS.DOM.PREVIEW_IMG),
        };

        if (!Object.values(elements).every(el => el)) return;

        // Load characters on refresh
        async function loadCharacters() {
            if (!window.LightStylerGalleryManager) return;
            
            elements.characterSelect.innerHTML = '<option value="">Select a character...</option>';
            const folders = await window.LightStylerGalleryManager.getCharacterFolders();
            
            folders.forEach(folder => {
                const option = document.createElement('option');
                option.value = folder;
                option.textContent = folder;
                elements.characterSelect.appendChild(option);
            });
        }

        // Load images for selected character
        async function loadCharacterImages() {
            const selectedChar = elements.characterSelect.value;
            if (!selectedChar || !window.LightStylerGalleryManager) {
                elements.imageSelection.style.display = 'none';
                return;
            }

            elements.imageSelect.innerHTML = '<option value="">Use default avatar</option>';
            const images = await window.LightStylerGalleryManager.getCharacterImages(selectedChar);
            
            images.forEach(image => {
                const option = document.createElement('option');
                option.value = image.url;
                option.textContent = image.name;
                elements.imageSelect.appendChild(option);
            });

            // Show current selection if any
            const currentImage = window.LightStylerGalleryManager.getCharacterAlternativeImage(selectedChar);
            if (currentImage) {
                elements.imageSelect.value = currentImage;
            }

            elements.imageSelection.style.display = 'block';
        }

        // Preview selected image
        function previewImage() {
            const selectedImage = elements.imageSelect.value;
            if (selectedImage) {
                elements.previewImg.src = selectedImage;
                elements.previewContainer.style.display = 'block';
            } else {
                elements.previewContainer.style.display = 'none';
            }
        }

        // Apply selected image
        function applyImage() {
            const selectedChar = elements.characterSelect.value;
            const selectedImage = elements.imageSelect.value;
            
            if (!selectedChar || !window.LightStylerGalleryManager) return;

            if (selectedImage) {
                window.LightStylerGalleryManager.setCharacterAlternativeImage(selectedChar, selectedImage);
                if (window.toastr) {
                    toastr.success(`Alternative image applied for ${selectedChar}`);
                }
            } else {
                window.LightStylerGalleryManager.resetCharacterToDefault(selectedChar);
                if (window.toastr) {
                    toastr.success(`${selectedChar} reset to default avatar`);
                }
            }
            
            elements.previewContainer.style.display = 'none';
        }

        // Reset character to default
        function resetCharacter() {
            const selectedChar = elements.characterSelect.value;
            if (!selectedChar || !window.LightStylerGalleryManager) return;

            window.LightStylerGalleryManager.resetCharacterToDefault(selectedChar);
            elements.imageSelect.value = '';
            elements.previewContainer.style.display = 'none';
            if (window.toastr) {
                toastr.success(`${selectedChar} reset to default avatar`);
            }
        }

        // Event listeners
        elements.refreshButton.addEventListener('click', loadCharacters);
        elements.characterSelect.addEventListener('change', loadCharacterImages);
        elements.imageSelect.addEventListener('change', previewImage);
        elements.previewButton.addEventListener('click', previewImage);
        elements.applyButton.addEventListener('click', applyImage);
        elements.resetButton.addEventListener('click', resetCharacter);

        // Initial load
        await loadCharacters();
    }

    //================================================================================
    // THEME & UI MANAGEMENT
    //================================================================================

    function setWhisperLightEnabled(enabled) {
        const styleTag = document.getElementById(CONSTANTS.DOM.STYLESHEET_ID);
        const themeSettings = document.getElementById(CONSTANTS.DOM.THEME_SETTINGS_CONTAINER);

        if (enabled) {
            if (!styleTag) {
                const newStyleTag = document.createElement("link");
                newStyleTag.id = CONSTANTS.DOM.STYLESHEET_ID;
                newStyleTag.rel = "stylesheet";
                newStyleTag.type = "text/css";
                newStyleTag.href = CONSTANTS.PATHS.STYLESHEET;
                document.head.appendChild(newStyleTag);
            }
            if (themeSettings) themeSettings.style.display = "";
            updateThemeStyles();
        } else {
            if (styleTag) styleTag.remove();
            if (themeSettings) themeSettings.style.display = "none";
            document.documentElement.style.removeProperty(CONSTANTS.CSS_VARS.AVATAR_WIDTH);
            document.documentElement.style.removeProperty(CONSTANTS.CSS_VARS.EDIT_OFFSET);
            document.documentElement.style.removeProperty(CONSTANTS.CSS_VARS.PERSONA_BANNER);
            document.documentElement.style.removeProperty(CONSTANTS.CSS_VARS.CHARACTER_BANNER);
        }
    }

    function updateThemeStyles() {
        if (!getSettings().whisperLight) return;

        const elements = {
            avatarWidth: document.getElementById(CONSTANTS.DOM.AVATAR_WIDTH_INPUT),
            editOffset: document.getElementById(CONSTANTS.DOM.EDIT_OFFSET_INPUT),
            personaBannerPos: document.getElementById(CONSTANTS.DOM.PERSONA_BANNER_POS_INPUT),
            characterBannerPos: document.getElementById(CONSTANTS.DOM.CHARACTER_BANNER_POS_INPUT),
        };

        if (Object.values(elements).some(el => !el)) return;

        document.documentElement.style.setProperty(CONSTANTS.CSS_VARS.AVATAR_WIDTH, `${elements.avatarWidth.value}px`);
        document.documentElement.style.setProperty(CONSTANTS.CSS_VARS.EDIT_OFFSET, `${elements.editOffset.value}px`);
        document.documentElement.style.setProperty(CONSTANTS.CSS_VARS.PERSONA_BANNER, `${elements.personaBannerPos.value}%`);
        document.documentElement.style.setProperty(CONSTANTS.CSS_VARS.CHARACTER_BANNER, `${elements.characterBannerPos.value}%`);
    }

    //================================================================================
    // INITIALIZATION
    //================================================================================

    function setupWhisperLightToggle() {
        const checkbox = document.getElementById(CONSTANTS.DOM.WHISPER_LIGHT_TOGGLE);
        if (!checkbox) return;

        const settings = getSettings();
        checkbox.checked = settings.whisperLight;
        setWhisperLightEnabled(checkbox.checked);

        checkbox.addEventListener("change", () => {
            settings.whisperLight = checkbox.checked;
            saveSettingsDebounced();
            setWhisperLightEnabled(checkbox.checked);
        });
    }

    function setupThemeSettings() {
        const elements = {
            largeModeRadio: document.getElementById(CONSTANTS.DOM.LARGE_MODE_RADIO),
            smallModeRadio: document.getElementById(CONSTANTS.DOM.SMALL_MODE_RADIO),
            avatarWidthInput: document.getElementById(CONSTANTS.DOM.AVATAR_WIDTH_INPUT),
            editOffsetInput: document.getElementById(CONSTANTS.DOM.EDIT_OFFSET_INPUT),
            resetButton: document.getElementById(CONSTANTS.DOM.AVATAR_RESET_BUTTON),
            personaBannerPosInput: document.getElementById(CONSTANTS.DOM.PERSONA_BANNER_POS_INPUT),
            characterBannerPosInput: document.getElementById(CONSTANTS.DOM.CHARACTER_BANNER_POS_INPUT),
            bannerPosResetButton: document.getElementById(CONSTANTS.DOM.BANNER_POS_RESET_BUTTON),
        };

        if (Object.values(elements).some(el => !el)) return;

        function applyMode(mode) {
            const settings = getSettings();
            elements.avatarWidthInput.value = settings[`avatar_width_${mode}`] ?? defaultSettings[`avatar_width_${mode}`];
            elements.editOffsetInput.value = settings[`edit_offset_${mode}`] ?? defaultSettings[`edit_offset_${mode}`];
        }

        function applyBannerPositions() {
            const settings = getSettings();
            elements.personaBannerPosInput.value = settings.personaBannerPos ?? defaultSettings.personaBannerPos;
            elements.characterBannerPosInput.value = settings.characterBannerPos ?? defaultSettings.characterBannerPos;
        }

        // Event Listeners
        elements.resetButton.addEventListener("click", () => {
            const settings = getSettings();
            const mode = document.querySelector(CONSTANTS.DOM.AVATAR_MODE_RADIO_CHECKED).value;
            settings[`avatar_width_${mode}`] = defaultSettings[`avatar_width_${mode}`];
            settings[`edit_offset_${mode}`] = defaultSettings[`edit_offset_${mode}`];
            saveSettingsDebounced();
            applyMode(mode);
            updateThemeStyles();
        });

        elements.bannerPosResetButton.addEventListener("click", () => {
            const settings = getSettings();
            settings.personaBannerPos = defaultSettings.personaBannerPos;
            settings.characterBannerPos = defaultSettings.characterBannerPos;
            saveSettingsDebounced();
            applyBannerPositions();
            updateThemeStyles();
        });

        const handleModeChange = (mode) => {
            getSettings().avatarMode = mode;
            saveSettingsDebounced();
            applyMode(mode);
            updateThemeStyles();
        };

        elements.largeModeRadio.addEventListener("change", () => elements.largeModeRadio.checked && handleModeChange("large"));
        elements.smallModeRadio.addEventListener("change", () => elements.smallModeRadio.checked && handleModeChange("small"));

        const createInputListener = (keyProvider) => (event) => {
            const settings = getSettings();
            const key = typeof keyProvider === 'function' ? keyProvider() : keyProvider;
            settings[key] = event.target.value;
            saveSettingsDebounced();
            updateThemeStyles();
        };

        elements.avatarWidthInput.addEventListener("input", createInputListener(() => `avatar_width_${getSettings().avatarMode}`));
        elements.editOffsetInput.addEventListener("input", createInputListener(() => `edit_offset_${getSettings().avatarMode}`));
        elements.personaBannerPosInput.addEventListener("input", createInputListener('personaBannerPos'));
        elements.characterBannerPosInput.addEventListener("input", createInputListener('characterBannerPos'));

        // Load initial state
        const savedMode = getSettings().avatarMode;
        if (savedMode === "small") {
            elements.smallModeRadio.checked = true;
        } else {
            elements.largeModeRadio.checked = true;
        }
        applyMode(savedMode);
        applyBannerPositions();
        updateThemeStyles();
    }

    async function addLightStylerSettingsDrawer() {
        if (document.getElementById(CONSTANTS.DOM.WHISPER_LIGHT_TOGGLE)) return;

        const settingsHtml = await $.get(CONSTANTS.PATHS.SETTINGS_HTML);
        $(CONSTANTS.DOM.EXTENSIONS_SETTINGS).append(settingsHtml);

        setupWhisperLightToggle();
        setupThemeSettings();
        
        // Load gallery manager and setup UI
        await loadGalleryManager();
        await setupGalleryUI();
        
        if (getSettings().whisperLight) {
            updateThemeStyles();
        }
    }

    //================================================================================
    // MAIN EXECUTION
    //================================================================================

    function main() {
        // Observer for chat messages
        const chatObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.classList.contains("mes")) {
                        processMessage(node);
                    }
                }
            }
        });

        const chatContainer = document.querySelector(CONSTANTS.DOM.CHAT_CONTAINER);
        if (chatContainer) {
            chatObserver.observe(chatContainer, { childList: true });
            processAllMessages();
        }

        // Listener for chat changes (e.g., loading a new chat)
        if (context?.internal?.eventSource) {
            const { eventSource, event_types } = context.internal;
            eventSource.on(event_types.CHAT_CHANGED, () => {
                processAllMessages();
                // Update character override when switching characters
                if (window.LightStylerGalleryManager) {
                    window.LightStylerGalleryManager.updateCurrentCharacterImage();
                }
            });
        }

        // Observer for the settings panel
        const settingsObserver = new MutationObserver(() => {
            if (document.querySelector(CONSTANTS.DOM.EXTENSIONS_SETTINGS)) {
                addLightStylerSettingsDrawer();
                settingsObserver.disconnect();
            }
        });
        settingsObserver.observe(document.body, { childList: true, subtree: true });
    }

    main();
});