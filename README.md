# LightStyler

A comprehensive SillyTavern extension that enhances chat aesthetics with dynamic
avatar layouts, character banners, and alternative image management.

## Images First 

Mobile Layout
![Mobile](https://github.com/user-attachments/assets/bddff92e-23f8-49ff-989d-5b26cba312ce)

PC Layout - Custom or Avatar Banner (Left Avatar Size can be changed)
![SkyBanner](https://github.com/user-attachments/assets/5dd5067e-a2fe-455b-972b-2c2e8bf07440)
![AvatarBanner](https://github.com/user-attachments/assets/d836a3db-2d28-4f74-81ec-ff9a92d8f064)





## 🎨 Core Theme Features

**Dynamic Avatar Layout System:**
- **Large & Small Avatar Modes** - Switch between compact and expanded avatar layouts
- **Custom Avatar Sizing** - Precise pixel control over avatar width and positioning
- **Smart Edit Button Positioning** - Automatically adjusts edit button locations to account for word wrapping with larger avatars
- **Character & Persona Banners** - Adds beautiful header banners above each
  message using character/persona avatars. Inspired by Rivelle's MoonLit Echoes
  whipser theme.
- **Banner Image Positioning** - Fine-tune Y-position (%) to perfectly frame banner images for both characters and personas
- **🆕 Per-Character Position Settings** - Y-position settings are automatically saved and loaded for each character. When you switch between characters, their specific positioning preferences are remembered without needing any manual action or refresh.

**Whisper Light Theme Toggle:**
- **Selective Activation** - Enable/disable the full theme while keeping core
  functionality (UID grabbing, avatar processing) to allow overhauls with css
  snippets. This also corrects character binding in css snippets.
- **CSS Override System** - Non-destructive styling that works with other
  themes. YMMV
- **Performance Optimized** - Lightweight CSS with smart variable management
- **Improved User Experience** - Smart notification timings: quick status updates (2.5s), confirmations (3s), warnings (4s), and errors (5s) for optimal readability

## ✨ Alternative Images Feature

**Universal Character Management:**
- Select and configure any character's alternative images without switching to their chat
- **Smart Auto-Selection** - Refresh button will auto-select and load the
  current character. Images only apply to their corresponding character (no
  cross-character application)
- **Preview Functionality** - Preview images before applying them
- **Easy Reset** - Reset to default avatar works correctly

## 🎯 How Alternative Banner Images Work

**Image Gallery:** Upload photos within Silly Tavern via the image gallery. Character
Management Panel > Select Character > Dropdown Next to Avatar > Show Gallery >
Drop Images > Click 🔃 in LightStyler Settings and it will populate. 

**Character Folder Mapping:** Or place them in `/user/images/[character name]`.
Wherever your data is saved.  Character names must match and will apply to all
characters with same name. All duplicate will use one folder.

**Universal Access:** You can manage any character's alternative images from the
settings panel. If you select "Jane Silly's" folder while in "John
Tavern's" chat, it will apply it to Jane Silly's banner. 

**Auto-Refresh:** Click 🔃 to update the character list and auto-select the current character

## 🔄 Per-Character Position Settings

**Automatic Character Detection:**
- The extension automatically detects when you switch between characters in SillyTavern
- No refresh needed - position settings change instantly when switching chats

**Smart Position Storage:**
- Each character's Persona and Character Y-position settings are saved individually
- When you adjust position settings, they're automatically saved for the current character
- Switching to a different character loads their specific position preferences

**Visual Indicators:**
- A blue indicator box shows when character-specific settings are active
- Displays the current character name and confirms settings are being saved per-character
- Group chats use global settings (no character-specific saving)

**How It Works:**
1. Open any character chat - their stored position settings load automatically
2. Adjust "Persona Image Y-Position (%)" or "Character Image Y-Position (%)" 
3. Settings save instantly for that specific character
4. Switch to another character - their unique settings load automatically
5. Return to the first character - your previous adjustments are preserved

## 📋 Prerequisites

- **SillyTavern** - Latest version recommended

## 🚀 Installation

1. Install with github link via extension manager in ST.
2. Enable the extension in the Extensions panel
3. Configure settings in the LightStyler panel

- **Note** - If the chat gets a bit slow I highly recommend lowering `# Msg. to
  Load` in User Settings > Chat/Message Handling. LightStyler processes each
  message individually for character-specific styling, so fewer messages =
  faster loading.


- **Inspo and Credit**
I was heavily inspired by RivelleDays Moonlit Echoes Extension and Character
styler. Please check them out. This was just my answer to wanting the whisper
theme but without all the extra. 

It started as just a CSS Snippet and became this. 
[RivelleDays Moonlite Echoes Theme](https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme)
[LenAnderson's CSS Snippets](https://github.com/LenAnderson/SillyTavern-CssSnippets)


---
*Created by AI Archaea - Enhancing SillyTavern conversations with style and functionality.*"
