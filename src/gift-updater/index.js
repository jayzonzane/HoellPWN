/**
 * Gift Update Orchestrator - Main coordinator for gift database updates
 * Handles the complete flow: fetch → compare → backup → archive → update → images
 */

const GiftAPIClient = require('./gift-api-client');
const GiftDatabaseManager = require('./gift-database-manager');

class GiftUpdater {
  constructor(userDataPath, config = {}) {
    this.apiClient = new GiftAPIClient(config.api);
    this.dbManager = new GiftDatabaseManager(userDataPath);
    this.progressCallback = config.progressCallback || (() => {});
  }

  /**
   * Initialize gift database on first run
   * @param {Object} initialGifts - Initial gift data from tiktok-gifts.js
   */
  async initialize(initialGifts) {
    return await this.dbManager.initialize(initialGifts);
  }

  /**
   * Perform complete gift database update
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateGiftDatabase(options = {}) {
    try {
      console.log('🚀 Starting gift database update...');
      this.progressCallback({ stage: 'starting', message: 'Initializing update...' });

      // Phase 1: Load current database
      this.progressCallback({ stage: 'loading', message: 'Loading current database...' });
      const activeData = await this.dbManager.loadActiveGifts();
      if (!activeData) {
        throw new Error('Failed to load active gifts database');
      }

      // Phase 2: Fetch new data from API
      this.progressCallback({ stage: 'fetching', message: 'Fetching gifts from streamtoearn.io...' });
      const apiResult = await this.apiClient.fetchGifts(options.region);

      if (!apiResult.success) {
        return {
          success: false,
          error: apiResult.error,
          errorType: apiResult.errorType,
          userMessage: this.apiClient.getErrorMessage(apiResult.errorType)
        };
      }

      // Phase 3: Compare databases
      this.progressCallback({ stage: 'comparing', message: 'Comparing gift databases...' });
      const changes = this.dbManager.compareGifts(activeData.gifts, apiResult.gifts);

      // Check if update is needed
      if (changes.added.length === 0 && changes.removed.length === 0 && changes.modified.length === 0) {
        console.log('✅ No changes detected - database is up to date');
        return {
          success: true,
          noChanges: true,
          message: 'Gift database is already up to date'
        };
      }

      // Phase 4: Check for large updates (require confirmation)
      const totalChanges = changes.added.length + changes.removed.length + changes.modified.length;
      const totalGifts = Object.values(activeData.gifts).reduce((sum, arr) => sum + arr.length, 0);
      const changePercentage = (totalChanges / totalGifts) * 100;

      if (changePercentage > 50 && !options.confirmLargeUpdate) {
        return {
          success: false,
          requiresConfirmation: true,
          changePercentage: changePercentage.toFixed(1),
          changes,
          message: `This update will modify ${changePercentage.toFixed(1)}% of the database (${totalChanges} changes). Please confirm.`
        };
      }

      // Phase 5: Create backup
      this.progressCallback({ stage: 'backup', message: 'Creating backup...' });
      const backupResult = await this.dbManager.createBackup();
      if (!backupResult.success) {
        throw new Error('Failed to create backup: ' + backupResult.error);
      }

      // Phase 6: Archive removed gifts
      this.progressCallback({ stage: 'archiving', message: 'Archiving removed gifts...' });

      const giftsToArchive = [
        ...changes.removed,
        ...changes.modified.map(m => ({ name: m.name, coins: m.oldCoins }))
      ];

      if (giftsToArchive.length > 0) {
        await this.dbManager.archiveGifts(giftsToArchive);
      }

      // Phase 7: Update active database
      this.progressCallback({ stage: 'updating', message: 'Updating gift database...' });
      const newActiveData = {
        version: '1.1.0',
        lastUpdated: new Date().toISOString(),
        source: 'streamtoearn.io',
        gifts: apiResult.gifts
      };
      await this.dbManager.saveActiveGifts(newActiveData);

      // Phase 8: Update version history
      await this.dbManager.updateVersionHistory(changes, backupResult.backupPath);

      console.log('✅ Gift database update completed successfully');

      return {
        success: true,
        changes: {
          added: changes.added.length,
          removed: changes.removed.length,
          modified: changes.modified.length,
          total: totalChanges
        },
        details: changes,
        images: apiResult.images,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Update failed:', error);
      this.progressCallback({ stage: 'error', message: error.message });

      return {
        success: false,
        error: error.message,
        stage: 'unknown'
      };
    }
  }

  /**
   * Get version history
   */
  async getVersionHistory() {
    return await this.dbManager.loadVersions();
  }

  /**
   * Rollback to previous version
   * @param {string} backupPath - Path to backup file
   */
  async rollback(backupPath) {
    this.progressCallback({ stage: 'rollback', message: 'Rolling back to previous version...' });
    const result = await this.dbManager.rollback(backupPath);

    if (result.success) {
      this.progressCallback({ stage: 'complete', message: 'Rollback completed' });
    } else {
      this.progressCallback({ stage: 'error', message: 'Rollback failed' });
    }

    return result;
  }

  /**
   * Get active gifts
   */
  async getActiveGifts() {
    return await this.dbManager.loadActiveGifts();
  }

  /**
   * Get archived gifts
   */
  async getArchivedGifts() {
    return await this.dbManager.loadArchivedGifts();
  }

  /**
   * Restore archived gift
   */
  async restoreArchivedGift(giftName, coins) {
    return await this.dbManager.restoreArchivedGift(giftName, coins);
  }

  /**
   * Delete archived gift
   */
  async deleteArchivedGift(giftName, coins) {
    return await this.dbManager.deleteArchivedGift(giftName, coins);
  }

  /**
   * Check if gift mappings reference archived gifts
   * @param {Object} giftMappings - Current gift mappings
   * @returns {Promise<Array>} Warnings for archived gift mappings
   */
  async checkMappingsForArchivedGifts(giftMappings) {
    const archivedData = await this.dbManager.loadArchivedGifts();
    const warnings = [];

    // Create lookup map for archived gifts
    const archivedMap = new Map();
    archivedData.gifts.forEach(gift => {
      const key = `${gift.name}_${gift.coins}`;
      archivedMap.set(key, gift);
    });

    // Check each mapping
    for (const [giftName, mapping] of Object.entries(giftMappings)) {
      // Extract coin value from gift name or mapping
      // This is a simplified check - actual implementation may need more sophisticated parsing
      const match = giftName.match(/\((\d+)\s*coins?\)/i);
      if (match) {
        const coins = parseInt(match[1]);
        const baseName = giftName.replace(/\s*\(\d+\s*coins?\)/i, '').trim();
        const key = `${baseName}_${coins}`;

        if (archivedMap.has(key)) {
          warnings.push({
            giftName: baseName,
            coins,
            action: mapping.action,
            archivedDate: archivedMap.get(key).archivedDate,
            reason: archivedMap.get(key).reason
          });
        }
      }
    }

    return warnings;
  }
}

module.exports = GiftUpdater;
