/**
 * MarioMod Spawner
 *
 * Implements MarioMod's trigger-based sprite and block spawning system.
 * Ported from HoellCC SmwOperations.cs (lines 287-549)
 *
 * REQUIRES: Super Mario World ROM with MarioMod ASM patch applied
 *
 * How it works:
 * - MarioMod patch adds memory-mapped triggers for spawning
 * - Positions are relative to Mario's current location at spawn time
 * - Spawns work in any level at any camera position
 */

class MarioModSpawner {
  constructor(sniClient) {
    this.client = sniClient;

    // MarioMod Memory Addresses (0x7E0000 base)
    this.MARIOMOD_SPAWN_SPRITE_FLAG = 0x7E188E;      // Write 0x01 to trigger spawn
    this.MARIOMOD_SPAWN_SPRITE_ID = 0x7E1869;        // Sprite ID (0-200)
    this.MARIOMOD_SPAWN_SPRITE_IS_CUSTOM = 0x7E1868; // 0x00=normal, 0x01=custom
    this.MARIOMOD_SPAWN_SPRITE_X_OFFSET_POS = 0x7E146C; // Positive X offset (pixels)
    this.MARIOMOD_SPAWN_SPRITE_X_OFFSET_NEG = 0x7E146D; // Negative X offset (pixels)
    this.MARIOMOD_SPAWN_SPRITE_Y_OFFSET_POS = 0x7E146E; // Positive Y offset (pixels)
    this.MARIOMOD_SPAWN_SPRITE_Y_OFFSET_NEG = 0x7E146F; // Negative Y offset (pixels)

    // Block spawning addresses (from HoellCC SmwOperations.cs lines 27-32)
    this.MARIOMOD_SPAWN_BLOCK_FLAG = 0x7E188A;          // Write 0x01 to trigger immediate block spawn
    this.MARIOMOD_SPAWN_BLOCK_ID = 0x7E1F2B;            // Map16 block ID (16-bit, 2 bytes)
    this.MARIOMOD_SPAWN_BLOCK_X_OFFSET_POS = 0x7E1F3B;  // Block X offset (positive)
    this.MARIOMOD_SPAWN_BLOCK_X_OFFSET_NEG = 0x7E1F48;  // Block X offset (negative)
    this.MARIOMOD_SPAWN_BLOCK_Y_OFFSET_POS = 0x7E1FFA;  // Block Y offset (positive)
    this.MARIOMOD_SPAWN_BLOCK_Y_OFFSET_NEG = 0x7E1FFF;  // Block Y offset (negative)
    this.MARIOMOD_BLOCK_ON_JUMP_FLAG = 0x7E1DEF;        // Write 0x01 to arm block spawn on next jump
  }

  /**
   * Converts signed offset (-128 to +127) to positive/negative byte pairs
   * Example: -32 → { pos: 0, neg: 32 }
   * Example: +48 → { pos: 48, neg: 0 }
   */
  convertSignedOffsets(xOffset, yOffset) {
    return {
      xPos: xOffset > 0 ? xOffset & 0xFF : 0,
      xNeg: xOffset < 0 ? Math.abs(xOffset) & 0xFF : 0,
      yPos: yOffset > 0 ? yOffset & 0xFF : 0,
      yNeg: yOffset < 0 ? Math.abs(yOffset) & 0xFF : 0
    };
  }

  /**
   * Spawns a sprite using MarioMod's patched spawn system.
   * Position is relative to Mario's current position at spawn time.
   *
   * Direct port from HoellCC SmwOperations.cs:287-310
   *
   * @param {number} spriteId - Sprite ID (0-200)
   * @param {number} xOffsetPos - Positive X offset in pixels (0-255)
   * @param {number} xOffsetNeg - Negative X offset in pixels (0-255)
   * @param {number} yOffsetPos - Positive Y offset in pixels (0-255)
   * @param {number} yOffsetNeg - Negative Y offset in pixels (0-255)
   * @param {boolean} isCustomSprite - Whether this is a custom sprite (default: false)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async spawnSpriteViaMarioMod(
    spriteId,
    xOffsetPos = 0,
    xOffsetNeg = 0,
    yOffsetPos = 0,
    yOffsetNeg = 0,
    isCustomSprite = false
  ) {
    if (!this.client.deviceURI) {
      return { success: false, error: 'No device connected' };
    }

    // Validate sprite ID range
    if (spriteId < 0 || spriteId > 200) {
      return { success: false, error: `Invalid sprite ID: ${spriteId}` };
    }

    try {
      // Write sprite parameters to MarioMod memory
      await this.client.writeMemory(this.MARIOMOD_SPAWN_SPRITE_ID, Buffer.from([spriteId & 0xFF]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_SPRITE_IS_CUSTOM, Buffer.from([isCustomSprite ? 0x01 : 0x00]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_SPRITE_X_OFFSET_POS, Buffer.from([xOffsetPos & 0xFF]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_SPRITE_X_OFFSET_NEG, Buffer.from([xOffsetNeg & 0xFF]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_SPRITE_Y_OFFSET_POS, Buffer.from([yOffsetPos & 0xFF]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_SPRITE_Y_OFFSET_NEG, Buffer.from([yOffsetNeg & 0xFF]));

      // Trigger the spawn
      await this.client.writeMemory(this.MARIOMOD_SPAWN_SPRITE_FLAG, Buffer.from([0x01]));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Convenience wrapper for sprite spawning with signed offsets
   *
   * Port from HoellCC SmwOperations.cs:316-320
   *
   * @param {number} spriteId - Sprite ID (0-200)
   * @param {number} xOffset - Signed X offset (-128 to +127 pixels)
   * @param {number} yOffset - Signed Y offset (-128 to +127 pixels)
   * @param {boolean} isCustomSprite - Whether this is a custom sprite (default: false)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async spawnSprite(spriteId, xOffset = 0, yOffset = 0, isCustomSprite = false) {
    const { xPos, xNeg, yPos, yNeg } = this.convertSignedOffsets(xOffset, yOffset);
    return await this.spawnSpriteViaMarioMod(spriteId, xPos, xNeg, yPos, yNeg, isCustomSprite);
  }

  /**
   * Generic enemy spawner
   * All enemy alias methods delegate to this
   *
   * Port from HoellCC SmwOperations.cs:326-333
   *
   * @param {number} enemyType - Enemy sprite ID (0-200)
   * @param {number} xOffset - X offset from Mario in pixels (default: 32 = 32px right)
   * @param {number} yOffset - Y offset from Mario in pixels (default: 0 = same height)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async spawnEnemy(enemyType, xOffset = 32, yOffset = 0) {
    if (enemyType < 0 || enemyType > 200) {
      return { success: false, error: `Invalid enemy type: ${enemyType}` };
    }

    return await this.spawnSprite(enemyType, xOffset, yOffset);
  }

  /**
   * Spawns a block using MarioMod's block spawn system
   * Position is relative to Mario's current position
   *
   * Port from HoellCC SmwOperations.cs:532-549
   *
   * @param {number} blockId - Block/tile ID to spawn
   * @param {number} xOffset - Signed X offset from Mario (-128 to +127 pixels)
   * @param {number} yOffset - Signed Y offset from Mario (-128 to +127 pixels)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async spawnBlockViaMarioMod(blockId, xOffset = 0, yOffset = 0) {
    if (!this.client.deviceURI) {
      return { success: false, error: 'No device connected' };
    }

    try {
      const { xPos, xNeg, yPos, yNeg } = this.convertSignedOffsets(xOffset, yOffset);

      // Write Map16 block ID (16-bit, little-endian)
      // CRITICAL: Map16 IDs are 16-bit values, must write 2 bytes!
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_ID, Buffer.from([
        blockId & 0xFF,        // Low byte
        (blockId >> 8) & 0xFF  // High byte
      ]));

      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_X_OFFSET_POS, Buffer.from([xPos]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_X_OFFSET_NEG, Buffer.from([xNeg]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_Y_OFFSET_POS, Buffer.from([yPos]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_Y_OFFSET_NEG, Buffer.from([yNeg]));

      // Trigger the block spawn
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_FLAG, Buffer.from([0x01]));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Arms a block to spawn when Mario next jumps (Kaizo trap) - RAW OFFSETS
   * Block spawns when Mario has upward momentum
   *
   * Port from HoellCC SmwOperations.cs:509-529
   *
   * @param {number} blockId - Map16 block ID (16-bit)
   * @param {number} xOffsetPos - Positive X offset (0-255)
   * @param {number} xOffsetNeg - Negative X offset (0-255)
   * @param {number} yOffsetPos - Positive Y offset (0-255)
   * @param {number} yOffsetNeg - Negative Y offset (0-255)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async spawnBlockOnJumpRaw(blockId, xOffsetPos = 0, xOffsetNeg = 0, yOffsetPos = 0, yOffsetNeg = 0) {
    if (!this.client.deviceURI) {
      return { success: false, error: 'No device connected' };
    }

    try {
      // Clear immediate spawn flag first to prevent race condition
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_FLAG, Buffer.from([0x00]));

      // Write Map16 block ID (16-bit, little-endian)
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_ID, Buffer.from([
        blockId & 0xFF,        // Low byte
        (blockId >> 8) & 0xFF  // High byte
      ]));

      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_X_OFFSET_POS, Buffer.from([xOffsetPos & 0xFF]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_X_OFFSET_NEG, Buffer.from([xOffsetNeg & 0xFF]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_Y_OFFSET_POS, Buffer.from([yOffsetPos & 0xFF]));
      await this.client.writeMemory(this.MARIOMOD_SPAWN_BLOCK_Y_OFFSET_NEG, Buffer.from([yOffsetNeg & 0xFF]));

      // Arm the on-jump trigger (waits for Mario to jump)
      await this.client.writeMemory(this.MARIOMOD_BLOCK_ON_JUMP_FLAG, Buffer.from([0x01]));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Arms a block to spawn when Mario next jumps - convenience wrapper with signed offsets
   *
   * @param {number} blockId - Map16 block ID (16-bit)
   * @param {number} xOffset - Signed X offset (-128 to +127 pixels)
   * @param {number} yOffset - Signed Y offset (-128 to +127 pixels)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async spawnBlockOnJumpViaMarioMod(blockId, xOffset = 0, yOffset = 0) {
    const { xPos, xNeg, yPos, yNeg } = this.convertSignedOffsets(xOffset, yOffset);
    return await this.spawnBlockOnJumpRaw(blockId, xPos, xNeg, yPos, yNeg);
  }

  /**
   * Checks if MarioMod patch is present by testing spawn flag address
   *
   * @returns {Promise<boolean>} True if MarioMod appears to be installed
   */
  async checkMarioModPresent() {
    if (!this.client.deviceURI) {
      return false;
    }

    try {
      // Try reading the spawn flag address
      const result = await this.client.readMemory(this.MARIOMOD_SPAWN_SPRITE_FLAG, 1);
      // If we can read it without error, assume MarioMod is present
      return result !== null && result !== undefined;
    } catch (error) {
      return false;
    }
  }
}

module.exports = MarioModSpawner;
