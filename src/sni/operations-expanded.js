const {
  MEMORY_ADDRESSES,
  BOTTLE_CONTENTS,
  EQUIPMENT_VALUES,
  DUNGEONS,
  ROOM_IDS,
  SPRITE_TYPES,
  SPRITE_ROM_INIT,
  SNES_WRAM_BASE
} = require('./memory-complete');

class ExpandedGameOperations {
  constructor(sniClient) {
    this.client = sniClient;
    this.pendingChickenAttack = false;
    this.lastIndoorsState = null;
    this.indoorsCheckInterval = null;
    // Timer-based chicken attack properties
    this.chickenAttackActive = false;
    this.chickenAttackStartTime = null;
    this.chickenAttackDuration = 60000; // 60 seconds in milliseconds
    this.chickenAttackElapsedActive = 0; // Track time chickens are actually on screen
    this.chickenAttackLastCheck = null; // Track last check time for delta calculation
    this.chickenAttackSlot = null;
    this.chickenAttackInterval = null;
    this.chickenAttackLastRoom = null; // Track room for screen transitions

    // Timer-based enemy waves properties
    this.enemyWavesActive = false;
    this.enemyWavesStartTime = null;
    this.enemyWavesDuration = 30000; // 30 seconds in milliseconds
    this.enemyWavesSlots = [null, null, null]; // Track 3 enemy sprite slots
    this.enemyWavesInterval = null;
    this.enemyWavesLastRoom = null; // Track room for screen transitions

    // Bee swarm attack properties
    this.beeSwarmActive = false;
    this.beeSwarmSlots = []; // Track bee sprite slots (5-10 bees)
    this.beeSwarmCount = 7; // Default to 7 bees

    // Bee swarm waves properties (60-second duration with 7 bees)
    this.beeSwarmWavesActive = false;
    this.beeSwarmWavesStartTime = null;
    this.beeSwarmWavesDuration = 60000; // 60 seconds in milliseconds
    this.beeSwarmWavesSlots = [null, null, null, null, null, null, null]; // Track 7 bee sprite slots
    this.beeSwarmWavesInterval = null;
    this.beeSwarmWavesLastRoom = null; // Track room for screen transitions
  }

  // ============= HELPER METHODS =============
  async readWithRetry(address, size, maxAttempts = 3) {
    let attempts = 0;
    let lastError;

    while (attempts < maxAttempts) {
      try {
        const data = await this.client.readMemory(address, size);
        if (data && data.length > 0) {
          return data;
        }
      } catch (error) {
        lastError = error;
      }
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }
    }
    throw lastError || new Error('Failed to read memory after ' + maxAttempts + ' attempts');
  }

  // ============= RUPEES & RESOURCES =============
  async getRupees() {
    const data = await this.readWithRetry(MEMORY_ADDRESSES.RUPEES_LOW, 2);
    return data[0] | (data[1] << 8); // Little-endian
  }

  async setRupees(amount) {
    amount = Math.min(Math.max(0, amount), 9999); // Clamp to 0-9999
    const low = amount & 0xFF;
    const high = (amount >> 8) & 0xFF;

    await this.client.writeMemory(MEMORY_ADDRESSES.RUPEES_LOW, Buffer.from([low]));
    await this.client.writeMemory(MEMORY_ADDRESSES.RUPEES_HIGH, Buffer.from([high]));

    return { success: true, rupees: amount };
  }

  async addRupees(amount) {
    const current = await this.getRupees();
    return await this.setRupees(current + amount);
  }

  async getBombs() {
    const data = await this.readWithRetry(MEMORY_ADDRESSES.BOMBS, 1);
    return data[0];
  }

  async setBombs(amount) {
    amount = Math.min(Math.max(0, amount), 50); // Max 50 bombs
    await this.client.writeMemory(MEMORY_ADDRESSES.BOMBS, Buffer.from([amount]));
    return { success: true, bombs: amount };
  }

  async getArrows() {
    const data = await this.readWithRetry(MEMORY_ADDRESSES.ARROWS, 1);
    return data[0];
  }

  async setArrows(amount) {
    amount = Math.min(Math.max(0, amount), 70); // Max 70 arrows
    await this.client.writeMemory(MEMORY_ADDRESSES.ARROWS, Buffer.from([amount]));
    return { success: true, arrows: amount };
  }

  async addBomb(amount = 1) {
    const current = await this.getBombs();
    return await this.setBombs(current + amount);
  }

  async removeBomb(amount = 1) {
    const current = await this.getBombs();
    return await this.setBombs(current - amount);
  }

  async addArrow(amount = 1) {
    const current = await this.getArrows();
    return await this.setArrows(current + amount);
  }

  async removeArrow(amount = 1) {
    const current = await this.getArrows();
    return await this.setArrows(current - amount);
  }

  async addRupee(amount = 1) {
    console.log(`[addRupee] Called with amount=${amount}, type=${typeof amount}`);
    const current = await this.getRupees();
    console.log(`[addRupee] Current rupees: ${current}, adding ${amount}, new total: ${current + amount}`);
    return await this.setRupees(current + amount);
  }

  async removeRupee(amount = 1) {
    const current = await this.getRupees();
    return await this.setRupees(current - amount);
  }

  // ============= MAGIC =============
  async enableMagic() {
    await this.client.writeMemory(MEMORY_ADDRESSES.MAGIC_METER, Buffer.from([0x80]));
    return { success: true, message: 'Magic meter enabled' };
  }

  async setMagicUpgrade(level) {
    // 0 = normal, 1 = 1/2 magic, 2 = 1/4 magic
    level = Math.min(Math.max(0, level), 2);
    await this.client.writeMemory(MEMORY_ADDRESSES.MAGIC_UPGRADE, Buffer.from([level]));
    const descriptions = ['Normal', '1/2 Magic', '1/4 Magic'];
    return { success: true, upgrade: descriptions[level] };
  }

  // ============= EQUIPMENT =============
  async setSword(level) {
    level = Math.min(Math.max(0, level), 4);
    await this.client.writeMemory(MEMORY_ADDRESSES.SWORD, Buffer.from([level]));
    const swords = ['None', 'Fighter', 'Master', 'Tempered', 'Golden'];
    return { success: true, sword: swords[level] };
  }

  async setShield(level) {
    level = Math.min(Math.max(0, level), 3);
    await this.client.writeMemory(MEMORY_ADDRESSES.SHIELD, Buffer.from([level]));
    const shields = ['None', 'Blue', 'Red', 'Mirror'];
    return { success: true, shield: shields[level] };
  }

  async setArmor(level) {
    level = Math.min(Math.max(0, level), 2);
    await this.client.writeMemory(MEMORY_ADDRESSES.ARMOR, Buffer.from([level]));
    const armors = ['Green Mail', 'Blue Mail', 'Red Mail'];
    return { success: true, armor: armors[level] };
  }

  async setGloves(level) {
    level = Math.min(Math.max(0, level), 2);
    await this.client.writeMemory(MEMORY_ADDRESSES.GLOVES, Buffer.from([level]));
    const gloves = ['None', 'Power Glove', 'Titan\'s Mitts'];
    return { success: true, gloves: gloves[level] };
  }

  async toggleBoots() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.BOOTS, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.BOOTS, Buffer.from([newValue]));

    // Also set/clear ability flag (bit 0x04)
    const abilityFlags = await this.readWithRetry(MEMORY_ADDRESSES.ABILITY_FLAGS, 1);
    if (newValue === 1) {
      // Set bit 0x04 (enable boots ability)
      await this.client.writeMemory(MEMORY_ADDRESSES.ABILITY_FLAGS, Buffer.from([abilityFlags[0] | 0x04]));
    } else {
      // Clear bit 0x04 (disable boots ability)
      await this.client.writeMemory(MEMORY_ADDRESSES.ABILITY_FLAGS, Buffer.from([abilityFlags[0] & ~0x04]));
    }

    return { success: true, boots: newValue === 1 };
  }

  async toggleFlippers() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.FLIPPERS, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.FLIPPERS, Buffer.from([newValue]));

    // Also set ability flag
    if (newValue === 1) {
      const abilityFlags = await this.readWithRetry(MEMORY_ADDRESSES.ABILITY_FLAGS, 1);
      await this.client.writeMemory(MEMORY_ADDRESSES.ABILITY_FLAGS, Buffer.from([abilityFlags[0] | 0x02]));
    }

    return { success: true, flippers: newValue === 1 };
  }

  async toggleMoonPearl() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.MOON_PEARL, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.MOON_PEARL, Buffer.from([newValue]));
    return { success: true, moonPearl: newValue === 1 };
  }

  // ============= ITEMS =============
  async giveItem(itemAddress, value = 1) {
    await this.client.writeMemory(itemAddress, Buffer.from([value]));
    return { success: true };
  }

  async toggleHookshot() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.HOOKSHOT, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.HOOKSHOT, Buffer.from([newValue]));
    return { success: true, hookshot: newValue === 1 };
  }

  async toggleLamp() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.LAMP, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.LAMP, Buffer.from([newValue]));
    return { success: true, lamp: newValue === 1 };
  }

  async toggleHammer() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.HAMMER, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.HAMMER, Buffer.from([newValue]));
    return { success: true, hammer: newValue === 1 };
  }

  async toggleBook() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.BOOK, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.BOOK, Buffer.from([newValue]));
    return { success: true, book: newValue === 1 };
  }

  async toggleBugNet() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.BUG_NET, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.BUG_NET, Buffer.from([newValue]));
    return { success: true, bugNet: newValue === 1 };
  }

  async toggleSomaria() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.SOMARIA, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.SOMARIA, Buffer.from([newValue]));
    return { success: true, somaria: newValue === 1 };
  }

  async toggleByrna() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.BYRNA, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.BYRNA, Buffer.from([newValue]));
    return { success: true, byrna: newValue === 1 };
  }

  async toggleMirror() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.MIRROR, 1);
    const newValue = current[0] === 0 ? 2 : 0; // Mirror uses 2, not 1
    await this.client.writeMemory(MEMORY_ADDRESSES.MIRROR, Buffer.from([newValue]));
    return { success: true, mirror: newValue === 2 };
  }

  async toggleBoomerang() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.BOOMERANG, 1);
    // Cycle: 0 (none) -> 1 (blue) -> 2 (red) -> 0
    const newValue = (current[0] + 1) % 3;
    await this.client.writeMemory(MEMORY_ADDRESSES.BOOMERANG, Buffer.from([newValue]));
    const states = ['None', 'Blue Boomerang', 'Red Boomerang'];
    return { success: true, boomerang: states[newValue] };
  }

  async toggleMedallion(medallionName) {
    const medallionAddresses = {
      'bombos': MEMORY_ADDRESSES.BOMBOS,
      'ether': MEMORY_ADDRESSES.ETHER,
      'quake': MEMORY_ADDRESSES.QUAKE
    };

    const address = medallionAddresses[medallionName.toLowerCase()];
    if (!address) {
      return { success: false, error: 'Invalid medallion name' };
    }

    const current = await this.readWithRetry(address, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(address, Buffer.from([newValue]));

    return { success: true, medallion: medallionName, has: newValue === 1 };
  }

  async toggleAllMedallions() {
    const bombos = await this.readWithRetry(MEMORY_ADDRESSES.BOMBOS, 1);
    const ether = await this.readWithRetry(MEMORY_ADDRESSES.ETHER, 1);
    const quake = await this.readWithRetry(MEMORY_ADDRESSES.QUAKE, 1);

    // Check if all are set
    const allSet = bombos[0] === 1 && ether[0] === 1 && quake[0] === 1;
    const newValue = allSet ? 0 : 1;

    await this.client.writeMemory(MEMORY_ADDRESSES.BOMBOS, Buffer.from([newValue]));
    await this.client.writeMemory(MEMORY_ADDRESSES.ETHER, Buffer.from([newValue]));
    await this.client.writeMemory(MEMORY_ADDRESSES.QUAKE, Buffer.from([newValue]));

    return { success: true, message: newValue === 1 ? 'All medallions granted' : 'All medallions removed', has: newValue === 1 };
  }

  async giveAllMedallions() {
    await this.client.writeMemory(MEMORY_ADDRESSES.BOMBOS, Buffer.from([1]));
    await this.client.writeMemory(MEMORY_ADDRESSES.ETHER, Buffer.from([1]));
    await this.client.writeMemory(MEMORY_ADDRESSES.QUAKE, Buffer.from([1]));
    return { success: true, message: 'All medallions granted' };
  }

  async toggleFireRod() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.FIRE_ROD, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.FIRE_ROD, Buffer.from([newValue]));
    return { success: true, fireRod: newValue === 1 };
  }

  async giveFireRod() {
    await this.client.writeMemory(MEMORY_ADDRESSES.FIRE_ROD, Buffer.from([1]));
    return { success: true, fireRod: true };
  }

  async toggleIceRod() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.ICE_ROD, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.ICE_ROD, Buffer.from([newValue]));
    return { success: true, iceRod: newValue === 1 };
  }

  async giveIceRod() {
    await this.client.writeMemory(MEMORY_ADDRESSES.ICE_ROD, Buffer.from([1]));
    return { success: true, iceRod: true };
  }

  async giveCapes() {
    await this.client.writeMemory(MEMORY_ADDRESSES.CAPE, Buffer.from([1]));
    await this.client.writeMemory(MEMORY_ADDRESSES.BYRNA, Buffer.from([1]));
    return { success: true, message: 'Magic Cape and Cane of Byrna granted' };
  }

  // ============= FLUTE =============
  async giveFlute() {
    // Give flute in inactive state (need to talk to bird in Kakariko)
    await this.client.writeMemory(MEMORY_ADDRESSES.FLUTE_SHOVEL, Buffer.from([0x02]));
    return { success: true, flute: 'inactive', message: 'Flute granted (inactive - find the bird!)' };
  }

  async removeFlute() {
    // Remove flute entirely
    await this.client.writeMemory(MEMORY_ADDRESSES.FLUTE_SHOVEL, Buffer.from([0x00]));
    return { success: true, message: 'Flute removed' };
  }

  async setFluteState(state) {
    // 0 = none, 1 = shovel, 2 = inactive flute, 3 = active flute
    const states = {
      'none': 0x00,
      'shovel': 0x01,
      'inactive': 0x02,
      'active': 0x03
    };

    const value = states[state.toLowerCase()] ?? 0x00;
    await this.client.writeMemory(MEMORY_ADDRESSES.FLUTE_SHOVEL, Buffer.from([value]));

    const descriptions = {
      0x00: 'No flute/shovel',
      0x01: 'Shovel',
      0x02: 'Flute (inactive)',
      0x03: 'Flute (active)'
    };

    return { success: true, state: descriptions[value] };
  }

  async deactivateFlute() {
    // Change from active (3) to inactive (2) - bird goes back to Kakariko
    await this.client.writeMemory(MEMORY_ADDRESSES.FLUTE_SHOVEL, Buffer.from([0x02]));
    return { success: true, message: 'Flute deactivated - bird returned to Kakariko' };
  }

  // ============= BOTTLES =============
  async addBottle() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.BOTTLE_COUNT, 1);
    if (current[0] >= 4) {
      return { success: false, error: 'Already have 4 bottles' };
    }

    const newCount = current[0] + 1;
    await this.client.writeMemory(MEMORY_ADDRESSES.BOTTLE_COUNT, Buffer.from([newCount]));

    // Set the new bottle to empty
    const bottleAddresses = [
      MEMORY_ADDRESSES.BOTTLE_1,
      MEMORY_ADDRESSES.BOTTLE_2,
      MEMORY_ADDRESSES.BOTTLE_3,
      MEMORY_ADDRESSES.BOTTLE_4
    ];
    await this.client.writeMemory(bottleAddresses[current[0]], Buffer.from([BOTTLE_CONTENTS.EMPTY]));

    return { success: true, bottles: newCount };
  }

  async removeBottle() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.BOTTLE_COUNT, 1);
    if (current[0] <= 0) {
      return { success: false, error: 'No bottles to remove' };
    }

    const newCount = current[0] - 1;
    await this.client.writeMemory(MEMORY_ADDRESSES.BOTTLE_COUNT, Buffer.from([newCount]));

    // Clear the last bottle slot
    const bottleAddresses = [
      MEMORY_ADDRESSES.BOTTLE_1,
      MEMORY_ADDRESSES.BOTTLE_2,
      MEMORY_ADDRESSES.BOTTLE_3,
      MEMORY_ADDRESSES.BOTTLE_4
    ];
    await this.client.writeMemory(bottleAddresses[current[0] - 1], Buffer.from([0x00]));

    return { success: true, bottles: newCount };
  }

  async fillBottleWithFairy(bottleNumber) {
    if (bottleNumber < 1 || bottleNumber > 4) {
      return { success: false, error: 'Invalid bottle number (1-4)' };
    }

    const bottleAddresses = [
      MEMORY_ADDRESSES.BOTTLE_1,
      MEMORY_ADDRESSES.BOTTLE_2,
      MEMORY_ADDRESSES.BOTTLE_3,
      MEMORY_ADDRESSES.BOTTLE_4
    ];

    await this.client.writeMemory(bottleAddresses[bottleNumber - 1], Buffer.from([BOTTLE_CONTENTS.FAIRY]));
    return { success: true, message: `Bottle ${bottleNumber} filled with fairy` };
  }

  async fillAllBottlesWithPotion(potionType = 'blue') {
    const potions = {
      'red': BOTTLE_CONTENTS.RED_POTION,
      'green': BOTTLE_CONTENTS.GREEN_POTION,
      'blue': BOTTLE_CONTENTS.BLUE_POTION
    };

    const potionValue = potions[potionType] || BOTTLE_CONTENTS.BLUE_POTION;
    const bottleCount = await this.readWithRetry(MEMORY_ADDRESSES.BOTTLE_COUNT, 1);

    const bottleAddresses = [
      MEMORY_ADDRESSES.BOTTLE_1,
      MEMORY_ADDRESSES.BOTTLE_2,
      MEMORY_ADDRESSES.BOTTLE_3,
      MEMORY_ADDRESSES.BOTTLE_4
    ];

    for (let i = 0; i < bottleCount[0]; i++) {
      await this.client.writeMemory(bottleAddresses[i], Buffer.from([potionValue]));
    }

    return { success: true, message: `Filled ${bottleCount[0]} bottles with ${potionType} potion` };
  }

  // ============= HEARTS =============
  async addHeartPiece() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.HEART_PIECES, 1);
    const newPieces = (current[0] + 1) % 4;

    await this.client.writeMemory(MEMORY_ADDRESSES.HEART_PIECES, Buffer.from([newPieces]));

    // If we've collected 4 pieces, add a heart container
    if (newPieces === 0) {
      const maxHealth = await this.readWithRetry(MEMORY_ADDRESSES.MAX_HEALTH, 1);
      const newMax = Math.min(maxHealth[0] + 0x08, 0xA0);
      await this.client.writeMemory(MEMORY_ADDRESSES.MAX_HEALTH, Buffer.from([newMax]));
      await this.client.writeMemory(MEMORY_ADDRESSES.CURRENT_HEALTH, Buffer.from([newMax]));
      return { success: true, message: 'Heart piece added - New heart container created!', pieces: 0 };
    }

    return { success: true, message: `Heart piece added (${newPieces}/4)`, pieces: newPieces };
  }

  async setHearts(hearts) {
    hearts = Math.min(Math.max(3, hearts), 20); // 3-20 hearts
    const healthValue = hearts * 0x08;

    await this.client.writeMemory(MEMORY_ADDRESSES.MAX_HEALTH, Buffer.from([healthValue]));
    await this.client.writeMemory(MEMORY_ADDRESSES.CURRENT_HEALTH, Buffer.from([healthValue]));

    return { success: true, hearts: hearts };
  }

  // ============= DUNGEON ITEMS =============
  async addSmallKey(dungeon) {
    const keyAddresses = {
      'eastern': MEMORY_ADDRESSES.KEYS_EASTERN,
      'desert': MEMORY_ADDRESSES.KEYS_DESERT,
      'hera': MEMORY_ADDRESSES.KEYS_TOWER_HERA,
      'darkness': MEMORY_ADDRESSES.KEYS_DARKNESS,
      'swamp': MEMORY_ADDRESSES.KEYS_SWAMP,
      'skull': MEMORY_ADDRESSES.KEYS_SKULL,
      'thieves': MEMORY_ADDRESSES.KEYS_THIEVES,
      'ice': MEMORY_ADDRESSES.KEYS_ICE,
      'misery': MEMORY_ADDRESSES.KEYS_MISERY,
      'turtle': MEMORY_ADDRESSES.KEYS_TURTLE,
      'ganon': MEMORY_ADDRESSES.KEYS_GANON,
      'castle': MEMORY_ADDRESSES.KEYS_HYRULE_CASTLE,
      'tower': MEMORY_ADDRESSES.KEYS_AGAHNIM
    };

    const dungeonIds = {
      'eastern': DUNGEONS.EASTERN_PALACE,
      'desert': DUNGEONS.DESERT_PALACE,
      'hera': DUNGEONS.TOWER_HERA,
      'darkness': DUNGEONS.PALACE_DARKNESS,
      'swamp': DUNGEONS.SWAMP_PALACE,
      'skull': DUNGEONS.SKULL_WOODS,
      'thieves': DUNGEONS.THIEVES_TOWN,
      'ice': DUNGEONS.ICE_PALACE,
      'misery': DUNGEONS.MISERY_MIRE,
      'turtle': DUNGEONS.TURTLE_ROCK,
      'ganon': DUNGEONS.GANONS_TOWER,
      'castle': DUNGEONS.HYRULE_CASTLE,
      'tower': DUNGEONS.AGAHNIM_TOWER
    };

    const address = keyAddresses[dungeon.toLowerCase()];
    if (!address) {
      return { success: false, error: 'Invalid dungeon name' };
    }

    const current = await this.readWithRetry(address, 1);
    const newCount = Math.min(current[0] + 1, 99);

    // Write to SAVEDATA (permanent storage)
    await this.client.writeMemory(address, Buffer.from([newCount]));

    // For randomizer: Check if we're in a dungeon based on room range
    // Each dungeon has specific room ranges in ALTTP
    try {
      const currentRoom = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
      const roomId = currentRoom[0];

      // Map room ranges to dungeons (works for randomizer)
      const roomRanges = {
        'eastern': { min: 0xC8, max: 0xDF },    // Eastern Palace
        'desert': { min: 0x80, max: 0x8F },     // Desert Palace
        'hera': { min: 0x70, max: 0x7F },       // Tower of Hera
        'tower': { min: 0x20, max: 0x2F },      // Agahnim's Tower
        'darkness': { min: 0x40, max: 0x5F },   // Palace of Darkness
        'swamp': { min: 0x28, max: 0x3F },      // Swamp Palace
        'skull': { min: 0x58, max: 0x67 },      // Skull Woods
        'thieves': { min: 0xD8, max: 0xEF },    // Thieves Town
        'ice': { min: 0x0E, max: 0x1F },        // Ice Palace
        'misery': { min: 0x90, max: 0xA7 },     // Misery Mire
        'turtle': { min: 0xD0, max: 0xD7 },     // Turtle Rock
        'ganon': { min: 0x00, max: 0x0D }       // Ganon's Tower
      };

      const dungeonKey = dungeon.toLowerCase();
      const range = roomRanges[dungeonKey];

      if (range && roomId >= range.min && roomId <= range.max) {
        // We're physically in this dungeon, update the HUD
        // Read current HUD value to see what it was
        const currentHUD = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_SMALL_KEYS, 1);
        console.log(`[ADD] In ${dungeon} (room ${roomId.toString(16)}), HUD was ${currentHUD[0]}, updating to ${newCount}`);
        await this.client.writeMemory(MEMORY_ADDRESSES.CURRENT_SMALL_KEYS, Buffer.from([newCount]));
      } else {
        console.log(`[ADD] Not in ${dungeon} (current room: ${roomId.toString(16)}), saved to SAVEDATA only`);
      }
    } catch (error) {
      console.log('Could not check room location', error);
    }

    return { success: true, dungeon: dungeon, keys: newCount };
  }

  async removeSmallKey(dungeon) {
    const keyAddresses = {
      'eastern': MEMORY_ADDRESSES.KEYS_EASTERN,
      'desert': MEMORY_ADDRESSES.KEYS_DESERT,
      'hera': MEMORY_ADDRESSES.KEYS_TOWER_HERA,
      'darkness': MEMORY_ADDRESSES.KEYS_DARKNESS,
      'swamp': MEMORY_ADDRESSES.KEYS_SWAMP,
      'skull': MEMORY_ADDRESSES.KEYS_SKULL,
      'thieves': MEMORY_ADDRESSES.KEYS_THIEVES,
      'ice': MEMORY_ADDRESSES.KEYS_ICE,
      'misery': MEMORY_ADDRESSES.KEYS_MISERY,
      'turtle': MEMORY_ADDRESSES.KEYS_TURTLE,
      'ganon': MEMORY_ADDRESSES.KEYS_GANON,
      'castle': MEMORY_ADDRESSES.KEYS_HYRULE_CASTLE,
      'tower': MEMORY_ADDRESSES.KEYS_AGAHNIM
    };

    const dungeonIds = {
      'eastern': DUNGEONS.EASTERN_PALACE,
      'desert': DUNGEONS.DESERT_PALACE,
      'hera': DUNGEONS.TOWER_HERA,
      'darkness': DUNGEONS.PALACE_DARKNESS,
      'swamp': DUNGEONS.SWAMP_PALACE,
      'skull': DUNGEONS.SKULL_WOODS,
      'thieves': DUNGEONS.THIEVES_TOWN,
      'ice': DUNGEONS.ICE_PALACE,
      'misery': DUNGEONS.MISERY_MIRE,
      'turtle': DUNGEONS.TURTLE_ROCK,
      'ganon': DUNGEONS.GANONS_TOWER,
      'castle': DUNGEONS.HYRULE_CASTLE,
      'tower': DUNGEONS.AGAHNIM_TOWER
    };

    const address = keyAddresses[dungeon.toLowerCase()];
    if (!address) {
      return { success: false, error: 'Invalid dungeon name' };
    }

    const current = await this.readWithRetry(address, 1);
    const newCount = Math.max(current[0] - 1, 0);

    // Write to SAVEDATA (permanent storage)
    await this.client.writeMemory(address, Buffer.from([newCount]));

    // For randomizer: Check if we're in a dungeon based on room range
    try {
      const currentRoom = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
      const roomId = currentRoom[0];

      // Map room ranges to dungeons (works for randomizer)
      const roomRanges = {
        'eastern': { min: 0xC8, max: 0xDF },    // Eastern Palace
        'desert': { min: 0x80, max: 0x8F },     // Desert Palace
        'hera': { min: 0x70, max: 0x7F },       // Tower of Hera
        'tower': { min: 0x20, max: 0x2F },      // Agahnim's Tower
        'darkness': { min: 0x40, max: 0x5F },   // Palace of Darkness
        'swamp': { min: 0x28, max: 0x3F },      // Swamp Palace
        'skull': { min: 0x58, max: 0x67 },      // Skull Woods
        'thieves': { min: 0xD8, max: 0xEF },    // Thieves Town
        'ice': { min: 0x0E, max: 0x1F },        // Ice Palace
        'misery': { min: 0x90, max: 0xA7 },     // Misery Mire
        'turtle': { min: 0xD0, max: 0xD7 },     // Turtle Rock
        'ganon': { min: 0x00, max: 0x0D }       // Ganon's Tower
      };

      const dungeonKey = dungeon.toLowerCase();
      const range = roomRanges[dungeonKey];

      if (range && roomId >= range.min && roomId <= range.max) {
        // We're physically in this dungeon, update the HUD
        await this.client.writeMemory(MEMORY_ADDRESSES.CURRENT_SMALL_KEYS, Buffer.from([newCount]));
        console.log(`[REMOVE] In ${dungeon} (room ${roomId.toString(16)}), HUD updated to ${newCount} keys`);
      } else {
        console.log(`[REMOVE] Not in ${dungeon} (current room: ${roomId.toString(16)}), saved to SAVEDATA only`);
      }
    } catch (error) {
      console.log('Could not check room location', error);
    }

    return { success: true, dungeon: dungeon, keys: newCount };
  }

  async giveSmallKeys(dungeon, count = 1) {
    const keyAddresses = {
      'eastern': MEMORY_ADDRESSES.KEYS_EASTERN,
      'desert': MEMORY_ADDRESSES.KEYS_DESERT,
      'hera': MEMORY_ADDRESSES.KEYS_TOWER_HERA,
      'darkness': MEMORY_ADDRESSES.KEYS_DARKNESS,
      'swamp': MEMORY_ADDRESSES.KEYS_SWAMP,
      'skull': MEMORY_ADDRESSES.KEYS_SKULL,
      'thieves': MEMORY_ADDRESSES.KEYS_THIEVES,
      'ice': MEMORY_ADDRESSES.KEYS_ICE,
      'misery': MEMORY_ADDRESSES.KEYS_MISERY,
      'turtle': MEMORY_ADDRESSES.KEYS_TURTLE,
      'ganon': MEMORY_ADDRESSES.KEYS_GANON,
      'castle': MEMORY_ADDRESSES.KEYS_HYRULE_CASTLE,
      'tower': MEMORY_ADDRESSES.KEYS_AGAHNIM
    };

    const address = keyAddresses[dungeon.toLowerCase()];
    if (!address) {
      return { success: false, error: 'Invalid dungeon name' };
    }

    const current = await this.readWithRetry(address, 1);
    const newCount = Math.min(current[0] + count, 99);
    await this.client.writeMemory(address, Buffer.from([newCount]));

    return { success: true, dungeon: dungeon, keys: newCount };
  }

  async giveUniversalKeys(count = 10) {
    await this.client.writeMemory(MEMORY_ADDRESSES.KEYS_UNIVERSAL, Buffer.from([count]));
    return { success: true, universalKeys: count };
  }

  async toggleBigKey(dungeon) {
    const bigKeyMasks = {
      // BIG_KEYS_1 (0x366)
      'hera': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x20 },
      'thieves': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x10 },
      'skull': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x80 },
      'ice': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x40 },
      'turtle': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x08 },
      'ganon': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x04 },

      // BIG_KEYS_2 (0x367)
      'eastern': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x20 },
      'desert': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x10 },
      'tower': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x08 },
      'swamp': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x04 },
      'darkness': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x02 },
      'misery': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x01 },
      'castle': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0xC0 }
    };

    const keyInfo = bigKeyMasks[dungeon.toLowerCase()];
    if (!keyInfo) {
      return { success: false, error: 'Invalid dungeon name' };
    }

    const current = await this.readWithRetry(keyInfo.address, 1);
    const newValue = current[0] ^ keyInfo.mask; // XOR to toggle
    await this.client.writeMemory(keyInfo.address, Buffer.from([newValue]));

    const hasIt = (newValue & keyInfo.mask) !== 0;
    return { success: true, dungeon: dungeon, has: hasIt };
  }

  async giveBigKey(dungeon) {
    const bigKeyMasks = {
      // BIG_KEYS_1 (0x366)
      'hera': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x20 },
      'thieves': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x10 },
      'skull': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x80 },
      'ice': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x40 },
      'turtle': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x08 },
      'ganon': { address: MEMORY_ADDRESSES.BIG_KEYS_1, mask: 0x04 },

      // BIG_KEYS_2 (0x367)
      'eastern': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x20 },
      'desert': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x10 },
      'tower': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x08 },
      'swamp': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x04 },
      'darkness': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x02 },
      'misery': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0x01 },
      'castle': { address: MEMORY_ADDRESSES.BIG_KEYS_2, mask: 0xC0 }
    };

    const keyInfo = bigKeyMasks[dungeon.toLowerCase()];
    if (!keyInfo) {
      return { success: false, error: 'Invalid dungeon name' };
    }

    const current = await this.readWithRetry(keyInfo.address, 1);
    await this.client.writeMemory(keyInfo.address, Buffer.from([current[0] | keyInfo.mask]));

    return { success: true, message: `Big key given for ${dungeon}` };
  }

  // ============= PENDANTS & CRYSTALS =============

  // Individual Pendants
  async togglePendant(pendantName) {
    const pendantMasks = {
      'red': 0x01,
      'blue': 0x02,
      'green': 0x04
    };

    const mask = pendantMasks[pendantName.toLowerCase()];
    if (!mask) {
      return { success: false, error: 'Invalid pendant name' };
    }

    const current = await this.readWithRetry(MEMORY_ADDRESSES.PENDANTS, 1);
    const newValue = current[0] ^ mask; // XOR to toggle the bit
    await this.client.writeMemory(MEMORY_ADDRESSES.PENDANTS, Buffer.from([newValue]));

    const hasIt = (newValue & mask) !== 0;
    return { success: true, pendant: pendantName, has: hasIt };
  }

  async toggleAllPendants() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.PENDANTS, 1);
    const newValue = current[0] === 0x07 ? 0x00 : 0x07; // Toggle all on/off
    await this.client.writeMemory(MEMORY_ADDRESSES.PENDANTS, Buffer.from([newValue]));
    return { success: true, message: newValue === 0x07 ? 'All pendants granted' : 'All pendants removed', has: newValue === 0x07 };
  }

  async giveAllPendants() {
    await this.client.writeMemory(MEMORY_ADDRESSES.PENDANTS, Buffer.from([0x07])); // All 3 pendants
    return { success: true, message: 'All pendants granted' };
  }

  // Individual Crystals
  async toggleCrystal(crystalNum) {
    const crystalMasks = {
      1: 0x02,
      2: 0x10,
      3: 0x40,
      4: 0x20,
      5: 0x04,
      6: 0x01,
      7: 0x08
    };

    const mask = crystalMasks[crystalNum];
    if (!mask) {
      return { success: false, error: 'Invalid crystal number (1-7)' };
    }

    const current = await this.readWithRetry(MEMORY_ADDRESSES.CRYSTALS, 1);
    const newValue = current[0] ^ mask; // XOR to toggle the bit
    await this.client.writeMemory(MEMORY_ADDRESSES.CRYSTALS, Buffer.from([newValue]));

    const hasIt = (newValue & mask) !== 0;
    return { success: true, crystal: crystalNum, has: hasIt };
  }

  async toggleAllCrystals() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.CRYSTALS, 1);
    const newValue = current[0] === 0x7F ? 0x00 : 0x7F; // Toggle all on/off
    await this.client.writeMemory(MEMORY_ADDRESSES.CRYSTALS, Buffer.from([newValue]));
    return { success: true, message: newValue === 0x7F ? 'All crystals granted' : 'All crystals removed', has: newValue === 0x7F };
  }

  async giveAllCrystals() {
    await this.client.writeMemory(MEMORY_ADDRESSES.CRYSTALS, Buffer.from([0x7F])); // All 7 crystals
    return { success: true, message: 'All crystals granted' };
  }

  // ============= INVINCIBILITY =============
  async toggleInvincibility() {
    const current = await this.readWithRetry(MEMORY_ADDRESSES.INVINCIBLE, 1);
    const newValue = current[0] === 0 ? 1 : 0;
    await this.client.writeMemory(MEMORY_ADDRESSES.INVINCIBLE, Buffer.from([newValue]));
    return { success: true, invincible: newValue === 1 };
  }

  // ============= WARPING =============
  async warpToDungeon(dungeonName) {
    const rooms = {
      'eastern': ROOM_IDS.EASTERN_PALACE,
      'desert': ROOM_IDS.DESERT_PALACE_MAIN,
      'hera': ROOM_IDS.TOWER_HERA,
      'darkness': ROOM_IDS.PALACE_DARKNESS,
      'swamp': ROOM_IDS.SWAMP_PALACE,
      'skull': ROOM_IDS.SKULL_WOODS,
      'thieves': ROOM_IDS.THIEVES_TOWN,
      'ice': ROOM_IDS.ICE_PALACE,
      'misery': ROOM_IDS.MISERY_MIRE,
      'turtle': ROOM_IDS.TURTLE_ROCK,
      'ganon': ROOM_IDS.GANONS_TOWER
    };

    const roomId = rooms[dungeonName.toLowerCase()];
    if (!roomId) {
      return { success: false, error: 'Invalid dungeon name' };
    }

    // Set the room ID
    await this.client.writeMemory(MEMORY_ADDRESSES.CURRENT_ROOM, Buffer.from([roomId & 0xFF]));
    await this.client.writeMemory(MEMORY_ADDRESSES.CURRENT_ROOM_HIGH, Buffer.from([roomId >> 8]));

    // Set indoors flag
    await this.client.writeMemory(MEMORY_ADDRESSES.INDOORS_FLAG, Buffer.from([0x01]));

    // Trigger transition
    await this.client.writeMemory(MEMORY_ADDRESSES.MODULE_INDEX, Buffer.from([0x11]));
    await this.client.writeMemory(MEMORY_ADDRESSES.SUBMODULE_INDEX, Buffer.from([0x00]));

    return { success: true, message: `Warping to ${dungeonName}` };
  }

  async warpToLocation(locationName) {
    const locations = {
      'house': ROOM_IDS.LINKS_HOUSE,
      'sanctuary': ROOM_IDS.SANCTUARY,
      'kakariko_shop': ROOM_IDS.KAKARIKO_SHOP,
      'lost_woods_shop': ROOM_IDS.LOST_WOODS_SHOP,
      'death_mountain_shop': ROOM_IDS.DEATH_MOUNTAIN_SHOP,
      'lake_shop': ROOM_IDS.LAKE_HYLIA_SHOP,
      'potion_shop': ROOM_IDS.DARK_WORLD_POTION_SHOP
    };

    const roomId = locations[locationName.toLowerCase()];
    if (!roomId) {
      return { success: false, error: 'Invalid location name' };
    }

    await this.client.writeMemory(MEMORY_ADDRESSES.CURRENT_ROOM, Buffer.from([roomId & 0xFF]));
    await this.client.writeMemory(MEMORY_ADDRESSES.CURRENT_ROOM_HIGH, Buffer.from([roomId >> 8]));

    // Determine if indoor or outdoor
    const isIndoor = roomId < 0x100 ? 0x01 : 0x00;
    await this.client.writeMemory(MEMORY_ADDRESSES.INDOORS_FLAG, Buffer.from([isIndoor]));

    // Trigger transition
    await this.client.writeMemory(MEMORY_ADDRESSES.MODULE_INDEX, Buffer.from([0x11]));
    await this.client.writeMemory(MEMORY_ADDRESSES.SUBMODULE_INDEX, Buffer.from([0x00]));

    return { success: true, message: `Warping to ${locationName}` };
  }

  // ============= FULL LOADOUTS =============
  async giveStarterPack() {
    // Give basic equipment
    await this.setSword(1);  // Fighter sword
    await this.setShield(1); // Blue shield
    await this.giveItem(MEMORY_ADDRESSES.BOW, 1);
    await this.giveItem(MEMORY_ADDRESSES.LAMP, 1);
    await this.setBombs(10);
    await this.setArrows(30);
    await this.setRupees(100);
    await this.addBottle();

    return { success: true, message: 'Starter pack granted' };
  }

  async giveEndgamePack() {
    // Give everything for endgame
    await this.setSword(4);     // Golden sword
    await this.setShield(3);    // Mirror shield
    await this.setArmor(2);     // Red mail
    await this.setGloves(2);    // Titan mitts
    await this.giveAllMedallions();
    await this.giveItem(MEMORY_ADDRESSES.HOOKSHOT, 1);
    await this.giveItem(MEMORY_ADDRESSES.HAMMER, 1);
    await this.giveItem(MEMORY_ADDRESSES.FLIPPERS, 1);
    await this.giveItem(MEMORY_ADDRESSES.MOON_PEARL, 1);
    await this.giveItem(MEMORY_ADDRESSES.BOOTS, 1);
    await this.giveItem(MEMORY_ADDRESSES.CAPE, 1);
    await this.giveItem(MEMORY_ADDRESSES.BYRNA, 1);
    await this.giveItem(MEMORY_ADDRESSES.FIRE_ROD, 1);
    await this.giveItem(MEMORY_ADDRESSES.ICE_ROD, 1);
    await this.giveItem(MEMORY_ADDRESSES.BOW, 3); // Silver bow
    await this.setBombs(50);
    await this.setArrows(70);
    await this.setRupees(9999);
    await this.setHearts(20);
    await this.enableMagic();
    await this.setMagicUpgrade(2); // 1/4 magic
    await this.giveAllPendants();
    await this.giveAllCrystals();

    // Give 4 bottles with blue potions
    await this.client.writeMemory(MEMORY_ADDRESSES.BOTTLE_COUNT, Buffer.from([4]));
    await this.fillAllBottlesWithPotion('blue');

    return { success: true, message: 'Endgame loadout granted!' };
  }

  // ============= STATE READING =============
  async getFullInventory() {
    const inventory = {
      // Health
      currentHealth: (await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_HEALTH, 1))[0] / 8,
      maxHealth: (await this.readWithRetry(MEMORY_ADDRESSES.MAX_HEALTH, 1))[0] / 8,
      heartPieces: (await this.readWithRetry(MEMORY_ADDRESSES.HEART_PIECES, 1))[0],

      // Resources
      rupees: await this.getRupees(),
      bombs: await this.getBombs(),
      arrows: await this.getArrows(),

      // Equipment
      sword: (await this.readWithRetry(MEMORY_ADDRESSES.SWORD, 1))[0],
      shield: (await this.readWithRetry(MEMORY_ADDRESSES.SHIELD, 1))[0],
      armor: (await this.readWithRetry(MEMORY_ADDRESSES.ARMOR, 1))[0],
      gloves: (await this.readWithRetry(MEMORY_ADDRESSES.GLOVES, 1))[0],
      boots: (await this.readWithRetry(MEMORY_ADDRESSES.BOOTS, 1))[0],
      flippers: (await this.readWithRetry(MEMORY_ADDRESSES.FLIPPERS, 1))[0],
      moonPearl: (await this.readWithRetry(MEMORY_ADDRESSES.MOON_PEARL, 1))[0],

      // Items
      bow: (await this.readWithRetry(MEMORY_ADDRESSES.BOW, 1))[0],
      hookshot: (await this.readWithRetry(MEMORY_ADDRESSES.HOOKSHOT, 1))[0],
      hammer: (await this.readWithRetry(MEMORY_ADDRESSES.HAMMER, 1))[0],
      lamp: (await this.readWithRetry(MEMORY_ADDRESSES.LAMP, 1))[0],
      fireRod: (await this.readWithRetry(MEMORY_ADDRESSES.FIRE_ROD, 1))[0],
      iceRod: (await this.readWithRetry(MEMORY_ADDRESSES.ICE_ROD, 1))[0],

      // Medallions
      bombos: (await this.readWithRetry(MEMORY_ADDRESSES.BOMBOS, 1))[0],
      ether: (await this.readWithRetry(MEMORY_ADDRESSES.ETHER, 1))[0],
      quake: (await this.readWithRetry(MEMORY_ADDRESSES.QUAKE, 1))[0],

      // Progress
      pendants: (await this.readWithRetry(MEMORY_ADDRESSES.PENDANTS, 1))[0],
      crystals: (await this.readWithRetry(MEMORY_ADDRESSES.CRYSTALS, 1))[0],

      // Bottles
      bottleCount: (await this.readWithRetry(MEMORY_ADDRESSES.BOTTLE_COUNT, 1))[0],
      bottle1: (await this.readWithRetry(MEMORY_ADDRESSES.BOTTLE_1, 1))[0],
      bottle2: (await this.readWithRetry(MEMORY_ADDRESSES.BOTTLE_2, 1))[0],
      bottle3: (await this.readWithRetry(MEMORY_ADDRESSES.BOTTLE_3, 1))[0],
      bottle4: (await this.readWithRetry(MEMORY_ADDRESSES.BOTTLE_4, 1))[0]
    };

    return inventory;
  }

  // ============= DEBUG TOOLS =============

  async toggleFreezePlayer() {
    // Use MOVEMENT_LOCK to freeze player (locks all inputs including buttons)
    const movementLock = await this.readWithRetry(MEMORY_ADDRESSES.MOVEMENT_LOCK, 1);
    const newLock = movementLock[0] === 0 ? 0x01 : 0x00;
    await this.client.writeMemory(MEMORY_ADDRESSES.MOVEMENT_LOCK, Buffer.from([newLock]));

    return {
      success: true,
      frozen: newLock === 1,
      message: newLock === 1 ? 'Player frozen! (all inputs locked)' : 'Player unfrozen'
    };
  }

  async giveIcePhysics() {
    // Debug: Read current values when on ice
    const iceField = await this.readWithRetry(MEMORY_ADDRESSES.ICE_FLOOR_BITFIELD, 2);
    const linkState = await this.readWithRetry(MEMORY_ADDRESSES.LINK_STATE, 1);
    const tileType = await this.readWithRetry(MEMORY_ADDRESSES.TILE_TYPE_UNDER_LINK, 1);

    // Read some nearby addresses to understand ice physics
    const addr02E2 = await this.readWithRetry(SNES_WRAM_BASE + 0x02E2, 1);
    const addr02E3 = await this.readWithRetry(SNES_WRAM_BASE + 0x02E3, 1);

    // Build debug string to return in message
    const debugInfo = [
      '=== ICE PHYSICS DEBUG ===',
      `Ice Floor Bitfield (0x0348): 0x${iceField[0].toString(16).padStart(2, '0')} 0x${iceField[1].toString(16).padStart(2, '0')}`,
      `Link State (0x005D): 0x${linkState[0].toString(16).padStart(2, '0')}`,
      `Tile Type (0x0114): 0x${tileType[0].toString(16).padStart(2, '0')}`,
      `Address 0x02E2: 0x${addr02E2[0].toString(16).padStart(2, '0')}`,
      `Address 0x02E3: 0x${addr02E3[0].toString(16).padStart(2, '0')}`
    ].join('\n');

    // Toggle ice physics using the ice floor bitfield (0x0348)
    // The game uses 0x10 0x00 for ice physics (bit 4 set in first byte)
    const isActive = (iceField[0] & 0x10) !== 0;

    if (isActive) {
      // Turn off ice physics
      await this.client.writeMemory(MEMORY_ADDRESSES.ICE_FLOOR_BITFIELD, Buffer.from([0x00, 0x00]));
      return {
        success: true,
        iceFloor: false,
        message: `Ice physics disabled\n${debugInfo}`
      };
    } else {
      // Turn on ice physics using the correct value (0x10 = bit 4)
      await this.client.writeMemory(MEMORY_ADDRESSES.ICE_FLOOR_BITFIELD, Buffer.from([0x10, 0x00]));
      return {
        success: true,
        iceFloor: true,
        message: `Ice physics enabled!\n${debugInfo}`
      };
    }
  }

  // ============= ENEMY SPAWNING =============
  async spawnEnemyNearLink(enemyType = 'soldier') {
    try {
      // Get Link's current position
      const linkXLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS, 1);
      const linkXHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS + 1, 1);
      const linkYLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS, 1);
      const linkYHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS + 1, 1);

      // Find an empty sprite slot (check all 16 slots)
      let emptySlot = -1;
      for (let i = 0; i < 16; i++) {
        const spriteState = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_STATE + i, 1);
        if (spriteState[0] === 0) {
          emptySlot = i;
          break;
        }
      }

      if (emptySlot === -1) {
        return { success: false, error: 'No empty sprite slots available' };
      }

      // Get sprite type ID - 10 verified working enemies
      const spriteTypeMap = {
        'octorok': SPRITE_TYPES.OCTOROK,
        'ballandchain': SPRITE_TYPES.BALL_AND_CHAIN,
        'snapdragon': SPRITE_TYPES.SNAPDRAGON,
        'octoballoon': SPRITE_TYPES.OCTOBALLOON,
        'cyclops': SPRITE_TYPES.HINOX,
        'helmasaur': SPRITE_TYPES.MINI_HELMASAUR,
        'minihelmasaur': SPRITE_TYPES.MINI_MOLDORM,
        'bombguy': SPRITE_TYPES.SLUGGULA,
        'soldier': SPRITE_TYPES.SOLDIER_BLUE,
        'soldier_green': SPRITE_TYPES.SOLDIER_GREEN
      };

      const spriteId = spriteTypeMap[enemyType.toLowerCase()] || SPRITE_TYPES.SOLDIER_BLUE;

      // Get ROM initialization data for this sprite type
      const romData = SPRITE_ROM_INIT[spriteId];
      if (!romData) {
        return { success: false, error: `No ROM data available for sprite type 0x${spriteId.toString(16)}` };
      }

      // Calculate spawn position (16 pixels to the right of Link)
      const offsetX = 16;
      let spawnXLow = linkXLow[0] + offsetX;
      let spawnXHigh = linkXHigh[0];

      if (spawnXLow > 0xFF) {
        spawnXLow -= 0x100;
        spawnXHigh += 1;
      }

      // Write sprite data to empty slot
      // Position
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_LOW + emptySlot, Buffer.from([spawnXLow]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_HIGH + emptySlot, Buffer.from([spawnXHigh]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_LOW + emptySlot, Buffer.from([linkYLow[0]]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_HIGH + emptySlot, Buffer.from([linkYHigh[0]]));

      // Set sprite type and slot identifier FIRST (game needs these for initialization)
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_TYPE + emptySlot, Buffer.from([spriteId]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_N + emptySlot, Buffer.from([emptySlot]));

      // Set sprite_room to current room
      const currentRoom = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_ROOM + emptySlot, Buffer.from([currentRoom[0]]));

      // Set sprite_floor to match Link's floor level (for multi-level rooms)
      const linkFloor = await this.readWithRetry(SNES_WRAM_BASE + 0x00EE, 1);
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLOOR + emptySlot, Buffer.from([linkFloor[0]]));

      // Set sprite_die_action to 0 (normal death behavior)
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_DIE_ACTION + emptySlot, Buffer.from([0x00]));

      // CRITICAL: Set state to 0x08 LAST - this triggers game's initialization routines
      // When state = 8, the game will automatically:
      // 1. Call SpritePrep_LoadProperties() to set ROM properties (health, flags, etc.)
      // 2. Increment state from 8 to 9 (active)
      // 3. Call sprite-specific initialization function from kSpritePrep_Main table
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + emptySlot, Buffer.from([0x08]));

      return {
        success: true,
        enemy: enemyType,
        spriteId: `0x${spriteId.toString(16).padStart(2, '0')}`,
        slot: emptySlot,
        health: romData.health,
        message: `Spawned ${enemyType} near Link (slot ${emptySlot}, HP: ${romData.health})`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async spawnRandomEnemy() {
    try {
      // List of all 10 enemy types (excluding chicken attack)
      const enemies = [
        'octorok',
        'ballandchain',
        'snapdragon',
        'octoballoon',
        'cyclops',
        'helmasaur',
        'minihelmasaur',
        'bombguy',
        'soldier',
        'soldier_green'
      ];

      // Pick a random enemy
      const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];

      // Spawn the selected enemy
      return await this.spawnEnemyNearLink(randomEnemy);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============= BEE SWARM ATTACK =============
  async spawnBeeSwarm(count = 7) {
    try {
      // Validate count (5-10 bees)
      if (count < 5) count = 5;
      if (count > 10) count = 10;

      this.beeSwarmCount = count;
      this.beeSwarmSlots = [];

      // Circular spawn pattern offsets (from zelda3 source)
      const kBeeSwarm_XOffsets = [0, 16, 32, 32, 32, 16, 0, -16, -32, -32, -32, -16];
      const kBeeSwarm_YOffsets = [-32, -28, -16, 0, 16, 28, 32, 28, 16, 0, -16, -28];

      // Get Link's current position
      const linkXLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS, 1);
      const linkXHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS + 1, 1);
      const linkYLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS, 1);
      const linkYHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS + 1, 1);
      const linkX = linkXLow[0] | (linkXHigh[0] << 8);
      const linkY = linkYLow[0] | (linkYHigh[0] << 8);

      // Get current room and floor
      const currentRoom = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
      const linkFloor = await this.readWithRetry(SNES_WRAM_BASE + 0x00EE, 1);

      // Get bee ROM data
      const beeRomData = SPRITE_ROM_INIT[SPRITE_TYPES.BEE];
      if (!beeRomData) {
        return { success: false, error: 'No ROM data available for bees' };
      }

      // Spawn bees in circular pattern
      let spawned = 0;
      for (let i = 0; i < count; i++) {
        // Find an empty sprite slot
        let emptySlot = -1;
        for (let j = 0; j < 16; j++) {
          const spriteState = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_STATE + j, 1);
          if (spriteState[0] === 0) {
            emptySlot = j;
            break;
          }
        }

        if (emptySlot === -1) {
          console.log(`[Bee Swarm] No empty slots - spawned ${spawned}/${count} bees`);
          break;
        }

        // Calculate spawn position with offset
        const offsetX = kBeeSwarm_XOffsets[i % 12];
        const offsetY = kBeeSwarm_YOffsets[i % 12];
        let spawnX = linkX + offsetX;
        let spawnY = linkY + offsetY;

        // Clamp to valid range
        if (spawnX < 0) spawnX = 0;
        if (spawnX > 0xFFFF) spawnX = 0xFFFF;
        if (spawnY < 0) spawnY = 0;
        if (spawnY > 0xFFFF) spawnY = 0xFFFF;

        const spawnXLow = spawnX & 0xFF;
        const spawnXHigh = (spawnX >> 8) & 0xFF;
        const spawnYLow = spawnY & 0xFF;
        const spawnYHigh = (spawnY >> 8) & 0xFF;

        // Write sprite position
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_LOW + emptySlot, Buffer.from([spawnXLow]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_HIGH + emptySlot, Buffer.from([spawnXHigh]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_LOW + emptySlot, Buffer.from([spawnYLow]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_HIGH + emptySlot, Buffer.from([spawnYHigh]));

        // Set sprite type to bee (0x79)
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_TYPE + emptySlot, Buffer.from([SPRITE_TYPES.BEE]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_N + emptySlot, Buffer.from([emptySlot]));

        // Set sprite room and floor
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_ROOM + emptySlot, Buffer.from([currentRoom[0]]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLOOR + emptySlot, Buffer.from([linkFloor[0]]));

        // Set sprite_die_action to 0 (normal death behavior)
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_DIE_ACTION + emptySlot, Buffer.from([0x00]));

        // Set ROM properties
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_HEALTH + emptySlot, Buffer.from([beeRomData.health]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_BUMP_DAMAGE + emptySlot, Buffer.from([beeRomData.bumpDamage]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_DEFL_BITS + emptySlot, Buffer.from([beeRomData.deflBits]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS + emptySlot, Buffer.from([beeRomData.flags]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS2 + emptySlot, Buffer.from([beeRomData.flags2]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS3 + emptySlot, Buffer.from([beeRomData.flags3]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS4 + emptySlot, Buffer.from([beeRomData.flags4]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS5 + emptySlot, Buffer.from([beeRomData.flags5]));

        // Set random initial velocity
        const randomVelX = (Math.floor(Math.random() * 16)) - 8;
        const randomVelY = (Math.floor(Math.random() * 16)) - 8;
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_VEL + emptySlot, Buffer.from([randomVelX & 0xFF]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_VEL + emptySlot, Buffer.from([randomVelY & 0xFF]));

        // Initialize bee AI state (1 = active bee behavior)
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_AI_STATE + emptySlot, Buffer.from([0x01]));

        // Set sprite state to 0x09 (active) - bees don't need state 8 init
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + emptySlot, Buffer.from([0x09]));

        this.beeSwarmSlots.push(emptySlot);
        spawned++;
      }

      this.beeSwarmActive = true;

      return {
        success: true,
        message: `🐝 BEE SWARM ATTACK! ${spawned} bees attacking! 🐝`,
        beesSpawned: spawned,
        slots: this.beeSwarmSlots
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async stopBeeSwarm() {
    try {
      // Despawn all bee sprites
      for (const slot of this.beeSwarmSlots) {
        if (slot !== null) {
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + slot, Buffer.from([0]));
        }
      }

      this.beeSwarmActive = false;
      this.beeSwarmSlots = [];

      return {
        success: true,
        message: '🐝 Bee swarm ended! 🐝'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============= CHICKEN ATTACK =============

  // Start monitoring for indoor->outdoor transitions
  startIndoorsMonitoring() {
    if (this.indoorsCheckInterval) return; // Already monitoring

    this.indoorsCheckInterval = setInterval(async () => {
      try {
        await this.checkIndoorsTransition();
      } catch (error) {
        console.error('Error checking indoors transition:', error);
      }
    }, 2000); // Check every 2 seconds
  }

  // Stop monitoring
  stopIndoorsMonitoring() {
    if (this.indoorsCheckInterval) {
      clearInterval(this.indoorsCheckInterval);
      this.indoorsCheckInterval = null;
    }
  }

  // Check if player transitioned from indoors to outdoors
  async checkIndoorsTransition() {
    const indoorsFlag = await this.readWithRetry(MEMORY_ADDRESSES.INDOORS_FLAG, 1);
    const currentIndoors = indoorsFlag[0] !== 0;

    // Detect transition from indoors to outdoors
    if (this.lastIndoorsState === true && currentIndoors === false && this.pendingChickenAttack) {
      console.log('[Chicken Attack] Player went outdoors - triggering stored chicken attack!');
      this.pendingChickenAttack = false;
      await this.spawnChickenAttack();
    }

    this.lastIndoorsState = currentIndoors;
  }

  // Actually spawn the chicken attack
  async spawnChickenAttack() {
    try {
      // Get current room ID for screen transition tracking
      const currentRoom = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
      this.chickenAttackLastRoom = currentRoom[0];
      console.log(`[Chicken Attack Timer] Starting in room ${this.chickenAttackLastRoom}`);

      // Get Link's position
      const linkXLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS, 1);
      const linkXHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS + 1, 1);
      const linkYLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS, 1);
      const linkYHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS + 1, 1);

      // Find an empty sprite slot
      let emptySlot = -1;
      for (let i = 0; i < 16; i++) {
        const spriteState = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_STATE + i, 1);
        if (spriteState[0] === 0) {
          emptySlot = i;
          break;
        }
      }

      if (emptySlot === -1) {
        return { success: false, error: 'No empty sprite slots available' };
      }

      // Spawn ONE normal chicken near Link
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_LOW + emptySlot, Buffer.from([linkXLow[0]]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_HIGH + emptySlot, Buffer.from([linkXHigh[0]]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_LOW + emptySlot, Buffer.from([linkYLow[0]]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_HIGH + emptySlot, Buffer.from([linkYHigh[0]]));

      // Set sprite type to chicken (0x0B)
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_TYPE + emptySlot, Buffer.from([MEMORY_ADDRESSES.CHICKEN_SPRITE_TYPE]));

      // Set sprite state to active (0x09)
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + emptySlot, Buffer.from([0x09]));

      // Set sprite_C to 0 (NORMAL chicken, NOT attack mode)
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_C + emptySlot, Buffer.from([0x00]));

      // CRITICAL: Set sprite_B to 35 (the "hit counter")
      // This triggers continuous spawning via: if (sprite_B[k] >= 35) Cucco_SummonAvenger(k);
      // The game will call this check EVERY FRAME while the chicken sprite exists and is outdoors!
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_B + emptySlot, Buffer.from([35]));

      // Initialize other sprite properties
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_SUBTYPE + emptySlot, Buffer.from([0x00]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLOOR + emptySlot, Buffer.from([0x00]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_HEIGHT + emptySlot, Buffer.from([0x00]));
      await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_AI_STATE + emptySlot, Buffer.from([0x00]));

      // CRITICAL: Initialize ROM properties for persistence (same as enemies)
      // Without these, the chicken will despawn when it moves off-screen
      const chickenRomData = SPRITE_ROM_INIT[0x0B];  // Chicken sprite type
      if (chickenRomData) {
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_HEALTH + emptySlot, Buffer.from([chickenRomData.health]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_BUMP_DAMAGE + emptySlot, Buffer.from([chickenRomData.bumpDamage]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_DEFL_BITS + emptySlot, Buffer.from([chickenRomData.deflBits]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS + emptySlot, Buffer.from([chickenRomData.flags]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS2 + emptySlot, Buffer.from([chickenRomData.flags2]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS3 + emptySlot, Buffer.from([chickenRomData.flags3]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS4 + emptySlot, Buffer.from([chickenRomData.flags4]));
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS5 + emptySlot, Buffer.from([chickenRomData.flags5]));
      }

      // Start the 60-second timer
      await this.startChickenAttackTimer(emptySlot);

      return {
        success: true,
        message: '🐔 CHICKEN ATTACK ACTIVATED! 60 seconds of chaos! 🐔',
        chickenSlot: emptySlot,
        duration: 60
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Maintain the chicken attack by checking and respawning chickens as needed
  async maintainChickenAttack() {
    try {
      const now = Date.now();

      // Check if player is indoors - if so, skip spawning chickens
      const indoorsFlag = await this.readWithRetry(MEMORY_ADDRESSES.INDOORS_FLAG, 1);
      const isIndoors = indoorsFlag[0] !== 0;

      if (isIndoors) {
        // Player is indoors - despawn ONLY the chicken sprite (not other NPCs)
        if (this.chickenAttackSlot !== null) {
          // Verify this is actually our chicken before despawning
          const spriteType = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_TYPE + this.chickenAttackSlot, 1);
          if (spriteType[0] === MEMORY_ADDRESSES.CHICKEN_SPRITE_TYPE) {
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + this.chickenAttackSlot, Buffer.from([0]));
            console.log('[Chicken Attack Timer] Player indoors - despawned chicken');
          }
        }
        // Don't increment timer while indoors
        this.chickenAttackLastCheck = now;
        return;
      }

      // Player is outdoors - increment active time
      if (this.chickenAttackLastCheck !== null) {
        const delta = now - this.chickenAttackLastCheck;
        this.chickenAttackElapsedActive += delta;
        console.log(`[Chicken Attack Timer] Active time: ${Math.ceil(this.chickenAttackElapsedActive / 1000)}s / 60s`);
      }
      this.chickenAttackLastCheck = now;

      // Check current room for screen transitions
      const currentRoom = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
      const roomId = currentRoom[0];

      // Detect screen transition
      let screenTransition = false;
      if (this.chickenAttackLastRoom !== null && this.chickenAttackLastRoom !== roomId) {
        console.log(`[Chicken Attack Timer] Screen transition detected! ${this.chickenAttackLastRoom} -> ${roomId}`);
        screenTransition = true;
      }
      this.chickenAttackLastRoom = roomId;

      // Check if the chicken sprite still exists
      if (this.chickenAttackSlot !== null) {
        const spriteState = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_STATE + this.chickenAttackSlot, 1);
        const spriteB = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_B + this.chickenAttackSlot, 1);

        // If screen transition, chicken died, or sprite_B dropped, respawn/fix it
        if (screenTransition || spriteState[0] === 0 || spriteB[0] < 35) {
          if (screenTransition) {
            console.log('[Chicken Attack Timer] Respawning after screen transition...');
          } else {
            console.log('[Chicken Attack Timer] Chicken died or flag dropped - respawning...');
          }

          // Get Link's current position
          const linkXLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS, 1);
          const linkXHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS + 1, 1);
          const linkYLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS, 1);
          const linkYHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS + 1, 1);

          // Respawn chicken at Link's position
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_LOW + this.chickenAttackSlot, Buffer.from([linkXLow[0]]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_HIGH + this.chickenAttackSlot, Buffer.from([linkXHigh[0]]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_LOW + this.chickenAttackSlot, Buffer.from([linkYLow[0]]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_HIGH + this.chickenAttackSlot, Buffer.from([linkYHigh[0]]));

          // Set sprite type to chicken
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_TYPE + this.chickenAttackSlot, Buffer.from([MEMORY_ADDRESSES.CHICKEN_SPRITE_TYPE]));

          // Set sprite state to active
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + this.chickenAttackSlot, Buffer.from([0x09]));

          // Set sprite_C to 0 (normal chicken)
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_C + this.chickenAttackSlot, Buffer.from([0x00]));

          // CRITICAL: Reset sprite_B to 35
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_B + this.chickenAttackSlot, Buffer.from([35]));

          // Reinitialize other properties
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_SUBTYPE + this.chickenAttackSlot, Buffer.from([0x00]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLOOR + this.chickenAttackSlot, Buffer.from([0x00]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_HEIGHT + this.chickenAttackSlot, Buffer.from([0x00]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_AI_STATE + this.chickenAttackSlot, Buffer.from([0x00]));

          // Restore ROM properties
          const chickenRomData = SPRITE_ROM_INIT[0x0B];
          if (chickenRomData) {
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_HEALTH + this.chickenAttackSlot, Buffer.from([chickenRomData.health]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_BUMP_DAMAGE + this.chickenAttackSlot, Buffer.from([chickenRomData.bumpDamage]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_DEFL_BITS + this.chickenAttackSlot, Buffer.from([chickenRomData.deflBits]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS + this.chickenAttackSlot, Buffer.from([chickenRomData.flags]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS2 + this.chickenAttackSlot, Buffer.from([chickenRomData.flags2]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS3 + this.chickenAttackSlot, Buffer.from([chickenRomData.flags3]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS4 + this.chickenAttackSlot, Buffer.from([chickenRomData.flags4]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS5 + this.chickenAttackSlot, Buffer.from([chickenRomData.flags5]));
          }
        }
      }
    } catch (error) {
      console.error('[Chicken Attack Timer] Error maintaining chicken:', error);
    }
  }

  // Stop the chicken attack and clean up
  async stopChickenAttack() {
    try {
      console.log('[Chicken Attack Timer] 60 seconds of active time elapsed - stopping attack');

      // Clear the interval
      if (this.chickenAttackInterval) {
        clearInterval(this.chickenAttackInterval);
        this.chickenAttackInterval = null;
      }

      // Despawn the chicken sprite
      if (this.chickenAttackSlot !== null) {
        // Set sprite_B to 0 to stop attack spawning
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_B + this.chickenAttackSlot, Buffer.from([0]));

        // Set sprite_state to 0 to despawn
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + this.chickenAttackSlot, Buffer.from([0]));
      }

      // Reset tracking variables
      this.chickenAttackActive = false;
      this.chickenAttackStartTime = null;
      this.chickenAttackElapsedActive = 0;
      this.chickenAttackLastCheck = null;
      this.chickenAttackSlot = null;
      this.chickenAttackLastRoom = null;

      return {
        success: true,
        message: '🐔 Chicken attack ended after 60 seconds! 🐔'
      };
    } catch (error) {
      console.error('[Chicken Attack Timer] Error stopping attack:', error);
      return { success: false, error: error.message };
    }
  }

  // Start the 60-second chicken attack timer
  async startChickenAttackTimer(chickenSlot) {
    // Record start time and slot
    this.chickenAttackActive = true;
    this.chickenAttackStartTime = Date.now();
    this.chickenAttackElapsedActive = 0; // Reset active time counter
    this.chickenAttackLastCheck = Date.now(); // Initialize last check time
    this.chickenAttackSlot = chickenSlot;

    console.log('[Chicken Attack Timer] Started 60-second timer (only counts outdoor time)');

    // Create interval that runs every 500ms
    this.chickenAttackInterval = setInterval(async () => {
      try {
        // Use elapsed ACTIVE time (only when outdoors with chickens on screen)
        const remaining = Math.ceil((this.chickenAttackDuration - this.chickenAttackElapsedActive) / 1000);

        // Check if 60 seconds of active time have elapsed
        if (this.chickenAttackElapsedActive >= this.chickenAttackDuration) {
          await this.stopChickenAttack();
        } else {
          // Maintain the chicken attack (this updates chickenAttackElapsedActive)
          await this.maintainChickenAttack();
        }
      } catch (error) {
        console.error('[Chicken Attack Timer] Error in interval:', error);
      }
    }, 500); // Check every 500ms
  }

  // Main trigger function - stores attack if indoors, triggers if outdoors
  async triggerChickenAttack() {
    try {
      // Check if an attack is already active
      if (this.chickenAttackActive) {
        const remaining = Math.ceil((this.chickenAttackDuration - this.chickenAttackElapsedActive) / 1000);
        return {
          success: false,
          error: `🐔 Chicken attack already in progress! ${remaining}s of active time remaining`,
          alreadyActive: true,
          remainingSeconds: remaining
        };
      }

      // Check if player is indoors
      const indoorsFlag = await this.readWithRetry(MEMORY_ADDRESSES.INDOORS_FLAG, 1);
      const isIndoors = indoorsFlag[0] !== 0;

      if (isIndoors) {
        // Store the attack for when player goes outside
        this.pendingChickenAttack = true;
        this.startIndoorsMonitoring();
        return {
          success: true,
          message: '🐔 CHICKEN ATTACK STORED! It will trigger when you go outside! 🐔',
          stored: true,
          note: 'Exit the building to activate the chicken attack!'
        };
      } else {
        // Player is outdoors, trigger immediately
        return await this.spawnChickenAttack();
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============= ENEMY WAVES SYSTEM =============

  /**
   * Maintains 3 enemies on screen during the enemy waves event
   * Checks every 500ms for dead enemies and respawns them
   * Handles screen transitions by respawning in new rooms
   */
  async maintainEnemyWaves() {
    try {
      // Check current room for screen transitions
      const currentRoom = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
      const roomId = currentRoom[0];

      // Detect screen transition
      let screenTransition = false;
      if (this.enemyWavesLastRoom !== null && this.enemyWavesLastRoom !== roomId) {
        console.log(`[Enemy Waves Timer] Screen transition detected! ${this.enemyWavesLastRoom} -> ${roomId}`);
        screenTransition = true;
      }
      this.enemyWavesLastRoom = roomId;

      // Check and maintain all 3 enemy slots
      for (let i = 0; i < 3; i++) {
        const slotIndex = this.enemyWavesSlots[i];

        if (slotIndex !== null) {
          const spriteState = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_STATE + slotIndex, 1);

          // If screen transition or enemy died, respawn it
          if (screenTransition || spriteState[0] === 0) {
            console.log(`[Enemy Waves Timer] Enemy ${i + 1} died or screen transition - respawning`);

            // Spawn a new random enemy and update the slot
            const result = await this.spawnRandomEnemy();

            if (result.success) {
              this.enemyWavesSlots[i] = result.slot;
              console.log(`[Enemy Waves Timer] Respawned ${result.enemy} in slot ${result.slot}`);
            } else {
              console.error(`[Enemy Waves Timer] Failed to respawn enemy ${i + 1}:`, result.error);
            }
          }
        }
      }
    } catch (error) {
      console.error('[Enemy Waves Timer] Error maintaining enemies:', error);
    }
  }

  /**
   * Stops the enemy waves event after 30 seconds
   * Kills all 3 enemies and cleans up tracking state
   */
  async stopEnemyWaves() {
    try {
      console.log('[Enemy Waves Timer] 30 seconds elapsed - stopping enemy waves');

      // Clear the interval
      if (this.enemyWavesInterval) {
        clearInterval(this.enemyWavesInterval);
        this.enemyWavesInterval = null;
      }

      // Kill all 3 enemies by setting their sprite_state to 0
      for (let i = 0; i < 3; i++) {
        const slotIndex = this.enemyWavesSlots[i];
        if (slotIndex !== null) {
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + slotIndex, Buffer.from([0]));
          console.log(`[Enemy Waves Timer] Killed enemy in slot ${slotIndex}`);
        }
      }

      // Reset all tracking properties
      this.enemyWavesActive = false;
      this.enemyWavesStartTime = null;
      this.enemyWavesSlots = [null, null, null];
      this.enemyWavesLastRoom = null;

      return { success: true, message: '⚔️ Enemy waves ended after 30 seconds! All enemies defeated! ⚔️' };
    } catch (error) {
      console.error('[Enemy Waves Timer] Error stopping enemy waves:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Starts the 30-second enemy waves timer
   * Checks every 500ms for dead enemies and respawns them
   * Automatically stops after 30 seconds
   */
  async startEnemyWavesTimer() {
    this.enemyWavesActive = true;
    this.enemyWavesStartTime = Date.now();

    console.log('[Enemy Waves Timer] Started 30-second timer with 3 enemies');

    // Set up interval to check every 500ms
    this.enemyWavesInterval = setInterval(async () => {
      try {
        const elapsed = Date.now() - this.enemyWavesStartTime;
        const remaining = Math.ceil((this.enemyWavesDuration - elapsed) / 1000);

        console.log(`[Enemy Waves Timer] ${remaining}s remaining`);

        if (elapsed >= this.enemyWavesDuration) {
          // 30 seconds elapsed - stop the event
          await this.stopEnemyWaves();
        } else {
          // Maintain the 3 enemies (respawn any that died)
          await this.maintainEnemyWaves();
        }
      } catch (error) {
        console.error('[Enemy Waves Timer] Error in interval:', error);
      }
    }, 500); // Check every 500ms
  }

  /**
   * Spawns the initial 3 random enemies and starts the timer
   * Returns the result of spawning all 3 enemies
   */
  async spawnEnemyWaves() {
    try {
      console.log('[Enemy Waves] Spawning 3 random enemies...');

      const enemies = [];

      // Spawn 3 random enemies
      for (let i = 0; i < 3; i++) {
        const result = await this.spawnRandomEnemy();

        if (result.success) {
          this.enemyWavesSlots[i] = result.slot;
          enemies.push(result.enemy);
          console.log(`[Enemy Waves] Spawned enemy ${i + 1}: ${result.enemy} in slot ${result.slot}`);
        } else {
          console.error(`[Enemy Waves] Failed to spawn enemy ${i + 1}:`, result.error);
        }
      }

      // Initialize room tracking
      const currentRoom = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
      this.enemyWavesLastRoom = currentRoom[0];

      // Start the 30-second timer
      await this.startEnemyWavesTimer();

      return {
        success: true,
        message: `⚔️ ENEMY WAVES STARTED! 3 enemies spawned for 30 seconds! ⚔️`,
        enemies: enemies,
        slots: this.enemyWavesSlots.filter(s => s !== null),
        duration: '30 seconds'
      };
    } catch (error) {
      console.error('[Enemy Waves] Error spawning enemy waves:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Main entry point for triggering enemy waves
   * Prevents duplicate activations
   */
  async triggerEnemyWaves() {
    try {
      // Check if enemy waves are already active
      if (this.enemyWavesActive) {
        const elapsed = Date.now() - this.enemyWavesStartTime;
        const remaining = Math.ceil((this.enemyWavesDuration - elapsed) / 1000);
        return {
          success: false,
          error: `⚔️ Enemy waves already in progress! ${remaining}s remaining`,
          alreadyActive: true,
          remainingSeconds: remaining
        };
      }

      // Spawn enemies anywhere (indoors or outdoors)
      return await this.spawnEnemyWaves();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ===========================
  // BEE SWARM WAVES METHODS
  // ===========================

  /**
   * Maintain bee swarm waves by respawning dead bees
   */
  async maintainBeeSwarmWaves() {
    try {
      // Check if we've changed rooms
      const currentRoom = await this.readWithRetry(0x7E00A0, 2);
      const currentRoomId = currentRoom[0] | (currentRoom[1] << 8);

      // If room changed, update all bees to new room and respawn them around player
      if (this.beeSwarmWavesLastRoom !== null && this.beeSwarmWavesLastRoom !== currentRoomId) {
        console.log('Room changed during bee swarm waves, moving bees to new room');

        // Get player position in new room
        const linkXLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS, 1);
        const linkXHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS + 1, 1);
        const linkYLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS, 1);
        const linkYHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS + 1, 1);
        const linkX = linkXLow[0] | (linkXHigh[0] << 8);
        const linkY = linkYLow[0] | (linkYHigh[0] << 8);

        const currentRoomByte = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
        const linkFloor = await this.readWithRetry(SNES_WRAM_BASE + 0x00EE, 1);

        // Move all bees to new room
        for (let i = 0; i < this.beeSwarmWavesSlots.length; i++) {
          const slotIndex = this.beeSwarmWavesSlots[i];
          if (slotIndex === null) continue;

          // Calculate new position around player
          const angle = (i / 7) * Math.PI * 2;
          const distance = 80 + Math.random() * 40;
          const offsetX = Math.cos(angle) * distance;
          const offsetY = Math.sin(angle) * distance;
          let spawnX = linkX + offsetX;
          let spawnY = linkY + offsetY;

          // Clamp to valid range
          if (spawnX < 0) spawnX = 0;
          if (spawnX > 0xFFFF) spawnX = 0xFFFF;
          if (spawnY < 0) spawnY = 0;
          if (spawnY > 0xFFFF) spawnY = 0xFFFF;

          const spawnXLow = spawnX & 0xFF;
          const spawnXHigh = (spawnX >> 8) & 0xFF;
          const spawnYLow = spawnY & 0xFF;
          const spawnYHigh = (spawnY >> 8) & 0xFF;

          // Update position
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_LOW + slotIndex, Buffer.from([spawnXLow]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_HIGH + slotIndex, Buffer.from([spawnXHigh]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_LOW + slotIndex, Buffer.from([spawnYLow]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_HIGH + slotIndex, Buffer.from([spawnYHigh]));

          // Update room and floor
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_ROOM + slotIndex, Buffer.from([currentRoomByte[0]]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLOOR + slotIndex, Buffer.from([linkFloor[0]]));
        }

        this.beeSwarmWavesLastRoom = currentRoomId;
      }

      // Check each bee slot
      for (let i = 0; i < this.beeSwarmWavesSlots.length; i++) {
        const slotIndex = this.beeSwarmWavesSlots[i];
        if (slotIndex === null) continue;

        // Check if bee is still alive (using sprite state)
        const spriteState = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_STATE + slotIndex, 1);

        // If bee is dead (state 0x00), respawn it
        if (spriteState[0] === 0x00) {
          console.log(`Bee in slot ${slotIndex} died, respawning...`);

          // Get player position
          const linkXLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS, 1);
          const linkXHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS + 1, 1);
          const linkYLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS, 1);
          const linkYHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS + 1, 1);
          const linkX = linkXLow[0] | (linkXHigh[0] << 8);
          const linkY = linkYLow[0] | (linkYHigh[0] << 8);

          // Get current room and floor
          const currentRoomByte = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
          const linkFloor = await this.readWithRetry(SNES_WRAM_BASE + 0x00EE, 1);

          // Calculate spawn position with random offset
          const angle = Math.random() * Math.PI * 2;
          const distance = 80 + Math.random() * 40;
          const offsetX = Math.cos(angle) * distance;
          const offsetY = Math.sin(angle) * distance;
          let spawnX = linkX + offsetX;
          let spawnY = linkY + offsetY;

          // Clamp to valid range
          if (spawnX < 0) spawnX = 0;
          if (spawnX > 0xFFFF) spawnX = 0xFFFF;
          if (spawnY < 0) spawnY = 0;
          if (spawnY > 0xFFFF) spawnY = 0xFFFF;

          const spawnXLow = spawnX & 0xFF;
          const spawnXHigh = (spawnX >> 8) & 0xFF;
          const spawnYLow = spawnY & 0xFF;
          const spawnYHigh = (spawnY >> 8) & 0xFF;

          // Get bee ROM data
          const beeRomData = SPRITE_ROM_INIT[SPRITE_TYPES.BEE];
          if (beeRomData) {
            // Write sprite position
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_LOW + slotIndex, Buffer.from([spawnXLow]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_HIGH + slotIndex, Buffer.from([spawnXHigh]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_LOW + slotIndex, Buffer.from([spawnYLow]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_HIGH + slotIndex, Buffer.from([spawnYHigh]));

            // Set sprite type to bee
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_TYPE + slotIndex, Buffer.from([SPRITE_TYPES.BEE]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_N + slotIndex, Buffer.from([slotIndex]));

            // Set sprite room and floor
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_ROOM + slotIndex, Buffer.from([currentRoomByte[0]]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLOOR + slotIndex, Buffer.from([linkFloor[0]]));

            // Set sprite_die_action
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_DIE_ACTION + slotIndex, Buffer.from([0x00]));

            // Set ROM properties
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_HEALTH + slotIndex, Buffer.from([beeRomData.health]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_BUMP_DAMAGE + slotIndex, Buffer.from([beeRomData.bumpDamage]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_DEFL_BITS + slotIndex, Buffer.from([beeRomData.deflBits]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS + slotIndex, Buffer.from([beeRomData.flags]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS2 + slotIndex, Buffer.from([beeRomData.flags2]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS3 + slotIndex, Buffer.from([beeRomData.flags3]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS4 + slotIndex, Buffer.from([beeRomData.flags4]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS5 + slotIndex, Buffer.from([beeRomData.flags5]));

            // Set random velocity
            const randomVelX = (Math.floor(Math.random() * 16)) - 8;
            const randomVelY = (Math.floor(Math.random() * 16)) - 8;
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_VEL + slotIndex, Buffer.from([randomVelX & 0xFF]));
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_VEL + slotIndex, Buffer.from([randomVelY & 0xFF]));

            // Initialize bee AI state
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_AI_STATE + slotIndex, Buffer.from([0x01]));

            // Set sprite state to 0x09 (active)
            await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + slotIndex, Buffer.from([0x09]));
          }
        }
      }
    } catch (error) {
      console.error('Error maintaining bee swarm waves:', error);
    }
  }

  /**
   * Stop bee swarm waves event
   */
  async stopBeeSwarmWaves() {
    console.log('Stopping bee swarm waves...');

    if (this.beeSwarmWavesInterval) {
      clearInterval(this.beeSwarmWavesInterval);
      this.beeSwarmWavesInterval = null;
    }

    // Despawn all bees
    for (let i = 0; i < this.beeSwarmWavesSlots.length; i++) {
      const slotIndex = this.beeSwarmWavesSlots[i];
      if (slotIndex !== null) {
        await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + slotIndex, Buffer.from([0x00]));
      }
    }

    this.beeSwarmWavesActive = false;
    this.beeSwarmWavesStartTime = null;
    this.beeSwarmWavesLastRoom = null;

    // Clear all tracked bee slots
    this.beeSwarmWavesSlots = [null, null, null, null, null, null, null];

    console.log('Bee swarm waves stopped');
  }

  /**
   * Start the 60-second timer for bee swarm waves
   */
  startBeeSwarmWavesTimer() {
    this.beeSwarmWavesStartTime = Date.now();

    // Check timer every second
    const timerInterval = setInterval(async () => {
      const elapsed = Date.now() - this.beeSwarmWavesStartTime;

      if (elapsed >= this.beeSwarmWavesDuration) {
        console.log('Bee swarm waves duration complete (60s)');
        await this.stopBeeSwarmWaves();
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  /**
   * Spawn bee swarm waves (7 bees with 60-second duration)
   */
  async spawnBeeSwarmWaves() {
    try {
      console.log('Starting bee swarm waves (7 bees for 60 seconds)...');

      this.beeSwarmWavesActive = true;

      // Get player position
      const linkXLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS, 1);
      const linkXHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POS + 1, 1);
      const linkYLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS, 1);
      const linkYHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POS + 1, 1);
      const linkX = linkXLow[0] | (linkXHigh[0] << 8);
      const linkY = linkYLow[0] | (linkYHigh[0] << 8);

      // Get current room and floor
      const currentRoom = await this.readWithRetry(0x7E00A0, 2);
      this.beeSwarmWavesLastRoom = currentRoom[0] | (currentRoom[1] << 8);
      const currentRoomByte = await this.readWithRetry(MEMORY_ADDRESSES.CURRENT_ROOM, 1);
      const linkFloor = await this.readWithRetry(SNES_WRAM_BASE + 0x00EE, 1);

      // Get bee ROM data
      const beeRomData = SPRITE_ROM_INIT[SPRITE_TYPES.BEE];
      if (!beeRomData) {
        return { success: false, error: 'No ROM data available for bees' };
      }

      // Find 7 available sprite slots and spawn bees
      let beesSpawned = 0;
      for (let slot = 0; slot < 16 && beesSpawned < 7; slot++) {
        const spriteState = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_STATE + slot, 1);

        if (spriteState[0] === 0x00) {
          // Calculate position around player in circular pattern
          const angle = (beesSpawned / 7) * Math.PI * 2;
          const distance = 80 + Math.random() * 40;
          const offsetX = Math.cos(angle) * distance;
          const offsetY = Math.sin(angle) * distance;
          let spawnX = linkX + offsetX;
          let spawnY = linkY + offsetY;

          // Clamp to valid range
          if (spawnX < 0) spawnX = 0;
          if (spawnX > 0xFFFF) spawnX = 0xFFFF;
          if (spawnY < 0) spawnY = 0;
          if (spawnY > 0xFFFF) spawnY = 0xFFFF;

          const spawnXLow = spawnX & 0xFF;
          const spawnXHigh = (spawnX >> 8) & 0xFF;
          const spawnYLow = spawnY & 0xFF;
          const spawnYHigh = (spawnY >> 8) & 0xFF;

          // Write sprite position
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_LOW + slot, Buffer.from([spawnXLow]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_HIGH + slot, Buffer.from([spawnXHigh]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_LOW + slot, Buffer.from([spawnYLow]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_HIGH + slot, Buffer.from([spawnYHigh]));

          // Set sprite type to bee
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_TYPE + slot, Buffer.from([SPRITE_TYPES.BEE]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_N + slot, Buffer.from([slot]));

          // Set sprite room and floor
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_ROOM + slot, Buffer.from([currentRoomByte[0]]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLOOR + slot, Buffer.from([linkFloor[0]]));

          // Set sprite_die_action
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_DIE_ACTION + slot, Buffer.from([0x00]));

          // Set ROM properties
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_HEALTH + slot, Buffer.from([beeRomData.health]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_BUMP_DAMAGE + slot, Buffer.from([beeRomData.bumpDamage]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_DEFL_BITS + slot, Buffer.from([beeRomData.deflBits]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS + slot, Buffer.from([beeRomData.flags]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS2 + slot, Buffer.from([beeRomData.flags2]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS3 + slot, Buffer.from([beeRomData.flags3]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS4 + slot, Buffer.from([beeRomData.flags4]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_FLAGS5 + slot, Buffer.from([beeRomData.flags5]));

          // Set random velocity
          const randomVelX = (Math.floor(Math.random() * 16)) - 8;
          const randomVelY = (Math.floor(Math.random() * 16)) - 8;
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_X_VEL + slot, Buffer.from([randomVelX & 0xFF]));
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_Y_VEL + slot, Buffer.from([randomVelY & 0xFF]));

          // Initialize bee AI state
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_AI_STATE + slot, Buffer.from([0x01]));

          // Set sprite state to 0x09 (active)
          await this.client.writeMemory(MEMORY_ADDRESSES.SPRITE_STATE + slot, Buffer.from([0x09]));

          // Track this bee slot
          this.beeSwarmWavesSlots[beesSpawned] = slot;
          beesSpawned++;
        }
      }

      console.log(`Spawned ${beesSpawned} bees for swarm waves`);

      // Set up respawn interval (check every 500ms)
      this.beeSwarmWavesInterval = setInterval(() => {
        this.maintainBeeSwarmWaves();
      }, 500);

      // Start the 60-second timer
      this.startBeeSwarmWavesTimer();

      return {
        success: true,
        message: `🐝 Bee Swarm Waves started! ${beesSpawned} bees spawned for 60 seconds`,
        beesSpawned: beesSpawned,
        duration: 60
      };
    } catch (error) {
      console.error('Error spawning bee swarm waves:', error);
      await this.stopBeeSwarmWaves();
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger bee swarm waves (main entry point)
   */
  async triggerBeeSwarmWaves() {
    try {
      // Check if already active
      if (this.beeSwarmWavesActive) {
        const elapsed = Date.now() - this.beeSwarmWavesStartTime;
        const remaining = Math.ceil((this.beeSwarmWavesDuration - elapsed) / 1000);
        return {
          success: false,
          error: `🐝 Bee swarm waves already in progress! ${remaining}s remaining`,
          alreadyActive: true,
          remainingSeconds: remaining
        };
      }

      return await this.spawnBeeSwarmWaves();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = ExpandedGameOperations;