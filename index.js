// /MyLightweightStyler/index.js
/*
================================================================================
 Light Weight Styler v17
================================================================================
  AUTHORS: AI Archaea
  LAST UPDATED: June 25, 2025

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

    // Define a unique identifier for your extension
    const MODULE_NAME = 'LightStyler';

    // Define default settings
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

    // Define a function to get or initialize settings
    function getSettings() {
        // Initialize settings if they don't exist
        if (!extensionSettings[MODULE_NAME]) {
            extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
        }

        // Ensure all default keys exist (helpful after updates)
        const settings = extensionSettings[MODULE_NAME];
        for (const key in defaultSettings) {
            if (settings[key] === undefined) {
                settings[key] = defaultSettings[key];
            }
        }

        return settings;
    }


    // This function gets the character/persona UID
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

    // This function now correctly handles BOTH UID and CSS variable setting
    function processMessage(message) {
        const uid = getMessageAuthorUid(message);
        // Set the UID attribute (for CSS Snippets character-specific rules)
        if (!message.hasAttribute("csc-author-uid")) {
            if (uid) {
                message.setAttribute("csc-author-uid", uid);
            }
        }

        // This logic now runs independently for every message to ensure the variable is set.
        const avatarImg = message.querySelector(".avatar img");
        if (avatarImg) {
            let avatarSrc = avatarImg.getAttribute("src");
            // Fix: Make sure avatarSrc is absolute or root-relative
            if (avatarSrc && !avatarSrc.startsWith("/") && !avatarSrc.startsWith("http")) {
                avatarSrc = "/" + avatarSrc;
            }
            // Check if the variable is already set to avoid unnecessary work
            if (message.style.getPropertyValue("--mes-avatar-url") === "") {
                // Robust Fix: Escape special characters in the URL for CSS
                const escapedSrc = avatarSrc.replace(/['"()\s]/g, "\\$&");
                message.style.setProperty(
                    "--mes-avatar-url",
                    `url('${escapedSrc}')`
                );
            }
        } else {
            // No avatar image found
        }
    }

    function processAllMessages() {
        document.querySelectorAll("#chat .mes").forEach(processMessage);
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.classList.contains("mes")) {
                    processMessage(node);
                }
            }
        }
    });

    const chatContainer = document.getElementById("chat");
    if (chatContainer) {
        observer.observe(chatContainer, { childList: true });
        processAllMessages(); // Process messages already on the page
    }

    // Re-process on chat change
    if (context && context.internal && context.internal.eventSource) {
        const { eventSource, event_types } = context.internal;
        eventSource.on(event_types.CHAT_CHANGED, processAllMessages);
    }

    // --- LightStyler Settings Drawer Logic ---
    async function addLightStylerSettingsDrawer() {
        // Only add once
        if (document.getElementById("lightstyler_whisper_light")) return;
        // Load settings HTML and append to the main settings column
        const settingsHtml = await $.get(
            "scripts/extensions/third-party/LightStyler/settings.html"
        );
        $("#extensions_settings").append(settingsHtml);
        setupWhisperLightToggle();
        setupThemeSettings(); // New function call
        // Apply initial styles AFTER settings are loaded
        if (getSettings().whisperLight) {
            updateThemeStyles();
        }
    }

    // Inject/remove LightStyler CSS and manage theme settings visibility
    function setWhisperLightEnabled(enabled) {
        const id = "lightstyler-style";
        let styleTag = document.getElementById(id);
        const themeSettings = document.getElementById("lightstyler_theme_settings");

        if (enabled) {
            if (!styleTag) {
                styleTag = document.createElement("link");
                styleTag.id = id;
                styleTag.rel = "stylesheet";
                styleTag.type = "text/css";
                styleTag.href =
                    "scripts/extensions/third-party/LightStyler/style.css";
                document.head.appendChild(styleTag);
            }
            if (themeSettings) themeSettings.style.display = "";
            updateThemeStyles(); // Apply styles when enabling
        } else {
            if (styleTag) styleTag.remove();
            if (themeSettings) themeSettings.style.display = "none";
            // Remove custom styles when disabled
            document.documentElement.style.removeProperty('--avatar-width');
            document.documentElement.style.removeProperty('--edit-buttons-top-offset');
            document.documentElement.style.removeProperty('--persona-banner-pos');
            document.documentElement.style.removeProperty('--character-banner-pos');
        }
    }

    // Setup toggle logic for Whisper Light
    function setupWhisperLightToggle() {
        const checkbox = document.getElementById("lightstyler_whisper_light");
        if (!checkbox) return;

        const settings = getSettings();

        // Load saved state from settings
        checkbox.checked = settings.whisperLight;
        setWhisperLightEnabled(checkbox.checked);

        checkbox.addEventListener("change", () => {
            setWhisperLightEnabled(checkbox.checked);
            settings.whisperLight = checkbox.checked;
            saveSettingsDebounced();
        });
    }

    // NEW: Setup logic for the theme customization settings
    function setupThemeSettings() {
        const largeModeRadio = document.getElementById("lightstyler_large_avatar_mode");
        const smallModeRadio = document.getElementById("lightstyler_small_avatar_mode");
        const avatarWidthInput = document.getElementById("lightstyler_avatar_width");
        const editOffsetInput = document.getElementById("lightstyler_edit_offset");
        const resetButton = document.getElementById("lightstyler_reset_button");
        // Banner position controls
        const personaBannerPosInput = document.getElementById("lightstyler_persona_banner_pos");
        const characterBannerPosInput = document.getElementById("lightstyler_character_banner_pos");
        const bannerPosResetButton = document.getElementById("lightstyler_bannerpos_reset_button");

        if (!largeModeRadio || !smallModeRadio || !avatarWidthInput || !editOffsetInput || !resetButton || !personaBannerPosInput || !characterBannerPosInput || !bannerPosResetButton) {
            return;
        }

        // Set default values
        const defaults = {
            large: { width: 304, offset: 390 },
            small: { width: 70, offset: 90 },
            personaBannerPos: 15,
            characterBannerPos: 27
        };


        function applyMode(mode) {
            const settings = getSettings();
            const newWidth = settings[`avatar_width_${mode}`] ?? defaults[mode].width;
            const newOffset = settings[`edit_offset_${mode}`] ?? defaults[mode].offset;
            avatarWidthInput.value = newWidth;
            editOffsetInput.value = newOffset;
        }

        function applyBannerPositions() {
            const settings = getSettings();
            const personaPos = settings.personaBannerPos ?? defaults.personaBannerPos;
            const characterPos = settings.characterBannerPos ?? defaults.characterBannerPos;
            personaBannerPosInput.value = personaPos;
            characterBannerPosInput.value = characterPos;
        }

        resetButton.addEventListener("click", () => {
            const settings = getSettings();
            const mode = document.querySelector('input[name="avatar_mode"]:checked').value;
            // Restore default values directly
            settings[`avatar_width_${mode}`] = defaultSettings[`avatar_width_${mode}`];
            settings[`edit_offset_${mode}`] = defaultSettings[`edit_offset_${mode}`];
            saveSettingsDebounced();
            applyMode(mode);
            updateThemeStyles();
        });

        bannerPosResetButton.addEventListener("click", () => {
            const settings = getSettings();
            settings.personaBannerPos = defaultSettings.personaBannerPos;
            settings.characterBannerPos = defaultSettings.characterBannerPos;
            saveSettingsDebounced();
            applyBannerPositions();
            updateThemeStyles();
        });

        largeModeRadio.addEventListener("change", () => {
            if (largeModeRadio.checked) {
                getSettings().avatarMode = "large";
                saveSettingsDebounced();
                applyMode("large");
                updateThemeStyles();
            }
        });

        smallModeRadio.addEventListener("change", () => {
            if (smallModeRadio.checked) {
                getSettings().avatarMode = "small";
                saveSettingsDebounced();
                applyMode("small");
                updateThemeStyles();
            }
        });

        avatarWidthInput.addEventListener("input", () => {
            const settings = getSettings();
            const mode = document.querySelector('input[name="avatar_mode"]:checked').value;
            settings[`avatar_width_${mode}`] = avatarWidthInput.value;
            saveSettingsDebounced();
            updateThemeStyles();
        });
        editOffsetInput.addEventListener("input", () => {
            const settings = getSettings();
            const mode = document.querySelector('input[name="avatar_mode"]:checked').value;
            settings[`edit_offset_${mode}`] = editOffsetInput.value;
            saveSettingsDebounced();
            updateThemeStyles();
        });
        personaBannerPosInput.addEventListener("input", () => {
            const settings = getSettings();
            settings.personaBannerPos = personaBannerPosInput.value;
            saveSettingsDebounced();
            updateThemeStyles();
        });
        characterBannerPosInput.addEventListener("input", () => {
            const settings = getSettings();
            settings.characterBannerPos = characterBannerPosInput.value;
            saveSettingsDebounced();
            updateThemeStyles();
        });

        // Load saved state
        const savedMode = getSettings().avatarMode;
        if (savedMode === "small") {
            smallModeRadio.checked = true;
            largeModeRadio.checked = false;
            applyMode("small");
        } else {
            largeModeRadio.checked = true;
            smallModeRadio.checked = false;
            applyMode("large");
        }
        applyBannerPositions();
        updateThemeStyles();
    }

    // NEW: Update CSS variables and save to extensionSettings
    function updateThemeStyles() {
        const whisperLightEnabled = document.getElementById("lightstyler_whisper_light")?.checked;
        if (!whisperLightEnabled) return;

        const modeEl = document.querySelector('input[name="avatar_mode"]:checked');
        const avatarWidthEl = document.getElementById("lightstyler_avatar_width");
        const editOffsetEl = document.getElementById("lightstyler_edit_offset");
        const personaBannerPosEl = document.getElementById("lightstyler_persona_banner_pos");
        const characterBannerPosEl = document.getElementById("lightstyler_character_banner_pos");

        // Do not run if the settings aren't loaded into the DOM yet.
        if (!modeEl || !avatarWidthEl || !editOffsetEl || !personaBannerPosEl || !characterBannerPosEl) return;

        const mode = modeEl.value;
        const avatarWidth = avatarWidthEl.value;
        const editOffset = editOffsetEl.value;
        const personaBannerPos = personaBannerPosEl.value;
        const characterBannerPos = characterBannerPosEl.value;

        // Set CSS variables
        document.documentElement.style.setProperty('--avatar-width', `${avatarWidth}px`);
        document.documentElement.style.setProperty('--edit-buttons-top-offset', `${editOffset}px`);
        document.documentElement.style.setProperty('--persona-banner-pos', `${personaBannerPos}%`);
        document.documentElement.style.setProperty('--character-banner-pos', `${characterBannerPos}%`);

        // Do not update avatarMode in settings here! Only update CSS.
    }


    // Wait for settings UI to exist, then add our drawer
    const settingsObserver = new MutationObserver(() => {
        if (document.querySelector("#extensions_settings")) {
            addLightStylerSettingsDrawer();
            settingsObserver.disconnect();
        }
    });
    settingsObserver.observe(document.body, { childList: true, subtree: true });
});
