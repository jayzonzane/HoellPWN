/**
 * HoellStream Poller
 * Polls the HoellStream API for TikTok gift events and triggers game actions
 */
class HoellStreamPoller {
  constructor(gameOperations, basicOperations, config = {}) {
    this.gameOps = gameOperations;  // expandedOps
    this.basicOps = basicOperations; // gameOps (has killPlayer)
    this.restorationManager = null; // ItemRestorationManager (set via setRestorationManager)
    this.seenEventIds = new Set();
    this.pollInterval = null;
    this.isPolling = false;
    this.startTime = null; // Track when polling started (to filter old events)
    this.lastPollTime = null; // Track last successful poll time

    // Gift mappings (loaded dynamically from settings)
    this.giftMappings = {};

    // Configuration
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000/api/events';
    this.pollIntervalMs = config.pollIntervalMs || 2000; // 2 seconds
    this.debugMode = config.debugMode !== undefined ? config.debugMode : true;

    this.log('🎁 HoellStream Poller initialized');
  }

  /**
   * Set the restoration manager (called from main.js after initialization)
   */
  setRestorationManager(restorationManager) {
    this.restorationManager = restorationManager;
    this.log('⏱️ ItemRestorationManager connected to poller');
  }

  /**
   * Update gift mappings (called when settings are saved)
   */
  updateMappings(mappings) {
    this.giftMappings = mappings;
    this.log(`🔄 Updated gift mappings: ${Object.keys(mappings).length} gifts configured`);
  }

  /**
   * Start polling the HoellStream API
   */
  start() {
    if (this.isPolling) {
      this.log('⚠️  Polling already active', 'warn');
      return;
    }

    this.isPolling = true;
    // Set start time to filter out events from before app connected
    this.startTime = new Date();
    this.lastPollTime = this.startTime.toISOString();
    this.log(`🎁 HoellStream: Polling started (ignoring events before ${this.lastPollTime})`);

    // Poll immediately, then set interval
    this.poll();
    this.pollInterval = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  /**
   * Stop polling
   */
  stop() {
    if (!this.isPolling) {
      return;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.isPolling = false;
    this.log('🎁 HoellStream: Polling stopped');
  }

  /**
   * Poll the API for recent events
   */
  async poll() {
    try {
      // Use recent endpoint since /since/:timestamp doesn't work reliably
      const url = `${this.apiBaseUrl}/recent/10`;

      this.log(`📡 Polling ${url}...`);

      const response = await fetch(url);

      this.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        this.log(`⚠️  HoellStream: API returned ${response.status}`, 'warn');
        return;
      }

      const data = await response.json();

      this.log(`📦 Received ${data.events ? data.events.length : 0} total events`);

      if (!data.events || !Array.isArray(data.events)) {
        this.log('⚠️  HoellStream: Invalid response format', 'warn');
        return;
      }

      // Filter for gift events only
      let giftEvents = data.events.filter(event => event.type === 'gift');
      this.log(`🎁 Found ${giftEvents.length} gift events (before time filter)`);

      // Filter out events from before app started (prevents processing old events on restart)
      const beforeFilter = giftEvents.length;
      giftEvents = giftEvents.filter(event => {
        const eventTime = new Date(event.timestamp);
        const isNew = eventTime >= this.startTime;
        if (!isNew) {
          this.log(`⏰ Filtering out old event: ${event.giftName} from ${event.timestamp} (before ${this.startTime.toISOString()})`);
        }
        return isNew;
      });
      this.log(`✅ After time filter: ${giftEvents.length} new gift events (filtered out ${beforeFilter - giftEvents.length} old)`);

      if (giftEvents.length > 0) {
        this.log(`🎁 HoellStream: Processing ${giftEvents.length} new gift events`);
      }

      // Process events in chronological order (oldest first)
      const sortedEvents = giftEvents.sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      for (const event of sortedEvents) {
        this.log(`🔄 Processing event: ${event.giftName} from ${event.displayName}`);
        await this.processEvent(event);
      }

    } catch (error) {
      // Log detailed error information
      if (error.code === 'ECONNREFUSED') {
        this.log('⚠️  HoellStream: API connection refused (is HoellStream running?)', 'warn');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        this.log(`⚠️  HoellStream: Fetch error - ${error.message}`, 'error');
      } else {
        this.log(`⚠️  HoellStream: Poll error - ${error.message}`, 'error');
        console.error('Full error:', error);
      }
    }
  }

  /**
   * Process a single event
   */
  async processEvent(event) {
    // Check if we've already processed this event (belt and suspenders)
    if (this.seenEventIds.has(event.id)) {
      if (this.debugMode) {
        this.log(`✋ Already processed event: ${event.id}`);
      }
      return;
    }

    // Mark as seen
    this.seenEventIds.add(event.id);

    // Check if we have a mapping for this gift
    const giftName = event.giftName;
    const mapping = this.giftMappings[giftName];

    if (!mapping) {
      if (this.debugMode) {
        this.log(`❓ Unknown gift: ${giftName} from ${event.displayName} (not configured in settings)`);
      }
      return;
    }

    // Execute the mapped action
    await this.handleGift(giftName, mapping, event);
  }

  /**
   * Handle a gift by executing its mapped action
   */
  async handleGift(giftName, mapping, event) {
    const { action, emoji, description, params } = mapping;

    // Get the gift amount (multiplier) from the event
    const giftAmount = event.amount || 1;
    const amountText = giftAmount > 1 ? ` x${giftAmount}` : '';

    this.log(`${emoji} ${giftName}${amountText} received from ${event.displayName} → ${description}`);

    try {
      let result;

      // Special handling for disableItem action
      if (action === 'disableItem') {
        if (!this.restorationManager) {
          this.log(`❌ ItemRestorationManager not available for disableItem action`, 'error');
          return;
        }

        if (!params || !params.itemName || !params.duration) {
          this.log(`❌ disableItem requires itemName and duration params`, 'error');
          return;
        }

        const itemName = params.itemName;
        const duration = params.duration;

        this.log(`🔧 Calling restorationManager.disableItemTemporarily(${itemName}, ${duration})`);
        result = await this.restorationManager.disableItemTemporarily(itemName, duration);

        if (result.success) {
          this.log(`🚫 ${result.displayName} disabled for ${duration} seconds`, 'success');
        } else if (result.alreadyDisabled) {
          this.log(`⚠️  ${result.error}`, 'warn');
        } else if (result.noAction) {
          this.log(`ℹ️  ${result.warning}`, 'warn');
        } else {
          this.log(`⚠️  Failed to disable item: ${result.error}`, 'warn');
        }

        return;
      }

      // Check which operations object has the action
      let ops = null;
      if (typeof this.gameOps[action] === 'function') {
        ops = this.gameOps; // expandedOps
      } else if (typeof this.basicOps[action] === 'function') {
        ops = this.basicOps; // gameOps (basic operations)
      } else {
        this.log(`❌ Invalid action: ${action} does not exist in either operations`, 'error');
        return;
      }

      // Execute the game operation
      // Extract individual parameter values if params object exists
      if (params) {
        // Get the first value from params object (level, amount, count, name, num, type, etc.)
        const paramValue = Object.values(params)[0];
        this.log(`🔧 Calling ${action}(${paramValue}, ${giftAmount}) [with params]`);
        result = await ops[action](paramValue, giftAmount);
      } else {
        // For operations without params, pass the gift amount as first parameter
        this.log(`🔧 Calling ${action}(${giftAmount}) [no params]`);
        result = await ops[action](giftAmount);
      }

      if (result && result.success === false) {
        this.log(`⚠️  Action failed: ${result.error || 'Unknown error'}`, 'warn');
      } else {
        this.log(`✅ ${description} completed successfully`, 'success');
      }

    } catch (error) {
      this.log(`❌ Error executing ${action}: ${error.message}`, 'error');
    }
  }

  /**
   * Clear the seen events cache (useful for testing)
   */
  clearSeenEvents() {
    const count = this.seenEventIds.size;
    this.seenEventIds.clear();
    this.log(`🗑️  Cleared ${count} seen events from cache`);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      isPolling: this.isPolling,
      seenEventsCount: this.seenEventIds.size,
      pollIntervalMs: this.pollIntervalMs,
      apiBaseUrl: this.apiBaseUrl,
      lastPollTime: this.lastPollTime,
      trackingSince: this.lastPollTime
    };
  }

  /**
   * Internal logging helper
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const prefix = `[${timestamp}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'success':
        console.log(`${prefix} ✅ ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}

module.exports = HoellStreamPoller;
