// Complete ALTTP Memory Map from Archipelago
// This file contains ALL known memory addresses for ALTTP modifications

// Base addresses for different memory regions
const ROM_START = 0x000000;
const WRAM_START = 0xF50000;  // FX Pak Pro address space
const SRAM_START = 0xE00000;
const SAVEDATA_START = WRAM_START + 0xF000;

// SNES A-bus addresses for RetroArch
const SNES_WRAM_BASE = 0x7E0000;
const SNES_SAVEDATA_BASE = SNES_WRAM_BASE + 0xF000;

// Complete memory address map
const MEMORY_ADDRESSES = {
  // ============= HEALTH & PLAYER STATE =============
  CURRENT_HEALTH: SNES_SAVEDATA_BASE + 0x36D,     // Current HP (0x08 = 1 heart)
  MAX_HEALTH: SNES_SAVEDATA_BASE + 0x36C,         // Max HP capacity
  HEART_PIECES: SNES_SAVEDATA_BASE + 0x36B,       // Heart piece counter (0-3)
  INVINCIBLE: WRAM_START + 0x037B,                // Invincibility flag
  DAMAGE_TO_APPLY: WRAM_START + 0x0373,           // Damage queue

  // ============= MAGIC =============
  MAGIC_METER: SNES_SAVEDATA_BASE + 0x36E,        // Magic meter (0x80 = enabled)
  MAGIC_UPGRADE: SNES_SAVEDATA_BASE + 0x37B,      // 0=normal, 1=1/2 magic, 2=1/4 magic

  // ============= CURRENCY & AMMO =============
  RUPEES_LOW: SNES_SAVEDATA_BASE + 0x360,         // Rupees (low byte)
  RUPEES_HIGH: SNES_SAVEDATA_BASE + 0x361,        // Rupees (high byte) - max 9999
  BOMBS: SNES_SAVEDATA_BASE + 0x343,              // Current bomb count
  ARROWS: SNES_SAVEDATA_BASE + 0x377,             // Current arrow count

  // ============= WEAPONS & TOOLS =============
  BOW: SNES_SAVEDATA_BASE + 0x340,                // 0=none, 1=bow, 2=bow+arrows, 3=silver bow
  BOOMERANG: SNES_SAVEDATA_BASE + 0x341,          // 0=none, 1=blue, 2=red
  HOOKSHOT: SNES_SAVEDATA_BASE + 0x342,           // 0=none, 1=hookshot
  MUSHROOM_POWDER: SNES_SAVEDATA_BASE + 0x344,    // 0=none, 1=mushroom, 2=powder
  FIRE_ROD: SNES_SAVEDATA_BASE + 0x345,           // 0=none, 1=fire rod
  ICE_ROD: SNES_SAVEDATA_BASE + 0x346,            // 0=none, 1=ice rod
  BOMBOS: SNES_SAVEDATA_BASE + 0x347,             // 0=none, 1=bombos
  ETHER: SNES_SAVEDATA_BASE + 0x348,              // 0=none, 1=ether
  QUAKE: SNES_SAVEDATA_BASE + 0x349,              // 0=none, 1=quake
  LAMP: SNES_SAVEDATA_BASE + 0x34A,               // 0=none, 1=lamp
  HAMMER: SNES_SAVEDATA_BASE + 0x34B,             // 0=none, 1=hammer
  FLUTE_SHOVEL: SNES_SAVEDATA_BASE + 0x34C,       // 0=none, 1=shovel, 2=flute, 3=active flute
  BUG_NET: SNES_SAVEDATA_BASE + 0x34D,            // 0=none, 1=net
  BOOK: SNES_SAVEDATA_BASE + 0x34E,               // 0=none, 1=book of mudora
  BOTTLE_COUNT: SNES_SAVEDATA_BASE + 0x34F,       // Number of bottles (0-4)
  SOMARIA: SNES_SAVEDATA_BASE + 0x350,            // 0=none, 1=cane of somaria
  BYRNA: SNES_SAVEDATA_BASE + 0x351,              // 0=none, 1=cane of byrna
  CAPE: SNES_SAVEDATA_BASE + 0x352,               // 0=none, 1=cape
  MIRROR: SNES_SAVEDATA_BASE + 0x353,             // 0=none, 2=mirror

  // ============= EQUIPMENT =============
  GLOVES: SNES_SAVEDATA_BASE + 0x354,             // 0=none, 1=power glove, 2=titan mitts
  BOOTS: SNES_SAVEDATA_BASE + 0x355,              // 0=none, 1=pegasus boots
  FLIPPERS: SNES_SAVEDATA_BASE + 0x356,           // 0=none, 1=flippers
  MOON_PEARL: SNES_SAVEDATA_BASE + 0x357,         // 0=none, 1=moon pearl
  SWORD: SNES_SAVEDATA_BASE + 0x359,              // 0=none, 1=fighter, 2=master, 3=tempered, 4=golden
  SHIELD: SNES_SAVEDATA_BASE + 0x35A,             // 0=none, 1=blue, 2=red, 3=mirror
  ARMOR: SNES_SAVEDATA_BASE + 0x35B,              // 0=green, 1=blue, 2=red

  // ============= BOTTLES =============
  BOTTLE_1: SNES_SAVEDATA_BASE + 0x35C,           // Bottle 1 contents
  BOTTLE_2: SNES_SAVEDATA_BASE + 0x35D,           // Bottle 2 contents
  BOTTLE_3: SNES_SAVEDATA_BASE + 0x35E,           // Bottle 3 contents
  BOTTLE_4: SNES_SAVEDATA_BASE + 0x35F,           // Bottle 4 contents
  // Bottle values: 0=no bottle, 2=empty, 3=red potion, 4=green potion,
  // 5=blue potion, 6=fairy, 7=bee, 8=good bee

  // ============= PENDANTS & CRYSTALS =============
  PENDANTS: SNES_SAVEDATA_BASE + 0x374,           // Bit flags: 0x01=red, 0x02=blue, 0x04=green
  CRYSTALS: SNES_SAVEDATA_BASE + 0x37A,           // Bit flags for crystals 1-7

  // ============= DUNGEON ITEMS =============
  // Small Keys (values are counts)
  KEYS_HYRULE_CASTLE: SNES_SAVEDATA_BASE + 0x37C,
  KEYS_EASTERN: SNES_SAVEDATA_BASE + 0x37E,
  KEYS_DESERT: SNES_SAVEDATA_BASE + 0x37F,
  KEYS_TOWER_HERA: SNES_SAVEDATA_BASE + 0x386,
  KEYS_AGAHNIM: SNES_SAVEDATA_BASE + 0x380,
  KEYS_SWAMP: SNES_SAVEDATA_BASE + 0x381,
  KEYS_DARKNESS: SNES_SAVEDATA_BASE + 0x382,
  KEYS_THIEVES: SNES_SAVEDATA_BASE + 0x387,
  KEYS_SKULL: SNES_SAVEDATA_BASE + 0x384,
  KEYS_MISERY: SNES_SAVEDATA_BASE + 0x383,
  KEYS_ICE: SNES_SAVEDATA_BASE + 0x385,
  KEYS_TURTLE: SNES_SAVEDATA_BASE + 0x388,
  KEYS_GANON: SNES_SAVEDATA_BASE + 0x389,
  KEYS_UNIVERSAL: SNES_SAVEDATA_BASE + 0x38B,

  // Current dungeon small keys (WRAM - live count displayed in HUD)
  CURRENT_SMALL_KEYS: SNES_SAVEDATA_BASE + 0x36F,

  // Big Keys (bit flags in 2 bytes)
  BIG_KEYS_1: SNES_SAVEDATA_BASE + 0x366,
  BIG_KEYS_2: SNES_SAVEDATA_BASE + 0x367,

  // Maps (bit flags in 2 bytes)
  MAPS_1: SNES_SAVEDATA_BASE + 0x368,
  MAPS_2: SNES_SAVEDATA_BASE + 0x369,

  // Compasses (bit flags in 2 bytes)
  COMPASSES_1: SNES_SAVEDATA_BASE + 0x364,
  COMPASSES_2: SNES_SAVEDATA_BASE + 0x365,

  // ============= SPECIAL FLAGS =============
  ABILITY_FLAGS: SNES_SAVEDATA_BASE + 0x379,      // Various ability flags
  ITEM_FLAGS: SNES_SAVEDATA_BASE + 0x38C,         // Item obtained flags
  SPECIAL_FLAGS: SNES_SAVEDATA_BASE + 0x38E,      // Special item flags

  // ============= GAME STATE =============
  GAME_MODE: WRAM_START + 0x10,                   // Current game mode
  CURRENT_ROOM: WRAM_START + 0xA0,                // Current room ID (2 bytes)
  CURRENT_ROOM_HIGH: WRAM_START + 0xA1,           // Current room ID high byte
  INDOORS_FLAG: WRAM_START + 0x1B,                // 0=outdoors, 1=indoors
  DUNGEON_ID: WRAM_START + 0x040C,                // Current dungeon
  MODULE_INDEX: WRAM_START + 0x10,                // Main module
  SUBMODULE_INDEX: WRAM_START + 0x11,             // Submodule for transitions

  // ============= PLAYER POSITION =============
  PLAYER_X_POS: WRAM_START + 0x22,                // X coordinate (2 bytes)
  PLAYER_Y_POS: WRAM_START + 0x20,                // Y coordinate (2 bytes)
  CURRENT_SCREEN: WRAM_START + 0x8A,              // Current screen ID
  CAMERA_X: WRAM_START + 0x061C,                  // Camera X position
  CAMERA_Y: WRAM_START + 0x061E,                  // Camera Y position

  // ============= LAYER POSITIONS =============
  BG1_H_OFFSET: WRAM_START + 0xE0,                // BG1 Horizontal scroll
  BG1_V_OFFSET: WRAM_START + 0xE2,                // BG1 Vertical scroll
  BG2_H_OFFSET: WRAM_START + 0xE6,                // BG2 Horizontal scroll
  BG2_V_OFFSET: WRAM_START + 0xE8,                // BG2 Vertical scroll

  // ============= INPUT & PHYSICS =============
  JOYPAD1_INPUT: SNES_WRAM_BASE + 0x00F0,         // Current joypad 1 input
  JOYPAD1_NEW: SNES_WRAM_BASE + 0x00F2,           // Newly pressed joypad 1 buttons
  LINK_STATE: SNES_WRAM_BASE + 0x005D,            // Link's state/animation
  LINK_DIRECTION: SNES_WRAM_BASE + 0x002F,        // Link's facing direction
  TILE_TYPE_UNDER_LINK: SNES_WRAM_BASE + 0x0114,  // Tile type Link is standing on (READ ONLY - game sets this)
  ICE_FLOOR_BITFIELD: SNES_WRAM_BASE + 0x0348,    // Ice floor interaction bitfield (controls ice physics)
  MOVEMENT_LOCK: SNES_WRAM_BASE + 0x02E4,         // Movement lock flag (prevents ALL input including buttons)
  LINK_SPEED_MODIFIER: SNES_WRAM_BASE + 0x002D,   // Link's movement speed modifier
  Y_BUTTON_ITEM: SNES_WRAM_BASE + 0x0303,         // Currently equipped item in Y slot (0x00 = no item)

  // Chicken attack sprite type constant
  CHICKEN_SPRITE_TYPE: 0x0B,                      // Chicken/Cucco sprite type ID (set sprite_C=1 for attack mode)

  // ============= SPRITE/ENEMY ARRAYS (16 slots each) =============
  // Position & Movement
  SPRITE_Y_LOW: SNES_WRAM_BASE + 0x0D00,          // [0x10] Sprite Y coordinate (low byte)
  SPRITE_X_LOW: SNES_WRAM_BASE + 0x0D10,          // [0x10] Sprite X coordinate (low byte)
  SPRITE_Y_HIGH: SNES_WRAM_BASE + 0x0D20,         // [0x10] Sprite Y coordinate (high byte)
  SPRITE_X_HIGH: SNES_WRAM_BASE + 0x0D30,         // [0x10] Sprite X coordinate (high byte)
  SPRITE_Y_VEL: SNES_WRAM_BASE + 0x0D40,          // [0x10] Sprite Y velocity
  SPRITE_X_VEL: SNES_WRAM_BASE + 0x0D50,          // [0x10] Sprite X velocity

  // State & Type
  SPRITE_STATE: SNES_WRAM_BASE + 0x0DD0,          // [0x10] Sprite state (0=inactive, 0x09=active)
  SPRITE_TYPE: SNES_WRAM_BASE + 0x0E20,           // [0x10] Sprite type ID array
  SPRITE_SUBTYPE: SNES_WRAM_BASE + 0x0E30,        // [0x10] Sprite subtype/variant

  // Visual & Physics Properties
  SPRITE_FLOOR: SNES_WRAM_BASE + 0x0F20,          // [0x10] Floor level (for multilevel rooms)
  SPRITE_OAM_FLAGS: SNES_WRAM_BASE + 0x0F50,      // [0x10] OAM flags (palette, flip, priority) - derived from flags3 & 0x0F
  SPRITE_GRAPHICS: SNES_WRAM_BASE + 0x0DC0,       // [0x10] Graphics/animation frame (0=default frame)
  SPRITE_ROOM: SNES_WRAM_BASE + 0x0C9A,           // [0x10] Room sprite belongs to
  SPRITE_PALETTE: SNES_WRAM_BASE + 0x0F50,        // [0x10] Palette, tile flipping, tile set (DEPRECATED - use SPRITE_OAM_FLAGS)
  SPRITE_HITBOX: SNES_WRAM_BASE + 0x0F60,         // [0x10] Hit box settings (bits 0-4)
  SPRITE_HEIGHT: SNES_WRAM_BASE + 0x0F70,         // [0x10] Z-position (height/shadow distance)
  SPRITE_AI_STATE: SNES_WRAM_BASE + 0x0D80,       // [0x10] AI state/behavior index
  SPRITE_A: SNES_WRAM_BASE + 0x0D90,              // [0x10] Sprite behavior flag A
  SPRITE_B: SNES_WRAM_BASE + 0x0DA0,              // [0x10] Sprite behavior flag B (chicken hit counter - set to 35+ for continuous attack)
  SPRITE_C: SNES_WRAM_BASE + 0x0DB0,              // [0x10] Sprite behavior flag C (chicken attack mode, etc.)
  SPRITE_D: SNES_WRAM_BASE + 0x0DE0,              // [0x10] Sprite behavior flag D
  SPRITE_E: SNES_WRAM_BASE + 0x0E90,              // [0x10] Sprite behavior flag E
  SPRITE_F: SNES_WRAM_BASE + 0x0EA0,              // [0x10] Sprite behavior flag F
  SPRITE_G: SNES_WRAM_BASE + 0x0ED0,              // [0x10] Sprite behavior flag G
  SPRITE_PAUSE: SNES_WRAM_BASE + 0x0F00,          // [0x10] Sprite pause flag
  SPRITE_DELAY_TIMER: SNES_WRAM_BASE + 0x0F80,    // [0x10] Auxiliary delay timer
  SPRITE_Z_VEL: SNES_WRAM_BASE + 0x0D60,          // [0x10] Sprite Z velocity (vertical/jump)
  SPRITE_Z: SNES_WRAM_BASE + 0x0DF0,              // [0x10] Sprite Z position (height)
  SPRITE_N: SNES_WRAM_BASE + 0x0BC0,              // [0x10] Sprite index/slot identifier
  SPRITE_DIE_ACTION: SNES_WRAM_BASE + 0x0CBA,     // [0x10] Death action/behavior

  // Combat & Behavior Properties (loaded from ROM tables during sprite initialization)
  SPRITE_HEALTH: SNES_WRAM_BASE + 0x0E50,         // [0x10] Sprite health points
  SPRITE_BUMP_DAMAGE: SNES_WRAM_BASE + 0x0CD2,    // [0x10] Contact damage dealt to Link
  SPRITE_DEFL_BITS: SNES_WRAM_BASE + 0x0CAA,      // [0x10] Weapon deflection bits (what bounces off)
  SPRITE_FLAGS: SNES_WRAM_BASE + 0x0B6B,          // [0x10] Sprite behavior flags
  SPRITE_FLAGS2: SNES_WRAM_BASE + 0x0E40,         // [0x10] Additional behavior flags
  SPRITE_FLAGS3: SNES_WRAM_BASE + 0x0E60,         // [0x10] OAM and behavior flags
  SPRITE_FLAGS4: SNES_WRAM_BASE + 0x0F60,         // [0x10] More behavior flags
  SPRITE_FLAGS5: SNES_WRAM_BASE + 0x0BE0,         // [0x10] Additional behavior flags
};

// Bottle content values
const BOTTLE_CONTENTS = {
  NO_BOTTLE: 0x00,
  EMPTY: 0x02,
  RED_POTION: 0x03,
  GREEN_POTION: 0x04,
  BLUE_POTION: 0x05,
  FAIRY: 0x06,
  BEE: 0x07,
  GOOD_BEE: 0x08
};

// Equipment values
const EQUIPMENT_VALUES = {
  SWORD: {
    NONE: 0x00,
    FIGHTER: 0x01,
    MASTER: 0x02,
    TEMPERED: 0x03,
    GOLDEN: 0x04
  },
  SHIELD: {
    NONE: 0x00,
    BLUE: 0x01,
    RED: 0x02,
    MIRROR: 0x03
  },
  ARMOR: {
    GREEN: 0x00,
    BLUE: 0x01,
    RED: 0x02
  },
  GLOVES: {
    NONE: 0x00,
    POWER: 0x01,
    TITAN: 0x02
  }
};

// Dungeon IDs
const DUNGEONS = {
  HYRULE_CASTLE: 0x00,
  EASTERN_PALACE: 0x02,
  DESERT_PALACE: 0x03,
  TOWER_HERA: 0x05,
  AGAHNIM_TOWER: 0x04,
  SWAMP_PALACE: 0x06,
  PALACE_DARKNESS: 0x08,
  THIEVES_TOWN: 0x0B,
  SKULL_WOODS: 0x07,
  MISERY_MIRE: 0x09,
  ICE_PALACE: 0x0A,
  TURTLE_ROCK: 0x0C,
  GANONS_TOWER: 0x0D
};

// Room IDs for warping
const ROOM_IDS = {
  // Dungeon Entrances
  EASTERN_PALACE: 0xC9,
  DESERT_PALACE_MAIN: 0x83,
  DESERT_PALACE_BACK: 0x63,
  TOWER_HERA: 0x77,
  PALACE_DARKNESS: 0x4A,
  SWAMP_PALACE: 0x28,
  SKULL_WOODS: 0x58,
  THIEVES_TOWN: 0xDB,
  ICE_PALACE: 0x0E,
  MISERY_MIRE: 0x98,
  TURTLE_ROCK: 0xD6,
  GANONS_TOWER: 0x0C,

  // Special Locations
  LINKS_HOUSE: 0x104,
  SANCTUARY: 0x12,
  KAKARIKO_SHOP: 0x1F,
  LOST_WOODS_SHOP: 0x10F,
  DEATH_MOUNTAIN_SHOP: 0xFF,
  LAKE_HYLIA_SHOP: 0x10E,
  DARK_WORLD_POTION_SHOP: 0x10F,

  // Boss Rooms
  ARMOS_KNIGHTS: 0xC8,     // Eastern Palace
  LANMOLAS: 0x33,           // Desert Palace
  MOLDORM: 0x07,            // Tower of Hera
  HELMASAUR: 0x5A,          // Palace of Darkness
  ARRGHUS: 0x06,            // Swamp Palace
  MOTHULA: 0x29,            // Skull Woods
  BLIND: 0xAC,              // Thieves' Town
  KHOLDSTARE: 0xDE,         // Ice Palace
  VITREOUS: 0x90,           // Misery Mire
  TRINEXX: 0xA4,            // Turtle Rock
  AGAHNIM_1: 0x20,          // Agahnim Tower
  AGAHNIM_2: 0x1C,          // Ganon's Tower
  GANON: 0x00               // Pyramid
};

// Game modes
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

// Sprite/Enemy Type IDs (common enemies)
const SPRITE_TYPES = {
  // Working enemies (HP > 0, < 255) - Verified with correct sprite IDs
  OCTOROK: 0x08,          // Red octorok
  BALL_AND_CHAIN: 0x6A,   // Ball and chain trooper
  SNAPDRAGON: 0x0E,       // Plant enemy
  OCTOBALLOON: 0x0F,      // Flying octopus
  HINOX: 0x11,            // Cyclops-like enemy
  MINI_HELMASAUR: 0x13,   // Small lizard (actual mini helmasaur)
  MINI_MOLDORM: 0x18,     // Mini moldorm (labeled as "Mini Helmasaur" in UI)
  SLUGGULA: 0x20,         // Sluggula (labeled as "Bomb Guy" in UI)
  SOLDIER_BLUE: 0x41,     // Blue sword soldier
  SOLDIER_GREEN: 0x42,    // Green sword soldier
  BEE: 0x79,              // Hostile bee (attacks player)

  // Other sprite types (not for spawning - broken or bosses)
  OCTOROK_4_WAY: 0x0C,
  MOBLIN: 0x12,           // HP varies
  KEESE: 0x15,            // Spawns anti-fairy
  RED_BARI: 0x23,         // Red electric chu
  BLUE_BARI: 0x24,        // Blue electric chu
  ARMOS: 0x19,            // Broken
  GIBDO: 0x21,            // Broken
  STALFOS_KNIGHT: 0x1E,   // HP 0
  CROW: 0x27,             // HP 255
  BLADE_TRAP: 0x20
};

// ROM Sprite Initialization Tables
// These tables contain the proper initialization values for sprite properties
// Extracted from zelda3 source code (sprite.c) - indexed by sprite type ID
// Only includes verified working enemies with proper sprite IDs
const SPRITE_ROM_INIT = {
  // Format: { health, bumpDamage, deflBits, flags, flags2, flags3, flags4, flags5 }

  // 10 Working Enemies (Verified)
  [SPRITE_TYPES.OCTOROK]: {
    health: 2,
    bumpDamage: 1,
    deflBits: 0x00,
    flags: 0x00,
    flags2: 0x02,
    flags3: 0x1D,
    flags4: 0x00,
    flags5: 0x02
  },
  [SPRITE_TYPES.BALL_AND_CHAIN]: {
    health: 16,
    bumpDamage: 3,
    deflBits: 0x00,
    flags: 0x60,
    flags2: 0x09,
    flags3: 0x1D,
    flags4: 0x12,
    flags5: 0x92
  },
  [SPRITE_TYPES.SNAPDRAGON]: {
    health: 12,
    bumpDamage: 8,
    deflBits: 0x00,
    flags: 0x00,
    flags2: 0x04,
    flags3: 0x09,
    flags4: 0x00,
    flags5: 0x97
  },
  [SPRITE_TYPES.OCTOBALLOON]: {
    health: 2,
    bumpDamage: 1,
    deflBits: 0x00,
    flags: 0x20,
    flags2: 0x84,
    flags3: 0x9D,
    flags4: 0x02,
    flags5: 0x80
  },
  [SPRITE_TYPES.HINOX]: {
    health: 20,
    bumpDamage: 8,
    deflBits: 0x00,
    flags: 0x00,
    flags2: 0x05,
    flags3: 0x01,
    flags4: 0x03,
    flags5: 0x94
  },
  [SPRITE_TYPES.MINI_HELMASAUR]: {
    health: 4,
    bumpDamage: 3,
    deflBits: 0x00,
    flags: 0x01,
    flags2: 0x01,
    flags3: 0x11,
    flags4: 0x00,
    flags5: 0x07
  },
  [SPRITE_TYPES.MINI_MOLDORM]: {
    health: 3,
    bumpDamage: 3,
    deflBits: 0x00,
    flags: 0x00,
    flags2: 0x04,
    flags3: 0x07,
    flags4: 0x00,
    flags5: 0x92
  },
  [SPRITE_TYPES.SLUGGULA]: {
    health: 8,
    bumpDamage: 6,
    deflBits: 0x00,
    flags: 0x00,
    flags2: 0x01,
    flags3: 0x1B,
    flags4: 0x00,
    flags5: 0x04
  },
  [SPRITE_TYPES.SOLDIER_BLUE]: {
    health: 6,
    bumpDamage: 1,
    deflBits: 0x00,
    flags: 0x61,
    flags2: 0x08,
    flags3: 0x19,
    flags4: 0x12,
    flags5: 0x91
  },
  [SPRITE_TYPES.SOLDIER_GREEN]: {
    health: 4,
    bumpDamage: 1,
    deflBits: 0x00,
    flags: 0x61,
    flags2: 0x08,
    flags3: 0x1B,
    flags4: 0x12,
    flags5: 0x91
  },
  [SPRITE_TYPES.BEE]: {
    health: 1,
    bumpDamage: 2,
    deflBits: 0x00,
    flags: 0x00,
    flags2: 0x02,
    flags3: 0x1D,
    flags4: 0x00,
    flags5: 0x02
  },

  // Chicken/Cucco (0x0B) - From ROM table kSpriteInit_DeflBits[0x0B] = 0x48
  // deflBits 0x48 has bits 0x40 and 0x08 set
  // Adding bit 0x80 for off-screen persistence: 0x48 | 0x80 = 0xC8
  [0x0B]: {
    health: 1,
    bumpDamage: 0,
    deflBits: 0xC8,   // 0x48 (ROM value) | 0x80 (prevent pause/despawn)
    flags: 0x00,
    flags2: 0x08,     // Standard sprite behavior
    flags3: 0x1B,     // Rendering and persistence flags
    flags4: 0x00,
    flags5: 0x90      // Additional persistence
  }
};

module.exports = {
  MEMORY_ADDRESSES,
  BOTTLE_CONTENTS,
  EQUIPMENT_VALUES,
  DUNGEONS,
  ROOM_IDS,
  GAME_MODES,
  SPRITE_TYPES,
  SPRITE_ROM_INIT,
  WRAM_START,
  SAVEDATA_START,
  SNES_WRAM_BASE,
  SNES_SAVEDATA_BASE
};