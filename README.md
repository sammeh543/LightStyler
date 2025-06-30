"# LightStyler

A comprehensive SillyTavern extension that enhances chat aesthetics with dynamic avatar layouts, character banners, and alternative image management.

## 🎨 Core Theme Features

**Dynamic Avatar Layout System:**
- **Large & Small Avatar Modes** - Switch between compact and expanded avatar layouts
- **Custom Avatar Sizing** - Precise pixel control over avatar width and positioning
- **Smart Edit Button Positioning** - Automatically adjusts edit button locations to account for word wrapping with larger avatars
- **Character & Persona Banners** - Adds beautiful header banners above each message using character/persona avatars
- **Banner Image Positioning** - Fine-tune Y-position (%) to perfectly frame banner images for both characters and personas

**Whisper Light Theme Toggle:**
- **Selective Activation** - Enable/disable the full theme while keeping core functionality (UID grabbing, avatar processing)
- **CSS Override System** - Non-destructive styling that works with other themes
- **Performance Optimized** - Lightweight CSS with smart variable management

## ✨ Alternative Images Feature

**Universal Character Management:**
- Select and configure any character's alternative images without switching to their chat
- **Smart Auto-Selection** - Refresh button will auto-select and load the current character
- **Character-Specific Images** - Images only apply to their corresponding character (no cross-contamination)
- **Clear Warning Text** - Explains that "Killa's" images won't work for other characters
- **Helpful Messages** - Shows "No images found" when a character has no gallery folder
- **Persistent Settings** - All settings save properly and persist across sessions
- **Preview Functionality** - Preview images before applying them
- **Easy Reset** - Reset to default avatar works correctly

## 🎯 How Alternative Images Work

**Universal Access:** You can manage any character's alternative images from the settings panel

**Character Folder Mapping:** Each character's images come from their specific `/user/images/[character name]` folder

**Smart Application:** If you select "Death's" image while configuring "Killa", it won't apply to Killa (as intended)

**Proper Fallbacks:** Characters without gallery folders show helpful messages

**Auto-Refresh:** Click refresh to update the character list and auto-select the current character

## 📋 Prerequisites

- **SillyTavern** - Latest version recommended
- **Gallery Extension** - Required for alternative images feature (images must be uploaded via Gallery first)

## 🚀 Installation

1. Place the LightStyler folder in your SillyTavern extensions directory
2. Restart SillyTavern
3. Enable the extension in the Extensions panel
4. Configure settings in the LightStyler panel

## ⚙️ Configuration

**Theme Settings:**
- Toggle Whisper Light theme on/off
- Choose between Large/Small avatar modes
- Adjust avatar width and edit button offsets
- Fine-tune banner image Y-positioning

**Alternative Images:**
- Select any character from the dropdown
- Choose from their available gallery images
- Preview before applying
- Reset to default when needed

## 🎨 Technical Features

- **Per-Message Processing** - Each message gets individual styling treatment
- **CSS Variable System** - Dynamic theming with real-time updates
- **Smart Caching** - Efficient image loading and character data management
- **Event-Driven Updates** - Automatically refreshes on chat changes
- **Non-Destructive** - Doesn't interfere with other extensions or themes

---

*Created by AI Archaea - Enhancing SillyTavern conversations with style and functionality.*" 
