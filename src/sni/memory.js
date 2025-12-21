// Memory mapping bases
const WRAM_START = 0xF50000;  // FX Pak Pro address space
const SRAM_START = 0xE00000;

// SNES A-bus addresses for direct access
const SNES_WRAM_BASE = 0x7E0000;

// ALTTP Memory Addresses (from Archipelago research)
// Using SNES A-bus addresses directly
const MEMORY_ADDRESSES = {
  // Health & Hearts (in save data area)
  CURRENT_HEALTH: SNES_WRAM_BASE + 0xF36D,  // Current health (each 0x08 = 1 heart)
  MAX_HEALTH: SNES_WRAM_BASE + 0xF36C,      // Maximum health capacity
  INVINCIBLE: WRAM_START + 0x037B,          // Invincibility state
  DAMAGE_TO_APPLY: WRAM_START + 0x0373,     // Damage to apply next frame

  // Game State
  GAME_MODE: WRAM_START + 0x10,             // Current game mode
  CURRENT_ROOM: WRAM_START + 0xA0,          // Current room ID (2 bytes)
  CURRENT_ROOM_HIGH: WRAM_START + 0xA1,     // Current room ID high byte

  // Player Position (for warping)
  PLAYER_X_POS: WRAM_START + 0x22,          // X coordinate (2 bytes)
  PLAYER_Y_POS: WRAM_START + 0x20,          // Y coordinate (2 bytes)
  CURRENT_SCREEN: WRAM_START + 0x8A,        // Current screen ID
  DUNGEON_ID: WRAM_START + 0x040C,          // Current dungeon

  // Layer positions
  BG1_H_OFFSET: WRAM_START + 0xE0,          // BG1 Horizontal scroll
  BG1_V_OFFSET: WRAM_START + 0xE2,          // BG1 Vertical scroll
  BG2_H_OFFSET: WRAM_START + 0xE6,          // BG2 Horizontal scroll
  BG2_V_OFFSET: WRAM_START + 0xE8,          // BG2 Vertical scroll

  // Camera positions
  CAMERA_X: WRAM_START + 0x061C,            // Camera X position
  CAMERA_Y: WRAM_START + 0x061E,            // Camera Y position

  // Eastern Palace entrance coordinates (example)
  EASTERN_PALACE_ROOM: 0xC9,                // Room ID for Eastern Palace entrance
  EASTERN_PALACE_X: 0x0078,                 // X coordinate (middle of room)
  EASTERN_PALACE_Y: 0x00B8,                 // Y coordinate (near entrance)

  // Overworld/Underworld indicator
  INDOORS_FLAG: WRAM_START + 0x1B,          // 0 = outdoors, 1 = indoors

  // Transition trigger
  MODULE_INDEX: WRAM_START + 0x10,          // Main module
  SUBMODULE_INDEX: WRAM_START + 0x11,       // Submodule for transitions
};

const GAME_MODES = {
  INGAME: [0x07, 0x09, 0x0B],
  DEATH: [0x12],
  ENDGAME: [0x19, 0x1A],
  DUNGEON: 0x07,
  OVERWORLD: 0x09,
  SPECIAL: 0x0B,
  LOADING: 0x0F,
  TRANSITION: 0x11
};

module.exports = { MEMORY_ADDRESSES, GAME_MODES, WRAM_START };