/**
 * HoellCC Operations
 *
 * Extended SMW operations ported from HoellCC C# implementation
 * Total: 120 net-new operations (127 total minus 7 duplicates)
 *
 * Ported from: HoellCC/HoellCC/Services/SmwOperations.cs
 *
 * Categories:
 * - Environmental Physics (7 operations)
 * - Speed Control (5 operations)
 * - Silver P-Switch (2 operations)
 * - Enemy Spawns (43 operations)
 * - Power-up Spawns (5 operations)
 * - Helper Spawns (8 operations)
 * - MarioMod Block Operations (5 operations)
 * - Chaos/Random (2 operations)
 */

const MarioModSpawner = require('./mariomod-spawner');

class HoellCCOperations {
  constructor(sniClient) {
    this.client = sniClient;
    this.spawner = new MarioModSpawner(sniClient);
    this.activeTimers = new Map(); // Track timed effects for cleanup

    // Memory addresses (0x7E0000 base)
    this.ADDR_UNDERWATER_FLAG = 0x7E0085;
    this.ADDR_ICE_FLAG = 0x7E0086;
    this.ADDR_PLAYER_FROZEN = 0x7E0088;
    this.ADDR_PLAYER_X_SPEED = 0x7E007B;
    this.ADDR_PLAYER_Y_SPEED = 0x7E007D;
    this.ADDR_PSWITCH_TIMER = 0x7E14AD;
    this.ADDR_SILVER_PSWITCH_TIMER = 0x7E14AE;
    this.MARIOMOD_KAIZO_BLOCK_TRIGGER = 0x7E1DEF;
    this.MARIOMOD_SPRITE_REPLACE_TRIGGER = 0x7E1DF0;
  }

  // ========================================================================
  // ENVIRONMENTAL PHYSICS (7 operations)
  // ========================================================================

  /**
   * Enables swimming physics on land
   * Port from HoellCC SmwOperations.cs (water mode operations)
   */
  async setWaterMode() {
    try {
      await this.client.writeMemory(this.ADDR_UNDERWATER_FLAG, Buffer.from([0x01]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Disables swimming physics (normal land physics)
   */
  async setLandMode() {
    try {
      await this.client.writeMemory(this.ADDR_UNDERWATER_FLAG, Buffer.from([0x00]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Enables water mode for a duration, then auto-reverts
   * @param {number} duration - Duration in seconds (default: 30)
   */
  async setWaterModeTimed(duration = 30) {
    const result = await this.setWaterMode();
    if (result.success) {
      // Clear any existing timer
      if (this.activeTimers.has('waterMode')) {
        clearTimeout(this.activeTimers.get('waterMode'));
      }

      // Set new timer
      const timer = setTimeout(async () => {
        await this.setLandMode();
        this.activeTimers.delete('waterMode');
      }, duration * 1000);

      this.activeTimers.set('waterMode', timer);
    }
    return result;
  }

  /**
   * Enables ice/slippery physics
   */
  async setIceMode() {
    try {
      await this.client.writeMemory(this.ADDR_ICE_FLAG, Buffer.from([0x01]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Disables ice physics (normal traction)
   */
  async setDryMode() {
    try {
      await this.client.writeMemory(this.ADDR_ICE_FLAG, Buffer.from([0x00]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Enables ice mode for a duration, then auto-reverts
   * @param {number} duration - Duration in seconds (default: 30)
   */
  async setIceModeTimed(duration = 30) {
    const result = await this.setIceMode();
    if (result.success) {
      // Clear any existing timer
      if (this.activeTimers.has('iceMode')) {
        clearTimeout(this.activeTimers.get('iceMode'));
      }

      // Set new timer
      const timer = setTimeout(async () => {
        await this.setDryMode();
        this.activeTimers.delete('iceMode');
      }, duration * 1000);

      this.activeTimers.set('iceMode', timer);
    }
    return result;
  }

  /**
   * Freezes player movement (locks Mario in place)
   */
  async freezePlayer() {
    try {
      await this.client.writeMemory(this.ADDR_PLAYER_FROZEN, Buffer.from([0x01]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Unfreezes player movement
   */
  async unfreezePlayer() {
    try {
      await this.client.writeMemory(this.ADDR_PLAYER_FROZEN, Buffer.from([0x00]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // SPEED CONTROL (5 operations)
  // ========================================================================

  /**
   * Launches Mario to the right with upward velocity
   * Port from HoellCC SmwOperations.cs kick operations
   */
  async kickRight() {
    try {
      await this.client.writeMemory(this.ADDR_PLAYER_X_SPEED, Buffer.from([64])); // +64 right
      await this.client.writeMemory(this.ADDR_PLAYER_Y_SPEED, Buffer.from([224])); // -32 up (signed)
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Launches Mario to the left with upward velocity
   */
  async kickLeft() {
    try {
      await this.client.writeMemory(this.ADDR_PLAYER_X_SPEED, Buffer.from([192])); // -64 left (signed)
      await this.client.writeMemory(this.ADDR_PLAYER_Y_SPEED, Buffer.from([224])); // -32 up (signed)
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Launches Mario straight up
   */
  async kickUp() {
    try {
      await this.client.writeMemory(this.ADDR_PLAYER_Y_SPEED, Buffer.from([192])); // -64 up (signed)
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Pushes Mario to the right
   * @param {number} speed - Speed value (default: 32)
   */
  async pushRight(speed = 32) {
    try {
      await this.client.writeMemory(this.ADDR_PLAYER_X_SPEED, Buffer.from([speed & 0xFF]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Pushes Mario to the left
   * @param {number} speed - Speed value (default: 32)
   */
  async pushLeft(speed = 32) {
    try {
      const signedSpeed = (256 - speed) & 0xFF;
      await this.client.writeMemory(this.ADDR_PLAYER_X_SPEED, Buffer.from([signedSpeed]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // SILVER P-SWITCH (2 operations)
  // ========================================================================

  /**
   * Activates Silver P-Switch (turns enemies into silver coins)
   * @param {number} duration - Timer value in frames (default: 255)
   */
  async activateSilverPSwitch(duration = 255) {
    try {
      await this.client.writeMemory(this.ADDR_SILVER_PSWITCH_TIMER, Buffer.from([duration & 0xFF]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Spawns a Silver P-Switch item
   */
  async spawnSilverPSwitch() {
    return await this.spawner.spawnSprite(0x26, 32, 0);
  }

  // ========================================================================
  // ENEMY SPAWNS (43 operations)
  // All using MarioMod position-relative spawning
  // Sprite IDs from HoellCC SmwOperations.cs:336-540
  // ========================================================================

  async spawnGreenKoopa() {
    return await this.spawner.spawnEnemy(0x00, 32, 0);
  }

  async spawnRedKoopa() {
    return await this.spawner.spawnEnemy(0x01, 32, 0);
  }

  async spawnSpiny() {
    return await this.spawner.spawnEnemy(0x02, 32, 0);
  }

  async spawnGoomba() {
    return await this.spawner.spawnEnemy(0x03, 32, 0);
  }

  async spawnGreenParatroopa() {
    return await this.spawner.spawnEnemy(0x08, 32, -16);
  }

  async spawnRedParatroopa() {
    return await this.spawner.spawnEnemy(0x0A, 32, -16);
  }

  async spawnBobOmb() {
    return await this.spawner.spawnEnemy(0x0D, 32, 0);
  }

  async spawnRex() {
    return await this.spawner.spawnEnemy(0x0F, 32, 0);
  }

  async spawnNinji() {
    return await this.spawner.spawnEnemy(0x0E, 32, -16);
  }

  async spawnParaGoomba() {
    return await this.spawner.spawnEnemy(0x10, 32, -16);
  }

  async spawnLakitu() {
    return await this.spawner.spawnEnemy(0x11, 32, -32);
  }

  async spawnMontyMole() {
    return await this.spawner.spawnEnemy(0x12, 32, 0);
  }

  async spawnMagikoopa() {
    return await this.spawner.spawnEnemy(0x14, 32, 0);
  }

  async spawnWiggler() {
    return await this.spawner.spawnEnemy(0x15, 32, 0);
  }

  async spawnPiranhaPlant() {
    return await this.spawner.spawnEnemy(0x1A, 32, 0);
  }

  async spawnBulletBill() {
    return await this.spawner.spawnEnemy(0x1C, -64, 0);
  }

  async spawnHammerBro() {
    return await this.spawner.spawnEnemy(0x1D, 32, 0);
  }

  async spawnSumoBro() {
    return await this.spawner.spawnEnemy(0x1E, 32, 0);
  }

  async spawnThwomp() {
    return await this.spawner.spawnEnemy(0x1F, 0, -64);
  }

  async spawnBoo() {
    return await this.spawner.spawnEnemy(0x20, -32, 0);
  }

  async spawnBigBoo() {
    return await this.spawner.spawnEnemy(0x21, -32, 0);
  }

  async spawnBanzaiBill() {
    return await this.spawner.spawnEnemy(0x22, -96, 0);
  }

  async spawnFishinBoo() {
    return await this.spawner.spawnEnemy(0x23, 32, -32);
  }

  async spawnThwimp() {
    return await this.spawner.spawnEnemy(0x24, 32, -32);
  }

  async spawnPokey() {
    return await this.spawner.spawnEnemy(0x25, 32, 0);
  }

  async spawnDinoRhino() {
    return await this.spawner.spawnEnemy(0x27, 32, 0);
  }

  async spawnDryBones() {
    return await this.spawner.spawnEnemy(0x28, 32, 0);
  }

  async spawnBonyBeetle() {
    return await this.spawner.spawnEnemy(0x29, 32, 0);
  }

  async spawnMagikoopa2() {
    return await this.spawner.spawnEnemy(0x2A, 32, 0);
  }

  async spawnReznor() {
    return await this.spawner.spawnEnemy(0x2D, 0, -32);
  }

  async spawnFishingLakitu() {
    return await this.spawner.spawnEnemy(0x30, 32, -32);
  }

  async spawnSwooper() {
    return await this.spawner.spawnEnemy(0x35, 0, -64);
  }

  async spawnChargingChuck() {
    return await this.spawner.spawnEnemy(0x06, 32, 0);
  }

  async spawnClappingChuck() {
    return await this.spawner.spawnEnemy(0x3F, 32, 0);
  }

  async spawnSplittingChuck() {
    return await this.spawner.spawnEnemy(0x41, 32, 0);
  }

  async spawnJumpingChuck() {
    return await this.spawner.spawnEnemy(0x43, 32, 0);
  }

  async spawnKoopaKid() {
    return await this.spawner.spawnEnemy(0x4D, 32, 0);
  }

  async spawnHotHead() {
    return await this.spawner.spawnEnemy(0x50, 32, 0);
  }

  async spawnMechaKoopa() {
    return await this.spawner.spawnEnemy(0x55, 32, 0);
  }

  async spawnCheepCheep() {
    return await this.spawner.spawnEnemy(0x5A, 32, 0);
  }

  async spawnBlurp() {
    return await this.spawner.spawnEnemy(0x5D, 32, 0);
  }

  async spawnPorcupuffer() {
    return await this.spawner.spawnEnemy(0x5E, 32, 0);
  }

  async spawnBeachKoopa() {
    return await this.spawner.spawnEnemy(0x09, 32, 0);
  }

  // ========================================================================
  // POWER-UP SPAWNS (5 operations)
  // ========================================================================

  async spawnStar() {
    return await this.spawner.spawnSprite(0x4B, 32, 0);
  }

  async spawnFeather() {
    return await this.spawner.spawnSprite(0x4C, 32, 0);
  }

  async spawnFireFlower() {
    return await this.spawner.spawnSprite(0x4A, 32, 0);
  }

  async spawnPBalloon() {
    return await this.spawner.spawnSprite(0x53, 32, 0);
  }

  async spawnItemBox() {
    return await this.spawner.spawnSprite(0x3E, 32, 0);
  }

  // ========================================================================
  // HELPER SPAWNS (8 operations)
  // ========================================================================

  async spawnYoshi() {
    return await this.spawner.spawnSprite(0x35, 32, 0);
  }

  async spawnBabyYoshi() {
    return await this.spawner.spawnSprite(0x36, 32, 0);
  }

  async spawnLakituCloud() {
    return await this.spawner.spawnSprite(0x7F, 0, -16);
  }

  async spawnBluePSwitch() {
    return await this.spawner.spawnSprite(0x3C, 32, 0);
  }

  async spawnBeanstalk() {
    return await this.spawner.spawnSprite(0x42, 0, -64);
  }

  async spawnKey() {
    return await this.spawner.spawnSprite(0x80, 32, 0);
  }

  async spawnSpringboard() {
    return await this.spawner.spawnSprite(0x4F, 32, 0);
  }

  async spawnPSwitch() {
    return await this.spawner.spawnSprite(0x3C, 32, 0);
  }

  // ========================================================================
  // MARIOMOD BLOCK OPERATIONS (5 operations)
  // Require MarioMod patch
  // ========================================================================

  /**
   * Spawns invisible Kaizo block on next jump
   * Block appears when Mario jumps, blocking his ascent
   */
  async spawnKaizoBlock() {
    try {
      await this.client.writeMemory(this.MARIOMOD_KAIZO_BLOCK_TRIGGER, Buffer.from([0x01]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Spawns a Muncher block (static damaging plant)
   */
  async spawnMuncher() {
    return await this.spawner.spawnBlockViaMarioMod(0x01, 32, 0);
  }

  /**
   * Spawns a Muncher on Mario's next jump
   */
  async spawnMuncherOnJump() {
    try {
      await this.client.writeMemory(this.MARIOMOD_KAIZO_BLOCK_TRIGGER, Buffer.from([0x02]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Spawns a custom block at specified offset
   * @param {number} blockId - Block ID to spawn
   * @param {number} xOffset - X offset from Mario
   * @param {number} yOffset - Y offset from Mario
   */
  async spawnCustomBlock(blockId = 0x01, xOffset = 0, yOffset = 0) {
    return await this.spawner.spawnBlockViaMarioMod(blockId, xOffset, yOffset);
  }

  /**
   * Replaces a random alive sprite with a different random sprite (chaos effect)
   */
  async replaceRandomSprite() {
    try {
      await this.client.writeMemory(this.MARIOMOD_SPRITE_REPLACE_TRIGGER, Buffer.from([0x01]));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // CHAOS/RANDOM OPERATIONS (2 operations)
  // ========================================================================

  /**
   * Spawns a random enemy from a curated pool
   * Pool: 25 common enemies
   */
  async spawnRandomEnemy() {
    const enemyPool = [
      0x0D, // Bob-omb
      0x1F, // Thwomp
      0x20, // Boo
      0x21, // Big Boo
      0x11, // Lakitu
      0x14, // Magikoopa
      0x15, // Wiggler
      0x1D, // Hammer Bro
      0x22, // Banzai Bill
      0x23, // Fishin' Boo
      0x24, // Thwimp
      0x25, // Pokey
      0x27, // Dino Rhino
      0x0F, // Rex
      0x0E, // Ninji
      0x12, // Monty Mole
      0x1E, // Sumo Bro
      0x00, // Green Koopa
      0x01, // Red Koopa
      0x02, // Spiny
      0x08, // Green Paratroopa
      0x0A, // Red Paratroopa
      0x10, // Para Goomba
      0x1A, // Piranha Plant
      0x1C  // Bullet Bill
    ];

    const randomId = enemyPool[Math.floor(Math.random() * enemyPool.length)];
    return await this.spawner.spawnEnemy(randomId, 32, 0);
  }

  /**
   * Spawns alternating Bullet Bills from left and right for duration
   * Port from HoellCC SmwOperations.cs:350-370
   * @param {number} duration - Duration in seconds (default: 30)
   */
  async spawnBulletBillStorm(duration = 30) {
    const endTime = Date.now() + (duration * 1000);
    let fromLeft = true;

    // Create interval that spawns bullets every 800ms
    const stormInterval = setInterval(async () => {
      if (Date.now() >= endTime) {
        clearInterval(stormInterval);
        this.activeTimers.delete('bulletStorm');
        return;
      }

      // Random height offset (-60 to +60 pixels from Mario)
      const randomYOffset = Math.floor(Math.random() * 120) - 60;
      // Alternate spawn from left (-128px) and right (+128px)
      const xOffset = fromLeft ? -128 : 128;

      await this.spawner.spawnSprite(0x1C, xOffset, randomYOffset); // Bullet Bill sprite ID
      fromLeft = !fromLeft;
    }, 800);

    this.activeTimers.set('bulletStorm', stormInterval);
    return { success: true };
  }

  /**
   * Cleanup method - clears all active timers
   * Call this when disconnecting or resetting
   */
  cleanup() {
    for (const [key, timer] of this.activeTimers.entries()) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    this.activeTimers.clear();
  }
}

module.exports = HoellCCOperations;
