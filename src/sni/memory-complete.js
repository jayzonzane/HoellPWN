// Complete Super Mario World Memory Map
// Sources: SMW Central, Data Crystal, SnesLab, TASVideos, smwrammap
// This file contains ALL known memory addresses for SMW modifications

// Base addresses for SNES memory regions
const SNES_WRAM_BASE = 0x7E0000;

// Complete memory address map
const MEMORY_ADDRESSES = {
  // ============= PLAYER STATE =============
  POWERUP_STATUS: SNES_WRAM_BASE + 0x0019,        // Power-up state: 0=small, 1=super, 2=cape, 3=fire
  LIVES: SNES_WRAM_BASE + 0x0DB4,                 // Mario's lives (also at 0x0DBE in single player)
  COINS: SNES_WRAM_BASE + 0x0DBF,                 // Coin counter (100 = 1 life)
  RESERVE_ITEM: SNES_WRAM_BASE + 0x0DC1,          // Reserve item box: 0=none, 1=mushroom, 2=fire, 3=star, 4=feather
  PLAYER_DIRECTION: SNES_WRAM_BASE + 0x0076,      // Facing direction (0=right, 1=left)
  PLAYER_BLOCKED_STATUS: SNES_WRAM_BASE + 0x0077, // Blocked/collision flags
  PLAYER_AIRBORNE: SNES_WRAM_BASE + 0x0072,       // Airborne state indicator
  INVINCIBILITY_TIMER: SNES_WRAM_BASE + 0x1490,   // Star power timer (0x30 = standard duration)

  // ============= PLAYER PHYSICS =============
  PLAYER_X_SPEED: SNES_WRAM_BASE + 0x007B,        // Horizontal velocity (signed, subpixels/frame)
  PLAYER_Y_SPEED: SNES_WRAM_BASE + 0x007D,        // Vertical velocity (signed, subpixels/frame)
  PLAYER_X_POSITION: SNES_WRAM_BASE + 0x0094,     // X position in pixels (low byte)
  PLAYER_Y_POSITION: SNES_WRAM_BASE + 0x0096,     // Y position in pixels (low byte)
  PLAYER_X_SUBPIXEL: SNES_WRAM_BASE + 0x13DA,     // X sub-pixel coordinate
  PLAYER_Y_SUBPIXEL: SNES_WRAM_BASE + 0x13DC,     // Y sub-pixel coordinate
  PLAYER_X_SCREEN: SNES_WRAM_BASE + 0x007E,       // Player screen-relative X position
  PLAYER_Y_SCREEN: SNES_WRAM_BASE + 0x0080,       // Player screen-relative Y position
  P_METER: SNES_WRAM_BASE + 0x13E4,               // Run meter (0-112, 112=max speed)
  TAKEOFF_METER: SNES_WRAM_BASE + 0x149F,         // Cape flight meter (decrements during flight)

  // ============= YOSHI STATE =============
  YOSHI_COLOR: SNES_WRAM_BASE + 0x13C7,           // 0=green, 1=yellow, 2=red, 3=blue
  YOSHI_TONGUE_TIMER: SNES_WRAM_BASE + 0x18AC,    // Swallow timer
  BERRY_COUNTER_1: SNES_WRAM_BASE + 0x18D4,       // Pink berry counter
  BERRY_COUNTER_2: SNES_WRAM_BASE + 0x18D5,       // Green berry counter
  BERRY_COUNTER_3: SNES_WRAM_BASE + 0x18D6,       // Red berry counter
  P_BALLOON_TIMER: SNES_WRAM_BASE + 0x1891,       // P-Balloon flight timer

  // ============= SPRITE TABLES (12 normal sprites) =============
  SPRITE_STATUS: SNES_WRAM_BASE + 0x14C8,         // Sprite status (12 bytes): 0=inactive, non-zero=active states
  SPRITE_TYPE: SNES_WRAM_BASE + 0x009E,           // Sprite ID/type table (12 bytes)
  SPRITE_X_LOW: SNES_WRAM_BASE + 0x00E4,          // Sprite X position low byte (12 bytes)
  SPRITE_X_HIGH: SNES_WRAM_BASE + 0x14E0,         // Sprite X position high byte (12 bytes)
  SPRITE_Y_LOW: SNES_WRAM_BASE + 0x00D8,          // Sprite Y position low byte (12 bytes)
  SPRITE_Y_HIGH: SNES_WRAM_BASE + 0x14D4,         // Sprite Y position high byte (12 bytes)
  SPRITE_X_SUBPIXEL: SNES_WRAM_BASE + 0x14F8,     // Sprite X sub-pixel table (12 bytes)
  SPRITE_Y_SUBPIXEL: SNES_WRAM_BASE + 0x14EC,     // Sprite Y sub-pixel table (12 bytes)
  SPRITE_X_SPEED: SNES_WRAM_BASE + 0x00B6,        // Sprite X velocity table (12 bytes)
  SPRITE_Y_SPEED: SNES_WRAM_BASE + 0x00AA,        // Sprite Y velocity table (12 bytes)
  SPRITE_BLOCKED_STATUS: SNES_WRAM_BASE + 0x1588, // Sprite blocked/collision flags (12 bytes)
  SPRITE_CARRYING_FLAG: SNES_WRAM_BASE + 0x1470,  // Item carrying state (12 bytes)
  SPRITE_TWEAKER_1: SNES_WRAM_BASE + 0x1656,      // Sprite tweaker byte 1 (12 bytes)
  SPRITE_TWEAKER_2: SNES_WRAM_BASE + 0x1662,      // Sprite tweaker byte 2 (12 bytes)
  SPRITE_TWEAKER_3: SNES_WRAM_BASE + 0x166E,      // Sprite tweaker byte 3 (12 bytes)
  SPRITE_TWEAKER_4: SNES_WRAM_BASE + 0x167A,      // Sprite tweaker byte 4 (12 bytes)
  SPRITE_TWEAKER_5: SNES_WRAM_BASE + 0x1686,      // Sprite tweaker byte 5 (12 bytes)

  // ============= EXTENDED SPRITES (10 slots) =============
  EXT_SPRITE_TYPE: SNES_WRAM_BASE + 0x170B,       // Extended sprite type (10 bytes)
  EXT_SPRITE_X_LOW: SNES_WRAM_BASE + 0x171F,      // Extended sprite X low (10 bytes)
  EXT_SPRITE_X_HIGH: SNES_WRAM_BASE + 0x1733,     // Extended sprite X high (10 bytes)
  EXT_SPRITE_Y_LOW: SNES_WRAM_BASE + 0x1715,      // Extended sprite Y low (10 bytes)
  EXT_SPRITE_Y_HIGH: SNES_WRAM_BASE + 0x1729,     // Extended sprite Y high (10 bytes)
  EXT_SPRITE_X_SPEED: SNES_WRAM_BASE + 0x1747,    // Extended sprite X velocity (10 bytes)
  EXT_SPRITE_Y_SPEED: SNES_WRAM_BASE + 0x173D,    // Extended sprite Y velocity (10 bytes)

  // ============= MINOR EXTENDED SPRITES (12 slots) =============
  MINOR_EXT_SPRITE_TYPE: SNES_WRAM_BASE + 0x17F0, // Minor extended sprite type (12 bytes)
  MINOR_EXT_SPRITE_X_LOW: SNES_WRAM_BASE + 0x1808, // Minor extended sprite X low (12 bytes)
  MINOR_EXT_SPRITE_X_HIGH: SNES_WRAM_BASE + 0x1820, // Minor extended sprite X high (12 bytes)
  MINOR_EXT_SPRITE_Y_LOW: SNES_WRAM_BASE + 0x17FC, // Minor extended sprite Y low (12 bytes)
  MINOR_EXT_SPRITE_Y_HIGH: SNES_WRAM_BASE + 0x1814, // Minor extended sprite Y high (12 bytes)

  // ============= SPINNING COINS & EFFECTS =============
  SPINNING_COIN_X: SNES_WRAM_BASE + 0x17C0,       // Spinning coin X position (4 bytes)
  SPINNING_COIN_Y: SNES_WRAM_BASE + 0x17C4,       // Spinning coin Y position (4 bytes)
  SMOKE_SPRITE_X: SNES_WRAM_BASE + 0x17C8,        // Smoke sprite X position (4 bytes)
  SMOKE_SPRITE_Y: SNES_WRAM_BASE + 0x17CC,        // Smoke sprite Y position (4 bytes)

  // ============= LEVEL & WORLD STATE =============
  GAME_MODE: SNES_WRAM_BASE + 0x0100,             // Current game mode (0x0E=level, 0x0C=overworld, etc.)
  TRANSLEVEL_NUMBER: SNES_WRAM_BASE + 0x13BF,     // Current level number (0x00-0xFF)
  CURRENT_WORLD: SNES_WRAM_BASE + 0x1F11,         // Current world/submap (0-6 = worlds 1-7)
  CURRENT_SUBMAP: SNES_WRAM_BASE + 0x1F12,        // Current submap/screen
  CHECKPOINT_FLAG: SNES_WRAM_BASE + 0x13CE,       // Midpoint checkpoint passed flag
  EXIT_TYPE: SNES_WRAM_BASE + 0x141A,             // Exit type (0=normal, 1=secret)
  LEVEL_TILES_STATE: SNES_WRAM_BASE + 0x13D0,     // Level tile modification state

  // ============= SPRITE LOADING =============
  SPRITE_LOAD_STATUS: SNES_WRAM_BASE + 0x1938,    // Sprite load status table (128 bytes)

  // ============= CAMERA & SCROLLING =============
  CAMERA_X_POSITION: SNES_WRAM_BASE + 0x1462,     // Camera/screen X position
  CAMERA_Y_POSITION: SNES_WRAM_BASE + 0x1464,     // Camera/screen Y position
  LAYER_1_X_MIRROR: SNES_WRAM_BASE + 0x001A,      // Layer 1 X position mirror
  LAYER_1_Y_MIRROR: SNES_WRAM_BASE + 0x001C,      // Layer 1 Y position mirror
  LAYER_2_X_MIRROR: SNES_WRAM_BASE + 0x001E,      // Layer 2 X position mirror
  LAYER_2_Y_MIRROR: SNES_WRAM_BASE + 0x0020,      // Layer 2 Y position mirror
  SCREEN_VERTICAL_SIZE: SNES_WRAM_BASE + 0x13D7,  // Screen vertical size (2 bytes)

  // ============= TIMER & SCORE =============
  FRAME_COUNTER: SNES_WRAM_BASE + 0x0F30,         // Global frame counter
  TIMER_HUNDREDS: SNES_WRAM_BASE + 0x0F31,        // Timer display (hundreds digit)
  TIMER_TENS: SNES_WRAM_BASE + 0x0F32,            // Timer display (tens digit)
  TIMER_ONES: SNES_WRAM_BASE + 0x0F33,            // Timer display (ones digit)
  SCORE_DIGIT_1: SNES_WRAM_BASE + 0x0F34,         // Score counter (lowest digit)
  SCORE_DIGIT_2: SNES_WRAM_BASE + 0x0F35,         // Score counter
  SCORE_DIGIT_3: SNES_WRAM_BASE + 0x0F36,         // Score counter
  SCORE_DIGIT_4: SNES_WRAM_BASE + 0x0F37,         // Score counter (highest digit)

  // ============= OVERWORLD STATE =============
  LEVEL_FLAGS_BEATEN: SNES_WRAM_BASE + 0x1EA2,    // Level beaten flags (96 bytes)
  LEVEL_FLAGS_MIDWAY: SNES_WRAM_BASE + 0x1F02,    // Midway entrance flags (24 bytes)
  SWITCH_PALACE_STATE: SNES_WRAM_BASE + 0x1F27,   // Switch block states (4 palaces)
  STAR_WORLD_FLAGS: SNES_WRAM_BASE + 0x1F2E,      // Special/Star World access flags
  YOSHI_COINS_COLLECTED: SNES_WRAM_BASE + 0x1F2F, // Yoshi coin collection flags

  // ============= CONTROLLER INPUT =============
  CONTROLLER_1_CURRENT: SNES_WRAM_BASE + 0x0015,  // Currently pressed buttons (set 1)
  CONTROLLER_1_PRESSED: SNES_WRAM_BASE + 0x0016,  // Just pressed this frame (set 1)
  CONTROLLER_2_CURRENT: SNES_WRAM_BASE + 0x0017,  // Currently pressed buttons (set 2)
  CONTROLLER_2_PRESSED: SNES_WRAM_BASE + 0x0018,  // Just pressed this frame (set 2)

  // ============= SPECIAL TIMERS & FLAGS =============
  P_SWITCH_TIMER: SNES_WRAM_BASE + 0x14AD,        // P-Switch timer (9 seconds = ~0x200 frames)
  SILVER_PSWITCH_TIMER: SNES_WRAM_BASE + 0x14AE,  // Silver P-Switch timer (turns enemies to silver coins)
  STAR_POWER_TIMER: SNES_WRAM_BASE + 0x1490,      // Star power invincibility timer
  ON_OFF_SWITCH_STATE: SNES_WRAM_BASE + 0x14B0,   // ON/OFF switch state
  CAPE_SPIN_TIMER: SNES_WRAM_BASE + 0x1410,       // Cape spin attack timer

  // ============= ENVIRONMENTAL EFFECTS (HoellCC) =============
  UNDERWATER_FLAG: SNES_WRAM_BASE + 0x0085,       // Swimming physics flag (0=land, 1=water)
  ICE_FLAG: SNES_WRAM_BASE + 0x0086,              // Slippery physics flag (0=normal, 1=ice)
  PLAYER_FROZEN: SNES_WRAM_BASE + 0x0088,         // Player frozen flag (0=normal, 1=frozen)

  // ============= MARIOMOD SPRITE SPAWNING (HoellCC) =============
  // Requires MarioMod ASM patch applied to ROM
  MARIOMOD_SPAWN_SPRITE_FLAG: SNES_WRAM_BASE + 0x188E,       // Write 0x01 to trigger sprite spawn
  MARIOMOD_SPAWN_SPRITE_ID: SNES_WRAM_BASE + 0x1869,         // Sprite ID to spawn (0-200)
  MARIOMOD_SPAWN_SPRITE_IS_CUSTOM: SNES_WRAM_BASE + 0x1868,  // 0=normal sprite, 1=custom sprite
  MARIOMOD_SPAWN_SPRITE_X_OFFSET_POS: SNES_WRAM_BASE + 0x146C, // Positive X offset (pixels right of Mario)
  MARIOMOD_SPAWN_SPRITE_X_OFFSET_NEG: SNES_WRAM_BASE + 0x146D, // Negative X offset (pixels left of Mario)
  MARIOMOD_SPAWN_SPRITE_Y_OFFSET_POS: SNES_WRAM_BASE + 0x146E, // Positive Y offset (pixels down from Mario)
  MARIOMOD_SPAWN_SPRITE_Y_OFFSET_NEG: SNES_WRAM_BASE + 0x146F, // Negative Y offset (pixels up from Mario)

  // ============= MARIOMOD BLOCK SPAWNING (HoellCC) =============
  // Requires MarioMod ASM patch applied to ROM
  MARIOMOD_SPAWN_BLOCK_FLAG: SNES_WRAM_BASE + 0x188A,        // Write 0x01 to trigger block spawn
  MARIOMOD_SPAWN_BLOCK_ID: SNES_WRAM_BASE + 0x1870,          // Block/tile ID to spawn
  MARIOMOD_SPAWN_BLOCK_X_OFFSET_POS: SNES_WRAM_BASE + 0x1476, // Positive X offset for block
  MARIOMOD_SPAWN_BLOCK_X_OFFSET_NEG: SNES_WRAM_BASE + 0x1477, // Negative X offset for block
  MARIOMOD_SPAWN_BLOCK_Y_OFFSET_POS: SNES_WRAM_BASE + 0x1478, // Positive Y offset for block
  MARIOMOD_SPAWN_BLOCK_Y_OFFSET_NEG: SNES_WRAM_BASE + 0x1479, // Negative Y offset for block
  MARIOMOD_KAIZO_BLOCK_TRIGGER: SNES_WRAM_BASE + 0x1DEF,     // Kaizo block spawn trigger (0x01=spawn on jump, 0x02=muncher on jump)
  MARIOMOD_SPRITE_REPLACE_TRIGGER: SNES_WRAM_BASE + 0x1DF0,  // Random sprite replace trigger (chaos effect)

  // ============= RNG & SYSTEM =============
  RNG_BYTE_1: SNES_WRAM_BASE + 0x148D,            // Random number generator (byte 1)
  RNG_BYTE_2: SNES_WRAM_BASE + 0x148E,            // Random number generator (byte 2)
  PAUSE_FLAG: SNES_WRAM_BASE + 0x0013,            // Game paused flag

  // ============= OAM (SPRITE GRAPHICS) =============
  OAM_SPRITE_TABLE: SNES_WRAM_BASE + 0x0200,      // OAM sprite data (544 bytes: 128 sprites × 4 bytes + 32 bytes)
  OAM_SIZE_BITS: SNES_WRAM_BASE + 0x0420,         // Sprite size/position high bits (128 bytes)

  // ============= GRAPHICS & VRAM =============
  VRAM_UPLOAD_INDEX_1: SNES_WRAM_BASE + 0x0045,   // VRAM upload scheduling indices
  VRAM_UPLOAD_INDEX_2: SNES_WRAM_BASE + 0x0046,
  GFX_FILE_POINTER_1: SNES_WRAM_BASE + 0x0101,    // Graphics file pointers
  GFX_FILE_POINTER_2: SNES_WRAM_BASE + 0x0102,

  // ============= LEVEL DATA BUFFERS =============
  LAYER_1_TILEMAP_BUFFER: SNES_WRAM_BASE + 0x1BE6, // Layer 1 VRAM upload staging (128 bytes)
  LAYER_2_TILEMAP_BUFFER: SNES_WRAM_BASE + 0x1CE8, // Layer 2 VRAM upload staging (256 bytes)

  // ============= MAP16 TILES (DECOMPRESSED) =============
  MAP16_LOW_BYTES: SNES_WRAM_BASE + 0xC800,       // Map16 tile data low bytes (0x3800 bytes)
  MAP16_HIGH_BYTES: SNES_WRAM_BASE + 0xFC00,      // Map16 tile data high bytes (0x3800 bytes)
};

// Power-up type constants
const POWERUP_TYPES = {
  SMALL: 0x00,
  SUPER: 0x01,
  CAPE: 0x02,
  FIRE: 0x03
};

// Reserve item type constants
const RESERVE_ITEMS = {
  NONE: 0x00,
  MUSHROOM: 0x01,
  FIRE_FLOWER: 0x02,
  STAR: 0x03,
  FEATHER: 0x04
};

// Yoshi color constants
const YOSHI_COLORS = {
  GREEN: 0x00,
  YELLOW: 0x01,
  RED: 0x02,
  BLUE: 0x03
};

// Common sprite IDs (partial list - to be expanded during implementation)
const SPRITE_TYPES = {
  // Standard Enemies
  GREEN_KOOPA_TROOPA: 0x01,
  RED_KOOPA_TROOPA: 0x02,
  YELLOW_KOOPA_TROOPA: 0x03,
  GREEN_KOOPA_PARATROOPA: 0x04,
  RED_KOOPA_PARATROOPA: 0x05,
  YELLOW_KOOPA_PARATROOPA: 0x06,
  HOPPING_FLAME: 0x07,
  BUZZY_BEETLE: 0x08,
  SPINY: 0x09,
  CHEEP_CHEEP: 0x0A,
  GOOMBA: 0x0B,
  PIRANHA_PLANT: 0x0C,
  VOLCANO_LOTUS: 0x0D,
  BOO: 0x0E,
  BOO_BLOCK: 0x0F,
  SHELL_KICKED: 0x10,
  BUZZY_SHELL_KICKED: 0x11,

  // Flying/Air Enemies
  BULLET_BILL: 0x18,
  TORPEDO_TED: 0x19,
  WIGGLER: 0x1A,
  REX: 0x1B,
  SWOOPER: 0x1C,

  // Misc Enemies
  MONTY_MOLE: 0x1D,
  SUMO_BROTHER: 0x1E,
  AMAZING_FLYIN_HAMMER_BROTHER: 0x1F,
  DRY_BONES: 0x20,
  BOO_CIRCLE: 0x21,
  CHARGIN_CHUCK: 0x22,
  THWOMP: 0x23,
  MAGIKOOPA: 0x24,

  // Bosses
  REZNOR: 0x30,
  BOWSER: 0x31,

  // Items/Power-ups (spawnable)
  MUSHROOM: 0x74,
  FIRE_FLOWER: 0x75,
  CAPE_FEATHER: 0x76,
  STAR_POWER: 0x77,
  YOSHI_EGG: 0x78,
  ONE_UP_MUSHROOM: 0x79,
  COIN_FROM_BLOCK: 0x7A,
  SPRINGBOARD: 0x7B,
  P_SWITCH: 0x7C,
  VINE: 0x7D,
  KEY: 0x7E,
  TRAMPOLINE: 0x7F,

  // Platform sprites
  MOVING_PLATFORM: 0x35,
  FALLING_PLATFORM: 0x36,

  // Other
  BOB_OMB: 0x3D,
  BANZAI_BILL: 0x3E
};

// Game mode constants
const GAME_MODES = {
  OVERWORLD: 0x0C,
  LEVEL: 0x0E,
  TITLE_SCREEN: 0x00,
  FILE_SELECT: 0x01,
  GAME_OVER: 0x0B,
  DEATH_ANIMATION: 0x10
};

// Controller button bit flags
const CONTROLLER_BUTTONS = {
  B: 0x80,
  Y: 0x40,
  SELECT: 0x20,
  START: 0x10,
  UP: 0x08,
  DOWN: 0x04,
  LEFT: 0x02,
  RIGHT: 0x01,
  A: 0x80,      // Same bit as B (different set)
  X: 0x40,      // Same bit as Y (different set)
  L: 0x20,      // Same bit as SELECT (different set)
  R: 0x10       // Same bit as START (different set)
};

// Export everything
module.exports = {
  MEMORY_ADDRESSES,
  POWERUP_TYPES,
  RESERVE_ITEMS,
  YOSHI_COLORS,
  SPRITE_TYPES,
  GAME_MODES,
  CONTROLLER_BUTTONS,
  SNES_WRAM_BASE
};
