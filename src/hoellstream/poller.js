/**
 * HoellStream Poller
 * Polls the HoellStream API for TikTok gift events and triggers game actions
 */
class HoellStreamPoller {
  constructor(gameOperations, basicOperations, config = {}) {
    this.gameOps = gameOperations;  // expandedOps
    this.basicOps = basicOperations; // gameOps (has KO player)
    this.restorationManager = null; // ItemRestorationManager (set via setRestorationManager)
    this.seenEventIds = new Set();
    this.pollInterval = null;
    this.isPolling = false;
    this.startTime = null; // Track when polling started (to filter old events)
    this.lastPollTime = null; // Track last successful poll time

    // Gift mappings (loaded dynamically from settings)
    this.giftMappings = {};

    // Threshold tracking (resets each session)
    this.thresholdCounts = new Map(); // gift name -> current count
    this.thresholdConfigs = new Map(); // gift name -> { type, target, action, params }
    this.totalCoinValue = 0; // Track total coin value for value-based thresholds

    // Configuration
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000/api/messages/stream';
    this.pollIntervalMs = config.pollIntervalMs || 2000; // 2 seconds
    this.debugMode = config.debugMode !== undefined ? config.debugMode : true;

    // Load TIKTOK_GIFTS database for coin value lookups
    this.giftDatabase = config.giftDatabase || null;
    if (this.giftDatabase) {
      const giftCount = Object.values(this.giftDatabase).reduce((sum, arr) => sum + arr.length, 0);
      this.log(`📚 Gift database loaded with ${giftCount} gifts`);
    } else {
      this.log(`⚠️ No gift database provided - coin value tracking disabled`, 'warn');
    }

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
   * Look up coin value for a gift name from TIKTOK_GIFTS database
   */
  getGiftCoinValue(giftName) {
    // Check if database is loaded
    if (!this.giftDatabase) {
      return 0;
    }

    // Search through all coin values to find this gift
    for (const [coins, giftNames] of Object.entries(this.giftDatabase)) {
      if (giftNames.includes(giftName)) {
        const coinValue = parseInt(coins);
        this.log(`💰 Looked up "${giftName}": ${coinValue} coins`, 'info');
        return coinValue;
      }
    }

    // Gift not found in database
    this.log(`⚠️ Gift "${giftName}" not found in database`, 'warn');
    return 0;
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
      // Use stream endpoint for messages
      const url = this.apiBaseUrl;

      this.log(`📡 Polling ${url}...`);

      const response = await fetch(url);

      this.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        this.log(`⚠️  HoellStream: API returned ${response.status}`, 'warn');
        return;
      }

      // Handle Server-Sent Events stream - read with timeout
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const events = [];

      // Read from stream with 1 second timeout
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 1000));
      const readChunk = async () => {
        const { done, value } = await reader.read();
        if (done) return null;
        return decoder.decode(value, { stream: true });
      };

      // Read chunks until timeout
      const timeoutPromise = timeout;
      while (true) {
        const chunkPromise = readChunk();
        const chunk = await Promise.race([chunkPromise, timeoutPromise]);

        if (chunk === null) break; // Timeout or stream ended

        buffer += chunk;

        // Parse complete SSE messages from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6);
              const event = JSON.parse(jsonStr);
              events.push(event);
            } catch (e) {
              this.log(`⚠️ Failed to parse event: ${e.message}`, 'warn');
            }
          }
        }
      }

      // Clean up reader
      try { reader.cancel(); } catch (e) { /* ignore */ }

      // Wrap in expected format
      const data = { events, count: events.length };

      this.log(`📦 Received ${data.events ? data.events.length : 0} total events`);

      if (!data.events || !Array.isArray(data.events)) {
        this.log('⚠️  HoellStream: Invalid response format', 'warn');
        return;
      }

      // Debug: log event types
      if (data.events.length > 0 && this.debugMode) {
        data.events.forEach(evt => {
          this.log(`🔍 Event type: "${evt.type}" | giftName: "${evt.giftName || 'N/A'}" | platform: "${evt.platform}"`);
        });
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

    const giftName = event.giftName;
    const giftAmount = event.amount || 1;

    // Look up coin value from TIKTOK_GIFTS database
    const coinValue = this.getGiftCoinValue(giftName);

    // ALWAYS track coin value for value-based thresholds (even for unmapped gifts)
    if (coinValue > 0) {
      const coinValueAdded = coinValue * giftAmount;
      this.totalCoinValue += coinValueAdded;
      this.log(`💎 Total coin value this session: ${this.totalCoinValue.toLocaleString()} (+${coinValueAdded.toLocaleString()} from ${giftName} x${giftAmount})`, 'success');

      // Check value-based threshold for ALL gifts
      await this.checkValueThreshold();
    } else {
      this.log(`⚠️ No coin value found for "${giftName}" - not adding to total`, 'warn');
    }

    // Check if we have a mapping for this gift
    const mapping = this.giftMappings[giftName];

    if (!mapping) {
      if (this.debugMode) {
        this.log(`❓ Unknown gift: ${giftName} from ${event.displayName} (not configured in settings)`);
      }

      // Still check count-based thresholds for unmapped gifts
      await this.checkThreshold(giftName);
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

    this.log(`🎁 ${emoji} ${giftName}${amountText} received from ${event.displayName}`, 'success');
    this.log(`   → Action: ${action} | Description: ${description} | Params: ${JSON.stringify(params)}`, 'info');

    // Check threshold tracking for this gift (count-based)
    await this.checkThreshold(giftName);

    // Small delay to prevent overwhelming SNI connection with rapid gifts (50ms)
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      let result;

      this.log(`🔧 Executing action: ${action}`, 'info');

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

      // Special handling for timed event actions (with duration parameter)
      if (action === 'triggerChickenAttack' || action === 'triggerEnemyWaves' || action === 'triggerBeeSwarmWaves' || action === 'makeEnemiesInvisible') {
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

        const duration = (params && params.duration) ? params.duration : 60;
        this.log(`🔧 Calling ${action}(${duration}) [timed event, params=${JSON.stringify(params)}]`, 'info');
        result = await ops[action](duration);

        if (result && result.success === false) {
          this.log(`⚠️  Action failed: ${result.error || 'Unknown error'}`, 'warn');
        } else {
          this.log(`✅ ${description} completed successfully (${duration}s)`, 'success');
        }

        return;
      }

      // Check which operations object has the action
      let ops = null;
      if (typeof this.gameOps[action] === 'function') {
        ops = this.gameOps; // expandedOps
        this.log(`   Found action in expandedOps`, 'info');
      } else if (typeof this.basicOps[action] === 'function') {
        ops = this.basicOps; // gameOps (basic operations)
        this.log(`   Found action in basicOps`, 'info');
      } else {
        this.log(`❌ Invalid action: ${action} does not exist in either operations`, 'error');
        return;
      }

      // Actions that don't take any parameters
      const noParamActions = ['deleteAllSaves', 'killPlayer', 'spawnRandomEnemy'];

      // Execute the game operation
      if (noParamActions.includes(action)) {
        // These actions don't take parameters
        this.log(`🔧 Calling ${action}() [no params needed]`, 'info');
        result = await ops[action]();
      } else if (params && Object.keys(params).length > 0) {
        // Get the first value from params object (level, amount, count, name, num, type, etc.)
        const paramValue = Object.values(params)[0];
        this.log(`🔧 Calling ${action}(${paramValue}, ${giftAmount}) [with params]`, 'info');
        result = await ops[action](paramValue, giftAmount);
      } else {
        // For operations without params, pass the gift amount as first parameter
        this.log(`🔧 Calling ${action}(${giftAmount}) [with gift amount]`, 'info');
        result = await ops[action](giftAmount);
      }

      if (result && result.success === false) {
        this.log(`⚠️  Action failed: ${result.error || 'Unknown error'}`, 'warn');
      } else {
        this.log(`✅ ${description} completed successfully`, 'success');
      }

    } catch (error) {
      // Enhanced error logging with connection diagnostics
      if (error.message.includes('UNAVAILABLE') || error.message.includes('Connection') || error.message.includes('ECONNREFUSED')) {
        this.log(`❌ Connection error executing ${action}: ${error.message}`, 'error');
        this.log(`⚠️  SNI connection lost - check if SNI.exe is running and restart it if needed`, 'warn');
      } else if (error.message.includes('No device selected')) {
        this.log(`❌ No device selected - connect to SNI first`, 'error');
      } else if (error.message.includes('timeout') || error.code === 4) {
        this.log(`❌ Timeout executing ${action} - SNI may be overloaded, retrying next gift`, 'error');
      } else {
        this.log(`❌ Error executing ${action}: ${error.message}`, 'error');
        console.error('Full error stack:', error);
      }
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
   * Load threshold configurations from storage
   */
  async loadThresholdConfigs(thresholds) {
    this.thresholdConfigs.clear();
    this.thresholdCounts.clear();

    if (!thresholds || Object.keys(thresholds).length === 0) {
      this.log('📊 No threshold configurations loaded');
      return;
    }

    for (const [giftName, config] of Object.entries(thresholds)) {
      this.thresholdConfigs.set(giftName, config);
      this.thresholdCounts.set(giftName, 0); // Initialize count to 0
      this.log(`📊 Threshold loaded: ${config.target} x "${giftName}" → ${config.action}`);
    }

    this.log(`📊 Loaded ${this.thresholdConfigs.size} threshold configurations`);
  }

  /**
   * Increment threshold count for a gift and check if threshold is met
   */
  async checkThreshold(giftName) {
    // Debug: Show all configured thresholds
    if (this.thresholdConfigs.size > 0) {
      this.log(`🔍 Checking threshold for "${giftName}" (Configured: ${Array.from(this.thresholdConfigs.keys()).join(', ')})`, 'info');
    }

    if (!this.thresholdConfigs.has(giftName)) {
      this.log(`⏭️ No threshold configured for "${giftName}"`, 'info');
      return; // Gift not configured for threshold
    }

    const config = this.thresholdConfigs.get(giftName);
    const currentCount = (this.thresholdCounts.get(giftName) || 0) + 1;
    this.thresholdCounts.set(giftName, currentCount);

    this.log(`📊 Threshold progress: ${currentCount}/${config.target} x "${giftName}"`, 'success');

    // Check if threshold is met
    if (currentCount >= config.target) {
      this.log(`🎯 Threshold reached! ${config.target} x "${giftName}" → Triggering ${config.action}`, 'success');

      // Reset counter
      this.thresholdCounts.set(giftName, 0);

      // Execute the action
      await this.executeGiftAction(config.action, config.description || config.action, config.params || {});
    }
  }

  /**
   * Check value-based threshold (total coin value)
   */
  async checkValueThreshold() {
    // Check if there's a value-based threshold configured
    if (!this.thresholdConfigs.has('__VALUE_TOTAL__')) {
      return;
    }

    const config = this.thresholdConfigs.get('__VALUE_TOTAL__');

    this.log(`📊 Value threshold progress: ${this.totalCoinValue.toLocaleString()}/${config.target.toLocaleString()} coins`, 'success');

    // Check if threshold is met
    if (this.totalCoinValue >= config.target) {
      this.log(`🎯 VALUE THRESHOLD REACHED! ${config.target.toLocaleString()} total coins → Triggering ${config.action}`, 'success');

      // Reset counter
      this.totalCoinValue = 0;

      // Execute the action
      await this.executeGiftAction(config.action, config.description || config.action, config.params || {});
    }
  }

  /**
   * Get current threshold status for all configured thresholds
   */
  getThresholdStatus() {
    const status = [];

    for (const [giftName, config] of this.thresholdConfigs.entries()) {
      let current;

      if (giftName === '__VALUE_TOTAL__') {
        // Value-based threshold
        current = this.totalCoinValue;
      } else {
        // Count-based threshold
        current = this.thresholdCounts.get(giftName) || 0;
      }

      status.push({
        giftName,
        current,
        target: config.target,
        action: config.action,
        description: config.description || config.action,
        progress: `${current}/${config.target}`
      });
    }

    return status;
  }

  /**
   * Execute a gift action (used by threshold system)
   */
  async executeGiftAction(action, description, params = {}) {
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

      // Special handling for timed event actions (with duration parameter)
      if (action === 'triggerChickenAttack' || action === 'triggerEnemyWaves' || action === 'triggerBeeSwarmWaves' || action === 'makeEnemiesInvisible') {
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

        const duration = (params && params.duration) ? params.duration : 60;
        this.log(`🔧 Calling ${action}(${duration}) [timed event, params=${JSON.stringify(params)}]`, 'info');
        result = await ops[action](duration);

        if (result && result.success === false) {
          this.log(`⚠️  Action failed: ${result.error || 'Unknown error'}`, 'warn');
        } else {
          this.log(`✅ ${description} completed successfully (${duration}s)`, 'success');
        }

        return;
      }

      // Check which operations object has the action
      let ops = null;
      if (typeof this.gameOps[action] === 'function') {
        ops = this.gameOps; // expandedOps
        this.log(`   [Threshold] Found action in expandedOps`, 'info');
      } else if (typeof this.basicOps[action] === 'function') {
        ops = this.basicOps; // gameOps (basic operations)
        this.log(`   [Threshold] Found action in basicOps`, 'info');
      } else {
        this.log(`❌ [Threshold] Invalid action: ${action} does not exist in either operations`, 'error');
        return;
      }

      // Actions that don't take any parameters
      const noParamActions = ['deleteAllSaves', 'killPlayer', 'spawnRandomEnemy'];

      // Execute the game operation
      if (noParamActions.includes(action)) {
        // These actions don't take parameters
        this.log(`🔧 [Threshold] Calling ${action}() [no params needed]`, 'info');
        result = await ops[action]();
      } else if (params && Object.keys(params).length > 0) {
        // Get the first value from params object (level, amount, count, name, num, type, etc.)
        const paramValue = Object.values(params)[0];
        this.log(`🔧 [Threshold] Calling ${action}(${paramValue}) [with params]`, 'info');
        result = await ops[action](paramValue);
      } else {
        // For operations without params
        this.log(`🔧 [Threshold] Calling ${action}() [no params]`, 'info');
        result = await ops[action]();
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
