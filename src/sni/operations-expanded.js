const {
  MEMORY_ADDRESSES,
  POWERUP_TYPES,
  RESERVE_ITEMS,
  YOSHI_COLORS,
  SPRITE_TYPES,
  GAME_MODES,
  CONTROLLER_BUTTONS,
  SNES_WRAM_BASE
} = require('./memory-complete');

class ExpandedGameOperations {
  constructor(sniClient) {
    this.client = sniClient;

    // Timer-based physics chaos properties
    this.physicsModActive = false;
    this.physicsModStartTime = null;
    this.physicsModDuration = 0;
    this.physicsModInterval = null;
    this.physicsModType = null;
    this.physicsModOriginalValues = {};

    // Enemy wave properties
    this.enemyWaveActive = false;
    this.enemyWaveStartTime = null;
    this.enemyWaveDuration = 0;
    this.enemyWaveInterval = null;
    this.enemyWaveSlots = [];

    // Temporary effect timers
    this.activeTimers = new Map(); // Generic timer storage for timed effects
  }

  // ============= HELPER METHODS =============

  async readWithRetry(address, size, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.client.readMemory(address, size);
        return result;
      } catch (error) {
        if (attempt === maxAttempts) {
          console.error(`[readWithRetry] Failed after ${maxAttempts} attempts:`, error.message);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
  }

  async writeWithRetry(address, data, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.client.writeMemory(address, data);
        return true;
      } catch (error) {
        if (attempt === maxAttempts) {
          console.error(`[writeWithRetry] Failed after ${maxAttempts} attempts:`, error.message);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
  }

  // Get Mario's current position
  async getMarioPosition() {
    try {
      const xLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POSITION, 1);
      const yLow = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POSITION, 1);
      const xHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_X_POSITION + 1, 1);
      const yHigh = await this.readWithRetry(MEMORY_ADDRESSES.PLAYER_Y_POSITION + 1, 1);

      return {
        x: (xHigh[0] << 8) | xLow[0],
        y: (yHigh[0] << 8) | yLow[0]
      };
    } catch (error) {
      console.error('[getMarioPosition] Error:', error.message);
      return { x: 0, y: 0 };
    }
  }

  // Find an empty sprite slot (returns slot index 0-11, or -1 if none available)
  async findEmptySpriteSlot() {
    try {
      const statusArray = await this.readWithRetry(MEMORY_ADDRESSES.SPRITE_STATUS, 12);
      for (let i = 0; i < 12; i++) {
        if (statusArray[i] === 0x00) {
          return i;
        }
      }
      return -1; // No empty slots
    } catch (error) {
      console.error('[findEmptySpriteSlot] Error:', error.message);
      return -1;
    }
  }

  // Spawn a sprite at specific coordinates
  async spawnSpriteAtPosition(spriteType, x, y, slotIndex = null) {
    try {
      // Find empty slot if not specified
      if (slotIndex === null) {
        slotIndex = await this.findEmptySpriteSlot();
      }

      if (slotIndex === -1) {
        console.log('[spawnSpriteAtPosition] No empty sprite slots available');
        return false;
      }

      // Write sprite type
      await this.writeWithRetry(MEMORY_ADDRESSES.SPRITE_TYPE + slotIndex, Buffer.from([spriteType]));

      // Write position (split into low/high bytes)
      const xLow = x & 0xFF;
      const xHigh = (x >> 8) & 0xFF;
      const yLow = y & 0xFF;
      const yHigh = (y >> 8) & 0xFF;

      await this.writeWithRetry(MEMORY_ADDRESSES.SPRITE_X_LOW + slotIndex, Buffer.from([xLow]));
      await this.writeWithRetry(MEMORY_ADDRESSES.SPRITE_X_HIGH + slotIndex, Buffer.from([xHigh]));
      await this.writeWithRetry(MEMORY_ADDRESSES.SPRITE_Y_LOW + slotIndex, Buffer.from([yLow]));
      await this.writeWithRetry(MEMORY_ADDRESSES.SPRITE_Y_HIGH + slotIndex, Buffer.from([yHigh]));

      // Activate sprite (0x08 = normal active status for most sprites)
      await this.writeWithRetry(MEMORY_ADDRESSES.SPRITE_STATUS + slotIndex, Buffer.from([0x08]));

      console.log(`[spawnSpriteAtPosition] Spawned sprite type ${spriteType} at slot ${slotIndex}, position (${x}, ${y})`);
      return slotIndex;
    } catch (error) {
      console.error('[spawnSpriteAtPosition] Error:', error.message);
      return false;
    }
  }

  // ============= CATEGORY 1: POWER-UP MANAGEMENT (15 methods) =============

  // Set Mario's power-up state directly
  async setMarioPowerup(powerupType) {
    try {
      await this.writeWithRetry(MEMORY_ADDRESSES.POWERUP_STATUS, Buffer.from([powerupType]));
      console.log(`[setMarioPowerup] Set power-up to ${powerupType}`);
      return true;
    } catch (error) {
      console.error('[setMarioPowerup] Error:', error.message);
      return false;
    }
  }

  // Give Super Mushroom (upgrade to Super Mario)
  async giveMushroom() {
    try {
      const current = await this.readWithRetry(MEMORY_ADDRESSES.POWERUP_STATUS, 1);
      if (current[0] === POWERUP_TYPES.SMALL) {
        await this.setMarioPowerup(POWERUP_TYPES.SUPER);
        console.log('[giveMushroom] Upgraded Small Mario to Super Mario');
      } else {
        // If already powered up, add to reserve
        await this.writeWithRetry(MEMORY_ADDRESSES.RESERVE_ITEM, Buffer.from([RESERVE_ITEMS.MUSHROOM]));
        console.log('[giveMushroom] Added mushroom to reserve');
      }
      return true;
    } catch (error) {
      console.error('[giveMushroom] Error:', error.message);
      return false;
    }
  }

  // Give Fire Flower
  async giveFireFlower() {
    try {
      await this.setMarioPowerup(POWERUP_TYPES.FIRE);
      console.log('[giveFireFlower] Gave Fire Flower');
      return true;
    } catch (error) {
      console.error('[giveFireFlower] Error:', error.message);
      return false;
    }
  }

  // Give Cape Feather
  async giveCapeFeather() {
    try {
      await this.setMarioPowerup(POWERUP_TYPES.CAPE);
      console.log('[giveCapeFeather] Gave Cape Feather');
      return true;
    } catch (error) {
      console.error('[giveCapeFeather] Error:', error.message);
      return false;
    }
  }

  // Give Star Power (invincibility)
  async giveStarman(duration = 20) {
    try {
      // Star timer: ~0x30 (48 decimal) for standard duration
      const timerValue = Math.min(duration * 2.4, 255); // Convert seconds to frames (~60fps)
      await this.writeWithRetry(MEMORY_ADDRESSES.STAR_POWER_TIMER, Buffer.from([timerValue]));
      console.log(`[giveStarman] Activated Star Power for ${duration} seconds`);
      return true;
    } catch (error) {
      console.error('[giveStarman] Error:', error.message);
      return false;
    }
  }

  // Remove current power-up (downgrade)
  async removePowerup() {
    try {
      const current = await this.readWithRetry(MEMORY_ADDRESSES.POWERUP_STATUS, 1);
      if (current[0] > POWERUP_TYPES.SMALL) {
        // Downgrade one level
        if (current[0] === POWERUP_TYPES.SUPER) {
          await this.setMarioPowerup(POWERUP_TYPES.SMALL);
        } else {
          await this.setMarioPowerup(POWERUP_TYPES.SUPER);
        }
        console.log('[removePowerup] Downgraded power-up');
      }
      return true;
    } catch (error) {
      console.error('[removePowerup] Error:', error.message);
      return false;
    }
  }

  // Give Yoshi (spawn Yoshi sprite or set Yoshi state)
  async giveYoshi(color = YOSHI_COLORS.GREEN) {
    try {
      // Set Yoshi color
      await this.writeWithRetry(MEMORY_ADDRESSES.YOSHI_COLOR, Buffer.from([color]));

      // Spawn Yoshi egg near Mario
      const pos = await this.getMarioPosition();
      await this.spawnSpriteAtPosition(SPRITE_TYPES.YOSHI_EGG, pos.x + 16, pos.y);

      console.log(`[giveYoshi] Spawned ${Object.keys(YOSHI_COLORS)[color]} Yoshi egg`);
      return true;
    } catch (error) {
      console.error('[giveYoshi] Error:', error.message);
      return false;
    }
  }

  // Remove Yoshi (if riding)
  async removeYoshi() {
    try {
      // Clear Yoshi color (indicates not riding Yoshi)
      await this.writeWithRetry(MEMORY_ADDRESSES.YOSHI_COLOR, Buffer.from([0xFF]));
      console.log('[removeYoshi] Removed Yoshi');
      return true;
    } catch (error) {
      console.error('[removeYoshi] Error:', error.message);
      return false;
    }
  }

  // Give reserve item
  async giveReserveItem(itemType = RESERVE_ITEMS.MUSHROOM) {
    try {
      await this.writeWithRetry(MEMORY_ADDRESSES.RESERVE_ITEM, Buffer.from([itemType]));
      console.log(`[giveReserveItem] Set reserve item to ${itemType}`);
      return true;
    } catch (error) {
      console.error('[giveReserveItem] Error:', error.message);
      return false;
    }
  }

  // Clear reserve item
  async clearReserveItem() {
    try {
      await this.writeWithRetry(MEMORY_ADDRESSES.RESERVE_ITEM, Buffer.from([RESERVE_ITEMS.NONE]));
      console.log('[clearReserveItem] Cleared reserve item');
      return true;
    } catch (error) {
      console.error('[clearReserveItem] Error:', error.message);
      return false;
    }
  }

  // Add life
  async addLife(count = 1) {
    try {
      const current = await this.readWithRetry(MEMORY_ADDRESSES.LIVES, 1);
      const newLives = Math.min(current[0] + count, 99); // Max 99 lives
      await this.writeWithRetry(MEMORY_ADDRESSES.LIVES, Buffer.from([newLives]));
      console.log(`[addLife] Added ${count} life/lives (now ${newLives})`);
      return true;
    } catch (error) {
      console.error('[addLife] Error:', error.message);
      return false;
    }
  }

  // Remove life
  async removeLife(count = 1) {
    try {
      const current = await this.readWithRetry(MEMORY_ADDRESSES.LIVES, 1);
      const newLives = Math.max(current[0] - count, 0);
      await this.writeWithRetry(MEMORY_ADDRESSES.LIVES, Buffer.from([newLives]));
      console.log(`[removeLife] Removed ${count} life/lives (now ${newLives})`);
      return true;
    } catch (error) {
      console.error('[removeLife] Error:', error.message);
      return false;
    }
  }

  // Add coins
  async addCoins(amount = 10) {
    try {
      const current = await this.readWithRetry(MEMORY_ADDRESSES.COINS, 1);
      let newCoins = current[0] + amount;

      // Check for 100-coin 1-ups
      while (newCoins >= 100) {
        await this.addLife(1);
        newCoins -= 100;
      }

      await this.writeWithRetry(MEMORY_ADDRESSES.COINS, Buffer.from([newCoins]));
      console.log(`[addCoins] Added ${amount} coins (now ${newCoins})`);
      return true;
    } catch (error) {
      console.error('[addCoins] Error:', error.message);
      return false;
    }
  }

  // Remove coins
  async removeCoins(amount = 10) {
    try {
      const current = await this.readWithRetry(MEMORY_ADDRESSES.COINS, 1);
      const newCoins = Math.max(current[0] - amount, 0);
      await this.writeWithRetry(MEMORY_ADDRESSES.COINS, Buffer.from([newCoins]));
      console.log(`[removeCoins] Removed ${amount} coins (now ${newCoins})`);
      return true;
    } catch (error) {
      console.error('[removeCoins] Error:', error.message);
      return false;
    }
  }

  // Activate P-Switch
  async activatePSwitch(duration = 9) {
    try {
      // P-Switch timer: ~0x200 frames for 9 seconds
      const timerValue = Math.min(duration * 60, 0x3FF); // ~60 fps, max 0x3FF
      const timerLow = timerValue & 0xFF;
      const timerHigh = (timerValue >> 8) & 0xFF;

      // P-Switch timer is 2 bytes
      await this.writeWithRetry(MEMORY_ADDRESSES.P_SWITCH_TIMER, Buffer.from([timerLow]));
      await this.writeWithRetry(MEMORY_ADDRESSES.P_SWITCH_TIMER + 1, Buffer.from([timerHigh]));

      console.log(`[activatePSwitch] Activated P-Switch for ${duration} seconds`);
      return true;
    } catch (error) {
      console.error('[activatePSwitch] Error:', error.message);
      return false;
    }
  }

  // ============= CATEGORY 2: ENEMY/HAZARD SPAWNING (20 methods) - TO BE IMPLEMENTED =============
  // TODO: Implement enemy spawning methods

  // ============= CATEGORY 3: LEVEL/WORLD WARPING (15 methods) - TO BE IMPLEMENTED =============
  // TODO: Implement warping methods

  // ============= CATEGORY 4: PHYSICS/MOVEMENT CHAOS (15 methods) - TO BE IMPLEMENTED =============
  // TODO: Implement physics chaos methods

  // ============= KO PLAYER (MAIN ACTION) =============
  async killPlayer() {
    try {
      // Set Mario to small and remove lives to trigger death
      await this.setMarioPowerup(POWERUP_TYPES.SMALL);
      await this.removeLife(1);
      console.log('[killPlayer] Killed Mario');
      return true;
    } catch (error) {
      console.error('[killPlayer] Error:', error.message);
      return false;
    }
  }

  // ============= CLEANUP =============
  cleanup() {
    // Clear all active timers
    if (this.physicsModInterval) {
      clearInterval(this.physicsModInterval);
      this.physicsModInterval = null;
    }
    if (this.enemyWaveInterval) {
      clearInterval(this.enemyWaveInterval);
      this.enemyWaveInterval = null;
    }

    // Clear all generic timers
    for (const [key, timer] of this.activeTimers.entries()) {
      clearInterval(timer);
      this.activeTimers.delete(key);
    }

    console.log('[cleanup] Cleared all active timers and intervals');
  }
}

module.exports = ExpandedGameOperations;
