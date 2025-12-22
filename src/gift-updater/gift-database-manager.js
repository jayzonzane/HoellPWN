/**
 * GiftDatabaseManager - Manages gift database versions, backups, and archival
 * Handles loading, saving, backup, rollback, and comparison of gift databases
 */

const fs = require('fs').promises;
const path = require('path');

class GiftDatabaseManager {
  constructor(userDataPath) {
    this.userDataPath = userDataPath;

    // File paths
    this.activeGiftsPath = path.join(userDataPath, 'active-gifts.json');
    this.archivedGiftsPath = path.join(userDataPath, 'archived-gifts.json');
    this.versionsPath = path.join(userDataPath, 'gift-database-versions.json');
    this.backupsDir = path.join(userDataPath, 'gift-backups');

    // Configuration
    this.maxBackups = 5; // Keep last 5 backups
  }

  /**
   * Initialize database files if they don't exist
   * @param {Object} initialGifts - Initial gift data from tiktok-gifts.js
   */
  async initialize(initialGifts) {
    try {
      console.log('🔧 Initializing gift database...');

      // Create backups directory
      try {
        await fs.mkdir(this.backupsDir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }

      // Initialize active-gifts.json if it doesn't exist
      try {
        await fs.access(this.activeGiftsPath);
        console.log('✅ active-gifts.json already exists');
      } catch {
        const activeData = {
          version: '1.1.0',
          lastUpdated: new Date().toISOString(),
          source: 'tiktok-gifts.js (initial)',
          gifts: initialGifts
        };
        await fs.writeFile(this.activeGiftsPath, JSON.stringify(activeData, null, 2));
        console.log('✅ Created active-gifts.json');
      }

      // Initialize archived-gifts.json if it doesn't exist
      try {
        await fs.access(this.archivedGiftsPath);
        console.log('✅ archived-gifts.json already exists');
      } catch {
        const archivedData = { gifts: [] };
        await fs.writeFile(this.archivedGiftsPath, JSON.stringify(archivedData, null, 2));
        console.log('✅ Created archived-gifts.json');
      }

      // Initialize versions.json if it doesn't exist
      try {
        await fs.access(this.versionsPath);
        console.log('✅ gift-database-versions.json already exists');
      } catch {
        const versionsData = {
          current: new Date().toISOString(),
          backups: []
        };
        await fs.writeFile(this.versionsPath, JSON.stringify(versionsData, null, 2));
        console.log('✅ Created gift-database-versions.json');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load active gifts database
   */
  async loadActiveGifts() {
    try {
      const data = await fs.readFile(this.activeGiftsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load active gifts:', error);
      return null;
    }
  }

  /**
   * Load archived gifts database
   */
  async loadArchivedGifts() {
    try {
      const data = await fs.readFile(this.archivedGiftsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load archived gifts:', error);
      return { gifts: [] };
    }
  }

  /**
   * Load version history
   */
  async loadVersions() {
    try {
      const data = await fs.readFile(this.versionsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load versions:', error);
      return { current: null, backups: [] };
    }
  }

  /**
   * Save active gifts database
   */
  async saveActiveGifts(data) {
    try {
      await fs.writeFile(this.activeGiftsPath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Failed to save active gifts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save archived gifts database
   */
  async saveArchivedGifts(data) {
    try {
      await fs.writeFile(this.archivedGiftsPath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Failed to save archived gifts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save version history
   */
  async saveVersions(data) {
    try {
      await fs.writeFile(this.versionsPath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Failed to save versions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create backup before update
   * @returns {Promise<Object>} Backup metadata
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupsDir, `backup-${timestamp}.json`);

      // Load current data
      const activeGifts = await this.loadActiveGifts();
      const archivedGifts = await this.loadArchivedGifts();

      const backup = {
        timestamp: new Date().toISOString(),
        activeGifts,
        archivedGifts
      };

      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));

      console.log(`💾 Created backup: ${backupPath}`);

      // Clean up old backups (keep only last N)
      await this._cleanupOldBackups();

      return {
        success: true,
        timestamp: backup.timestamp,
        backupPath
      };

    } catch (error) {
      console.error('Failed to create backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup old backups, keeping only the most recent ones
   * @private
   */
  async _cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupsDir);
      const backupFiles = files
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(this.backupsDir, f)
        }))
        .sort((a, b) => b.name.localeCompare(a.name)); // Sort newest first

      // Delete excess backups
      if (backupFiles.length > this.maxBackups) {
        const toDelete = backupFiles.slice(this.maxBackups);
        for (const file of toDelete) {
          await fs.unlink(file.path);
          console.log(`🗑️  Deleted old backup: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Rollback to a previous version
   * @param {string} backupPath - Path to backup file
   */
  async rollback(backupPath) {
    try {
      console.log(`⏪ Rolling back to ${backupPath}...`);

      const backupData = await fs.readFile(backupPath, 'utf8');
      const backup = JSON.parse(backupData);

      await this.saveActiveGifts(backup.activeGifts);
      await this.saveArchivedGifts(backup.archivedGifts);

      console.log('✅ Rollback completed successfully');

      return {
        success: true,
        restoredAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to rollback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Compare two gift databases and detect changes
   * @param {Object} oldGifts - Current active gifts
   * @param {Object} newGifts - New gifts from API
   * @returns {Object} Changes {added, removed, modified, unchanged}
   */
  compareGifts(oldGifts, newGifts) {
    const changes = {
      added: [],      // New gifts in API
      removed: [],    // Gifts in old DB but not in API
      modified: [],   // Gifts with coin value changes
      unchanged: []   // Gifts that haven't changed
    };

    // Create lookup maps for efficient comparison
    const oldMap = this._createGiftMap(oldGifts);
    const newMap = this._createGiftMap(newGifts);

    // Find removed and modified gifts
    for (const [giftKey, oldCoins] of oldMap.entries()) {
      if (!newMap.has(giftKey)) {
        // Gift removed
        changes.removed.push({ name: giftKey, coins: oldCoins });
      } else {
        const newCoins = newMap.get(giftKey);
        if (oldCoins !== newCoins) {
          // Coin value changed
          changes.modified.push({
            name: giftKey,
            oldCoins,
            newCoins
          });
        } else {
          // Unchanged
          changes.unchanged.push({ name: giftKey, coins: oldCoins });
        }
      }
    }

    // Find added gifts
    for (const [giftKey, newCoins] of newMap.entries()) {
      if (!oldMap.has(giftKey)) {
        changes.added.push({ name: giftKey, coins: newCoins });
      }
    }

    console.log(`📊 Comparison: ${changes.added.length} added, ${changes.removed.length} removed, ${changes.modified.length} modified, ${changes.unchanged.length} unchanged`);

    return changes;
  }

  /**
   * Create a map of gift name -> coin value for comparison
   * @private
   */
  _createGiftMap(gifts) {
    const map = new Map();

    for (const [coins, giftNames] of Object.entries(gifts)) {
      const coinValue = parseInt(coins);
      giftNames.forEach(name => {
        map.set(name, coinValue);
      });
    }

    return map;
  }

  /**
   * Archive removed gifts
   * @param {Array} removedGifts - Gifts to archive
   * @param {string} reason - Reason for archival
   */
  async archiveGifts(removedGifts, reason = 'removed_from_tiktok') {
    try {
      const archivedData = await this.loadArchivedGifts();
      const now = new Date().toISOString();

      for (const gift of removedGifts) {
        // Check if already archived
        const existingIndex = archivedData.gifts.findIndex(
          g => g.name === gift.name && g.coins === gift.coins
        );

        if (existingIndex === -1) {
          // Add to archive
          archivedData.gifts.push({
            name: gift.name,
            coins: gift.coins,
            archivedDate: now,
            reason,
            imageUrl: `./gift-images/${this._sanitizeForFilename(gift.name)}_${gift.coins}.webp`,
            lastSeen: now
          });
          console.log(`📦 Archived: ${gift.name} (${gift.coins} coins)`);
        } else {
          // Update existing entry
          archivedData.gifts[existingIndex].lastSeen = now;
          console.log(`📦 Updated archived entry: ${gift.name}`);
        }
      }

      await this.saveArchivedGifts(archivedData);

      return {
        success: true,
        archivedCount: removedGifts.length
      };

    } catch (error) {
      console.error('Failed to archive gifts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore archived gift to active database
   * @param {string} giftName - Gift name
   * @param {number} coins - Coin value
   */
  async restoreArchivedGift(giftName, coins) {
    try {
      const archivedData = await this.loadArchivedGifts();
      const activeData = await this.loadActiveGifts();

      // Find in archive
      const archiveIndex = archivedData.gifts.findIndex(
        g => g.name === giftName && g.coins === coins
      );

      if (archiveIndex === -1) {
        return { success: false, error: 'Gift not found in archive' };
      }

      // Add to active gifts
      if (!activeData.gifts[coins]) {
        activeData.gifts[coins] = [];
      }
      if (!activeData.gifts[coins].includes(giftName)) {
        activeData.gifts[coins].push(giftName);
        activeData.gifts[coins].sort();
      }

      // Remove from archive
      archivedData.gifts.splice(archiveIndex, 1);

      await this.saveActiveGifts(activeData);
      await this.saveArchivedGifts(archivedData);

      console.log(`↩️  Restored: ${giftName} (${coins} coins)`);

      return { success: true };

    } catch (error) {
      console.error('Failed to restore gift:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete archived gift permanently
   * @param {string} giftName - Gift name
   * @param {number} coins - Coin value
   */
  async deleteArchivedGift(giftName, coins) {
    try {
      const archivedData = await this.loadArchivedGifts();

      const archiveIndex = archivedData.gifts.findIndex(
        g => g.name === giftName && g.coins === coins
      );

      if (archiveIndex === -1) {
        return { success: false, error: 'Gift not found in archive' };
      }

      archivedData.gifts.splice(archiveIndex, 1);
      await this.saveArchivedGifts(archivedData);

      console.log(`🗑️  Deleted from archive: ${giftName}`);

      return { success: true };

    } catch (error) {
      console.error('Failed to delete archived gift:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sanitize gift name for filename
   * @private
   */
  _sanitizeForFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /**
   * Update version history after successful update
   * @param {Object} changes - Changes from comparison
   * @param {string} backupPath - Path to backup created before update
   */
  async updateVersionHistory(changes, backupPath) {
    try {
      const versions = await this.loadVersions();
      const now = new Date().toISOString();

      const activeGifts = await this.loadActiveGifts();
      const totalGifts = Object.values(activeGifts.gifts).reduce((sum, arr) => sum + arr.length, 0);

      versions.current = now;
      versions.backups.unshift({
        timestamp: now,
        giftCount: totalGifts,
        changes: {
          added: changes.added.length,
          removed: changes.removed.length,
          modified: changes.modified.length
        },
        backupPath
      });

      // Keep only recent backups in version history
      versions.backups = versions.backups.slice(0, this.maxBackups);

      await this.saveVersions(versions);

      return { success: true };

    } catch (error) {
      console.error('Failed to update version history:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download images for gifts
   * @param {Array} gifts - Array of {name, coins, imageUrl}
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Object>} Download results
   */
  async downloadGiftImages(gifts, progressCallback = null) {
    try {
      const https = require('https');
      const fs = require('fs');
      const giftsWithImages = gifts.filter(g => g.imageUrl);

      if (giftsWithImages.length === 0) {
        return {
          success: true,
          downloaded: [],
          failed: [],
          message: 'No images to download'
        };
      }

      // Create gift-images directory in userData
      const imagesDir = path.join(this.userDataPath, 'gift-images');
      await fs.promises.mkdir(imagesDir, { recursive: true });

      const downloaded = [];
      const failed = [];
      let count = 0;

      for (const gift of giftsWithImages) {
        count++;
        const sanitized = gift.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${sanitized}_${gift.coins}.webp`;
        const filepath = path.join(imagesDir, filename);

        if (progressCallback) {
          progressCallback({
            stage: 'downloading_images',
            message: `Downloading ${gift.name}...`,
            current: count,
            total: giftsWithImages.length
          });
        }

        try {
          await this._downloadImage(gift.imageUrl, filepath);
          downloaded.push({
            name: gift.name,
            coins: gift.coins,
            filename,
            localPath: filepath
          });
          console.log(`✓ Downloaded: ${filename}`);
        } catch (error) {
          failed.push({
            name: gift.name,
            coins: gift.coins,
            error: error.message
          });
          console.error(`✗ Failed to download ${gift.name}:`, error.message);
        }
      }

      return {
        success: true,
        downloaded,
        failed,
        imagesDir
      };

    } catch (error) {
      console.error('Failed to download images:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a single image file
   * @private
   */
  _downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const fs = require('fs');
      const file = fs.createWriteStream(filepath);

      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });

      }).on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
  }
}

module.exports = GiftDatabaseManager;
