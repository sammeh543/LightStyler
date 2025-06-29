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
    const context = window.SillyTavern.getContext();
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
        if (localStorage.getItem("lightstyler_whisper_light") !== "false") {
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
        // Load saved state from localStorage (or default to enabled)
        const saved =
            localStorage.getItem("lightstyler_whisper_light") !== "false"; // Default to true
        checkbox.checked = saved;
        setWhisperLightEnabled(saved);
        checkbox.addEventListener("change", () => {
            setWhisperLightEnabled(checkbox.checked);
            localStorage.setItem("lightstyler_whisper_light", checkbox.checked);
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
            const newWidth = localStorage.getItem(`lightstyler_avatar_width_${mode}`) || defaults[mode].width;
            const newOffset = localStorage.getItem(`lightstyler_edit_offset_${mode}`) || defaults[mode].offset;

            avatarWidthInput.value = newWidth;
            editOffsetInput.value = newOffset;
            updateThemeStyles();
        }

        function applyBannerPositions() {
            const personaPos = localStorage.getItem("lightstyler_persona_banner_pos") || defaults.personaBannerPos;
            const characterPos = localStorage.getItem("lightstyler_character_banner_pos") || defaults.characterBannerPos;
            personaBannerPosInput.value = personaPos;
            characterBannerPosInput.value = characterPos;
            updateThemeStyles();
        }

        resetButton.addEventListener("click", () => {
            const mode = document.querySelector('input[name="avatar_mode"]:checked').value;
            // Clear stored values
            localStorage.removeItem(`lightstyler_avatar_width_${mode}`);
            localStorage.removeItem(`lightstyler_edit_offset_${mode}`);
            // Re-apply the defaults for the current mode
            applyMode(mode);
        });

        bannerPosResetButton.addEventListener("click", () => {
            localStorage.removeItem("lightstyler_persona_banner_pos");
            localStorage.removeItem("lightstyler_character_banner_pos");
            applyBannerPositions();
        });

        largeModeRadio.addEventListener("change", () => {
            if (largeModeRadio.checked) {
                localStorage.setItem("lightstyler_avatar_mode", "large");
                applyMode("large");
            }
        });

        smallModeRadio.addEventListener("change", () => {
            if (smallModeRadio.checked) {
                localStorage.setItem("lightstyler_avatar_mode", "small");
                applyMode("small");
            }
        });

        avatarWidthInput.addEventListener("input", updateThemeStyles);
        editOffsetInput.addEventListener("input", updateThemeStyles);
        personaBannerPosInput.addEventListener("input", updateThemeStyles);
        characterBannerPosInput.addEventListener("input", updateThemeStyles);

        // Load saved state
        const savedMode = localStorage.getItem("lightstyler_avatar_mode") || "large";
        if (savedMode === "small") {
            smallModeRadio.checked = true;
            applyMode("small");
        } else {
            largeModeRadio.checked = true;
            applyMode("large");
        }
        applyBannerPositions();
    }

    // NEW: Update CSS variables and save to localStorage
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

        // Save to localStorage
        localStorage.setItem(`lightstyler_avatar_width_${mode}`, avatarWidth);
        localStorage.setItem(`lightstyler_edit_offset_${mode}`, editOffset);
        localStorage.setItem("lightstyler_persona_banner_pos", personaBannerPos);
        localStorage.setItem("lightstyler_character_banner_pos", characterBannerPos);
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
