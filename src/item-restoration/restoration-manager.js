// ItemRestorationManager - Temporarily disable items and auto-restore after time period
// Used for TikTok gift integration to remove items from Link's inventory temporarily

const { MEMORY_ADDRESSES } = require('../sni/memory-complete');

class ItemRestorationManager {
  constructor(gameOperations) {
    this.gameOps = gameOperations;
    this.activeRestorations = new Map(); // Map<itemName, restorationData>
    this.timers = new Map(); // Map<itemName, timeoutId>
  }

  /**
   * Temporarily remove an item and schedule restoration
   * @param {string} itemName - Name of item (e.g., 'bow', 'hammer', 'boots')
   * @param {number} durationSeconds - How long to remove it for
   * @returns {Promise<Object>} Result object with success status
   */
  async disableItemTemporarily(itemName, durationSeconds) {
    const itemConfig = this.getItemConfig(itemName);
    if (!itemConfig) {
      return { success: false, error: `Unknown item: ${itemName}` };
    }

    // Check if item is already disabled - reject if so (per user requirement)
    if (this.activeRestorations.has(itemName)) {
      const existing = this.activeRestorations.get(itemName);
      const remaining = Math.ceil((existing.restoreAt - Date.now()) / 1000);
      return {
        success: false,
        error: `${itemConfig.displayName} is already disabled (${remaining}s remaining)`,
        alreadyDisabled: true
      };
    }

    try {
      // Read current item value
      const currentValue = await this.gameOps.readWithRetry(itemConfig.address, 1);
      const originalValue = currentValue[0];

      // If item is already at 0, succeed but do nothing (per user requirement)
      if (originalValue === 0) {
        return {
          success: true,
          warning: `${itemConfig.displayName} is not currently in inventory`,
          noAction: true
        };
      }

      // Store original state
      const restorationData = {
        itemName: itemName,
        originalValue: originalValue,
        address: itemConfig.address,
        hasAbilityFlag: itemConfig.hasAbilityFlag || false,
        abilityFlagMask: itemConfig.abilityFlagMask || 0,
        abilityFlagAddress: itemConfig.abilityFlagAddress,
        disabledAt: Date.now(),
        restoreAt: Date.now() + (durationSeconds * 1000),
        displayName: itemConfig.displayName
      };

      // Read and store Y button slot (so we can restore it if this item was equipped)
      const yButtonSlot = await this.gameOps.readWithRetry(MEMORY_ADDRESSES.Y_BUTTON_ITEM, 1);
      restorationData.originalYButtonSlot = yButtonSlot[0];

      // Remove item (set to 0)
      await this.gameOps.client.writeMemory(itemConfig.address, Buffer.from([0x00]));

      // Clear Y button slot if this item is currently equipped
      // Y button slot stores item IDs that correspond to inventory positions
      // Setting to 0x00 will deselect any equipped item
      await this.gameOps.client.writeMemory(MEMORY_ADDRESSES.Y_BUTTON_ITEM, Buffer.from([0x00]));

      // Handle ability flags (boots, flippers, moon pearl)
      if (itemConfig.hasAbilityFlag) {
        const abilityFlags = await this.gameOps.readWithRetry(itemConfig.abilityFlagAddress, 1);
        restorationData.originalAbilityFlags = abilityFlags[0];

        // Clear the ability bit
        const newFlags = abilityFlags[0] & ~itemConfig.abilityFlagMask;
        await this.gameOps.client.writeMemory(itemConfig.abilityFlagAddress, Buffer.from([newFlags]));
      }

      // Store restoration data
      this.activeRestorations.set(itemName, restorationData);

      // Schedule restoration
      const timerId = setTimeout(() => {
        this.restoreItem(itemName);
      }, durationSeconds * 1000);

      this.timers.set(itemName, timerId);

      console.log(`🚫 ${itemConfig.displayName} disabled for ${durationSeconds} seconds (original value: ${originalValue})`);

      return {
        success: true,
        itemName,
        displayName: itemConfig.displayName,
        disabled: true,
        restoreIn: durationSeconds,
        originalValue: originalValue,
        message: `${itemConfig.displayName} disabled for ${durationSeconds} seconds`
      };
    } catch (error) {
      console.error(`Failed to disable ${itemName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore an item to its original state
   * @param {string} itemName - Name of item to restore
   * @returns {Promise<Object>} Result object with success status
   */
  async restoreItem(itemName) {
    const restorationData = this.activeRestorations.get(itemName);
    if (!restorationData) {
      return { success: false, error: `No restoration data for ${itemName}` };
    }

    try {
      // Restore item value
      await this.gameOps.client.writeMemory(
        restorationData.address,
        Buffer.from([restorationData.originalValue])
      );

      // NOTE: We do NOT restore the Y button slot - let the user keep whatever they selected
      // The item is restored to inventory, but won't auto-equip

      // Restore ability flag if applicable
      if (restorationData.hasAbilityFlag) {
        await this.gameOps.client.writeMemory(
          restorationData.abilityFlagAddress,
          Buffer.from([restorationData.originalAbilityFlags])
        );
      }

      // Cleanup
      const timerId = this.timers.get(itemName);
      if (timerId) {
        clearTimeout(timerId);
        this.timers.delete(itemName);
      }
      this.activeRestorations.delete(itemName);

      console.log(`✅ Restored ${restorationData.displayName} to original value: ${restorationData.originalValue}`);

      return {
        success: true,
        itemName,
        displayName: restorationData.displayName,
        restored: true,
        restoredValue: restorationData.originalValue,
        message: `${restorationData.displayName} has been restored!`
      };
    } catch (error) {
      console.error(`Failed to restore ${itemName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel a scheduled restoration and immediately restore the item
   * @param {string} itemName - Name of item to restore early
   * @returns {Promise<Object>} Result from restoreItem
   */
  async cancelRestore(itemName) {
    return await this.restoreItem(itemName);
  }

  /**
   * Get all active restorations with time remaining
   * @returns {Array<Object>} Array of active restoration objects
   */
  getActiveRestorations() {
    const active = [];
    const now = Date.now();

    for (const [itemName, data] of this.activeRestorations.entries()) {
      const remaining = Math.max(0, data.restoreAt - now);
      active.push({
        itemName,
        displayName: data.displayName,
        remainingSeconds: Math.ceil(remaining / 1000),
        remainingMs: remaining,
        originalValue: data.originalValue,
        disabledAt: data.disabledAt,
        restoreAt: data.restoreAt
      });
    }

    return active;
  }

  /**
   * Restore all disabled items immediately
   * @returns {Promise<Object>} Summary of all restorations
   */
  async restoreAll() {
    const itemNames = Array.from(this.activeRestorations.keys());
    const results = [];

    for (const itemName of itemNames) {
      const result = await this.restoreItem(itemName);
      results.push(result);
    }

    return {
      success: true,
      restoredCount: results.filter(r => r.success).length,
      results
    };
  }

  /**
   * Clear all timers (call on app shutdown)
   */
  cleanup() {
    console.log('Cleaning up ItemRestorationManager timers...');
    for (const timerId of this.timers.values()) {
      clearTimeout(timerId);
    }
    this.timers.clear();
    this.activeRestorations.clear();
  }

  /**
   * Restore all items on app restart (timers are lost)
   */
  async restoreAllOnStartup() {
    const itemNames = Array.from(this.activeRestorations.keys());
    console.log(`App restarted with ${itemNames.length} items pending restoration - restoring all...`);
    return await this.restoreAll();
  }

  /**
   * Get item configuration (address, flags, display name, etc.)
   * @param {string} itemName - Internal item name (lowercase, underscores)
   * @returns {Object|null} Item config object or null if not found
   */
  getItemConfig(itemName) {
    const itemConfigs = {
      'bow': {
        address: MEMORY_ADDRESSES.BOW,
        displayName: 'Bow'
      },
      'boomerang': {
        address: MEMORY_ADDRESSES.BOOMERANG,
        displayName: 'Boomerang'
      },
      'hookshot': {
        address: MEMORY_ADDRESSES.HOOKSHOT,
        displayName: 'Hookshot'
      },
      'powder': {
        address: MEMORY_ADDRESSES.MUSHROOM_POWDER,
        displayName: 'Magic Powder'
      },
      'firerod': {
        address: MEMORY_ADDRESSES.FIRE_ROD,
        displayName: 'Fire Rod'
      },
      'icerod': {
        address: MEMORY_ADDRESSES.ICE_ROD,
        displayName: 'Ice Rod'
      },
      'bombos': {
        address: MEMORY_ADDRESSES.BOMBOS,
        displayName: 'Bombos Medallion'
      },
      'ether': {
        address: MEMORY_ADDRESSES.ETHER,
        displayName: 'Ether Medallion'
      },
      'quake': {
        address: MEMORY_ADDRESSES.QUAKE,
        displayName: 'Quake Medallion'
      },
      'lamp': {
        address: MEMORY_ADDRESSES.LAMP,
        displayName: 'Lamp'
      },
      'hammer': {
        address: MEMORY_ADDRESSES.HAMMER,
        displayName: 'Hammer'
      },
      'shovel': {
        address: MEMORY_ADDRESSES.FLUTE_SHOVEL,
        displayName: 'Shovel',
        note: 'Sets FLUTE_SHOVEL to 0 (flute is value 2+, shovel is 1)'
      },
      'net': {
        address: MEMORY_ADDRESSES.BUG_NET,
        displayName: 'Bug Net'
      },
      'book': {
        address: MEMORY_ADDRESSES.BOOK,
        displayName: 'Book of Mudora'
      },
      'somaria': {
        address: MEMORY_ADDRESSES.SOMARIA,
        displayName: 'Cane of Somaria'
      },
      'byrna': {
        address: MEMORY_ADDRESSES.BYRNA,
        displayName: 'Cane of Byrna'
      },
      'cape': {
        address: MEMORY_ADDRESSES.CAPE,
        displayName: 'Magic Cape'
      },
      'mirror': {
        address: MEMORY_ADDRESSES.MIRROR,
        displayName: 'Magic Mirror'
      },
      'boots': {
        address: MEMORY_ADDRESSES.BOOTS,
        displayName: 'Pegasus Boots',
        hasAbilityFlag: true,
        abilityFlagAddress: MEMORY_ADDRESSES.ABILITY_FLAGS,
        abilityFlagMask: 0x04
      },
      'gloves': {
        address: MEMORY_ADDRESSES.GLOVES,
        displayName: 'Gloves'
      },
      'flippers': {
        address: MEMORY_ADDRESSES.FLIPPERS,
        displayName: 'Flippers',
        hasAbilityFlag: true,
        abilityFlagAddress: MEMORY_ADDRESSES.ABILITY_FLAGS,
        abilityFlagMask: 0x02
      },
      'moonpearl': {
        address: MEMORY_ADDRESSES.MOON_PEARL,
        displayName: 'Moon Pearl',
        hasAbilityFlag: true,
        abilityFlagAddress: MEMORY_ADDRESSES.ABILITY_FLAGS,
        abilityFlagMask: 0x01
      },
      'sword': {
        address: MEMORY_ADDRESSES.SWORD,
        displayName: 'Sword'
      },
      'shield': {
        address: MEMORY_ADDRESSES.SHIELD,
        displayName: 'Shield'
      },
      'armor': {
        address: MEMORY_ADDRESSES.ARMOR,
        displayName: 'Armor'
      }
    };

    return itemConfigs[itemName.toLowerCase()] || null;
  }

  /**
   * Get list of all supported item names
   * @returns {Array<string>} Array of item names
   */
  getSupportedItems() {
    return [
      'bow', 'boomerang', 'hookshot', 'powder', 'firerod', 'icerod',
      'bombos', 'ether', 'quake', 'lamp', 'hammer', 'shovel', 'net',
      'book', 'somaria', 'byrna', 'cape', 'mirror', 'boots', 'gloves',
      'flippers', 'moonpearl', 'sword', 'shield', 'armor'
    ];
  }
}

module.exports = ItemRestorationManager;
