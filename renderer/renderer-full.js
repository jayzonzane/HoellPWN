// UI Elements
const connectBtn = document.getElementById('connect-btn');
const statusDiv = document.getElementById('status');
const deviceSelect = document.getElementById('device-select');
const controlsSection = document.getElementById('controls-tab');
const logDiv = document.getElementById('log');
const sniStatusLight = document.getElementById('sni-status-light');
const hoellStreamStatusLight = document.getElementById('hoellstream-status-light');
const tikfinityStatusLight = document.getElementById('tikfinity-status-light');
const giftSourceControls = document.getElementById('gift-source-controls');
const toggleGiftPollingBtn = document.getElementById('toggle-gift-polling-btn');
const connectionModeRadios = document.getElementsByName('connection-mode');
const portInput = document.getElementById('port');
const connectionNote = document.getElementById('connection-note');
const emulatorConnectionLabel = document.getElementById('emulator-connection-label');

// State
let connected = false;
let selectedDevice = null;
let devices = [];
let connectionMode = 'sni'; // 'sni' or 'lua'

// Status Light Control
function updateSNIStatus(isConnected) {
  if (isConnected) {
    sniStatusLight.classList.add('connected');
  } else {
    sniStatusLight.classList.remove('connected');
  }
}

function updateHoellStreamStatus(isConnected) {
  if (isConnected) {
    hoellStreamStatusLight.classList.add('connected');
  } else {
    hoellStreamStatusLight.classList.remove('connected');
  }
}

function updateTikFinityStatus(isConnected) {
  if (isConnected) {
    tikfinityStatusLight.classList.add('connected');
  } else {
    tikfinityStatusLight.classList.remove('connected');
  }
}

// Logger
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${timestamp}] ${message}`;
  logDiv.insertBefore(entry, logDiv.firstChild);

  // Keep only last 20 entries for compact view
  while (logDiv.children.length > 20) {
    logDiv.removeChild(logDiv.lastChild);
  }
}

// Connection Mode Switching
connectionModeRadios.forEach(radio => {
  radio.addEventListener('change', async (e) => {
    const mode = e.target.value;
    connectionMode = mode;

    // Update UI based on mode
    if (mode === 'lua') {
      connectBtn.textContent = 'Connect to Lua Connector';
      portInput.value = '65399';
      connectionNote.textContent = 'Note: HoellPWN-Connector.lua must be running in your emulator';
      emulatorConnectionLabel.textContent = 'Lua';
      log('Switched to Lua Connector mode', 'info');
    } else {
      connectBtn.textContent = 'Connect to SNI';
      portInput.value = '8191';
      connectionNote.textContent = 'Note: SNI must be running externally on port 8191';
      emulatorConnectionLabel.textContent = 'SNI';
      log('Switched to SNI mode', 'info');
    }

    // Notify main process of mode change
    try {
      const result = await window.sniAPI.setConnectionMode(mode);
      if (result.success) {
        log(`Connection mode set to ${mode.toUpperCase()}`, 'success');
      } else {
        log(`Failed to set connection mode: ${result.error}`, 'error');
      }
    } catch (error) {
      log(`Error setting connection mode: ${error.message}`, 'error');
    }
  });
});

// Connection handling
connectBtn.addEventListener('click', async () => {
  const host = document.getElementById('host').value || 'localhost';
  const port = document.getElementById('port').value || (connectionMode === 'lua' ? '65399' : '8191');

  connectBtn.disabled = true;
  statusDiv.textContent = 'Connecting...';
  statusDiv.className = 'status connecting';

  const modeName = connectionMode === 'lua' ? 'Lua Connector' : 'SNI';
  log(`Connecting to ${modeName} at ${host}:${port}...`);

  try {
    let result;

    // Call appropriate connection method based on mode
    if (connectionMode === 'lua') {
      result = await window.sniAPI.connectLua(host, port);
    } else {
      result = await window.sniAPI.connect(host, port);
    }

    if (result.success) {
      connected = true;
      statusDiv.textContent = `Connected to ${modeName}`;
      statusDiv.className = 'status connected';
      log('Connected successfully!', 'success');
      updateSNIStatus(true);

      // Populate device list
      if (result.devices && result.devices.length > 0) {
        devices = result.devices;
        deviceSelect.style.display = 'block';
        deviceSelect.innerHTML = '<option value="">Select a device...</option>';

        result.devices.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = device.displayName || device.uri;
          deviceSelect.appendChild(option);
        });

        log(`Found ${result.devices.length} device(s)`, 'info');

        // Auto-select if only one device (always true for Lua connector)
        if (result.devices.length === 1) {
          deviceSelect.value = 0;
          deviceSelect.dispatchEvent(new Event('change'));
        }
      } else {
        log('No devices found. Make sure the emulator is running with a game loaded.', 'warning');
      }
    } else {
      throw new Error(result.error || 'Connection failed');
    }
  } catch (error) {
    log(`Connection failed: ${error.message}`, 'error');
    statusDiv.textContent = 'Connection failed';
    statusDiv.className = 'status error';
    connected = false;
    updateSNIStatus(false);
  } finally {
    connectBtn.disabled = false;
  }
});

// Device selection
deviceSelect.addEventListener('change', async (e) => {
  const index = e.target.value;
  if (index !== '') {
    try {
      const device = devices[index];
      const result = await window.sniAPI.selectDevice(device);
      if (result.success) {
        selectedDevice = device;
        controlsSection.style.display = 'block';
        giftSourceControls.style.display = 'block';
        log(`Selected device: ${device.displayName || device.uri}`, 'success');
      }
    } catch (error) {
      log(`Failed to select device: ${error.message}`, 'error');
    }
  } else {
    controlsSection.style.display = 'none';
    giftSourceControls.style.display = 'none';
    selectedDevice = null;
  }
});

// Gift polling toggle button (source-aware)
toggleGiftPollingBtn.addEventListener('click', async () => {
  try {
    toggleGiftPollingBtn.disabled = true;

    // Get selected source
    const selectedSource = document.querySelector('input[name="gift-source"]:checked').value;

    const result = await window.sniAPI.toggleGiftPolling(selectedSource);

    if (result.success) {
      if (result.polling) {
        toggleGiftPollingBtn.textContent = '🎁 Stop Gift Polling';
        toggleGiftPollingBtn.style.background = '#f44336';
        toggleGiftPollingBtn.dataset.activeSource = result.source;
        log(`✅ ${result.source} polling started`, 'success');
      } else {
        toggleGiftPollingBtn.textContent = '🎁 Start Gift Polling';
        toggleGiftPollingBtn.style.background = '#2196F3';
        delete toggleGiftPollingBtn.dataset.activeSource;
        log(`⚠️ ${result.source} polling stopped`, 'warning');
      }
    } else {
      log(`❌ Failed to toggle gift polling: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`❌ Error toggling gift polling: ${error.message}`, 'error');
  } finally {
    toggleGiftPollingBtn.disabled = false;
  }
});

// Prevent source switching while polling is active
document.querySelectorAll('input[name="gift-source"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const pollingActive = toggleGiftPollingBtn.textContent.includes('Stop');
    if (pollingActive) {
      alert('Please stop gift polling before switching sources.');
      // Revert to previous selection
      const activeSource = toggleGiftPollingBtn.dataset.activeSource || 'hoellstream';
      document.querySelector(`input[name="gift-source"][value="${activeSource}"]`).checked = true;
    }
  });
});

// Restart SNI button removed - SNI must be run externally

// ============= CORE FUNCTIONS =============

async function addHeart() {
  try {
    const result = await window.sniAPI.addHeart();
    if (result.success) {
      log(`Added heart container! New max: ${result.newMax} hearts`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function removeHeart() {
  try {
    const result = await window.sniAPI.removeHeart();
    if (result.success) {
      log(`Removed heart container! New max: ${result.newMax} hearts`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function addHeartPiece() {
  try {
    const result = await window.sniAPI.addHeartPiece();
    if (result.success) {
      log(result.message || 'Heart piece added!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function killPlayer() {
  if (!confirm('KO the player?')) return;
  try {
    const result = await window.sniAPI.killPlayer();
    if (result.success) {
      log('Player KO\'d!', 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function testMemory() {
  try {
    const result = await window.sniAPI.testMemory();
    if (result.success) {
      log('Memory test completed. Check console for details.', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= RESOURCES =============

async function setRupees(amount) {
  try {
    const result = await window.sniAPI.setRupees(amount);
    if (result.success) {
      log(`Rupees set to ${result.rupees}!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function addRupees(amount) {
  try {
    const result = await window.sniAPI.addRupees(amount);
    if (result.success) {
      log(`Added rupees! Total: ${result.rupees}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function setBombs(amount) {
  try {
    const result = await window.sniAPI.setBombs(amount);
    if (result.success) {
      log(`Bombs set to ${result.bombs}!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function setArrows(amount) {
  try {
    const result = await window.sniAPI.setArrows(amount);
    if (result.success) {
      log(`Arrows set to ${result.arrows}!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function addRupee() {
  try {
    const result = await window.sniAPI.addRupee();
    if (result.success) {
      log(`Rupees: ${result.rupees}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function removeRupee() {
  try {
    const result = await window.sniAPI.removeRupee();
    if (result.success) {
      log(`Rupees: ${result.rupees}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function addBomb() {
  try {
    const result = await window.sniAPI.addBomb();
    if (result.success) {
      log(`Bombs: ${result.bombs}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function removeBomb() {
  try {
    const result = await window.sniAPI.removeBomb();
    if (result.success) {
      log(`Bombs: ${result.bombs}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function addArrow() {
  try {
    const result = await window.sniAPI.addArrow();
    if (result.success) {
      log(`Arrows: ${result.arrows}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function removeArrow() {
  try {
    const result = await window.sniAPI.removeArrow();
    if (result.success) {
      log(`Arrows: ${result.arrows}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= EQUIPMENT =============

async function setSword(level) {
  try {
    const result = await window.sniAPI.setSword(level);
    if (result.success) {
      log(`Sword: ${result.sword}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function setShield(level) {
  try {
    const result = await window.sniAPI.setShield(level);
    if (result.success) {
      log(`Shield: ${result.shield}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function setArmor(level) {
  try {
    const result = await window.sniAPI.setArmor(level);
    if (result.success) {
      log(`Armor: ${result.armor}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function setGloves(level) {
  try {
    const result = await window.sniAPI.setGloves(level);
    if (result.success) {
      log(`Gloves: ${result.gloves}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= TOGGLES =============

async function toggleBoots() {
  try {
    const result = await window.sniAPI.toggleBoots();
    if (result.success) {
      log(`Pegasus Boots: ${result.boots ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleFlippers() {
  try {
    const result = await window.sniAPI.toggleFlippers();
    if (result.success) {
      log(`Flippers: ${result.flippers ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleMoonPearl() {
  try {
    const result = await window.sniAPI.toggleMoonPearl();
    if (result.success) {
      log(`Moon Pearl: ${result.moonPearl ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleHookshot() {
  try {
    const result = await window.sniAPI.toggleHookshot();
    if (result.success) {
      log(`Hookshot: ${result.hookshot ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleLamp() {
  try {
    const result = await window.sniAPI.toggleLamp();
    if (result.success) {
      log(`Lamp: ${result.lamp ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleHammer() {
  try {
    const result = await window.sniAPI.toggleHammer();
    if (result.success) {
      log(`Hammer: ${result.hammer ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleBook() {
  try {
    const result = await window.sniAPI.toggleBook();
    if (result.success) {
      log(`Book of Mudora: ${result.book ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleBugNet() {
  try {
    const result = await window.sniAPI.toggleBugNet();
    if (result.success) {
      log(`Bug Net: ${result.bugNet ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleSomaria() {
  try {
    const result = await window.sniAPI.toggleSomaria();
    if (result.success) {
      log(`Cane of Somaria: ${result.somaria ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleByrna() {
  try {
    const result = await window.sniAPI.toggleByrna();
    if (result.success) {
      log(`Cane of Byrna: ${result.byrna ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleMirror() {
  try {
    const result = await window.sniAPI.toggleMirror();
    if (result.success) {
      log(`Magic Mirror: ${result.mirror ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleBoomerang() {
  try {
    const result = await window.sniAPI.toggleBoomerang();
    if (result.success) {
      log(`Boomerang: ${result.boomerang}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleInvincibility() {
  try {
    const result = await window.sniAPI.toggleInvincibility();
    if (result.success) {
      log(`GOD MODE: ${result.invincible ? 'ACTIVATED!' : 'DEACTIVATED'}`, result.invincible ? 'warning' : 'info');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= ENEMY SPAWNING =============

async function spawnEnemy(enemyType) {
  try {
    const result = await window.sniAPI.spawnEnemy(enemyType);
    if (result.success) {
      log(result.message, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function triggerChickenAttack(durationSeconds) {
  try {
    const result = await window.sniAPI.triggerChickenAttack(durationSeconds);
    if (result.success) {
      log(result.message, 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function spawnRandomEnemy() {
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

    // Spawn the enemy
    const result = await window.sniAPI.spawnEnemy(randomEnemy);
    if (result.success) {
      log(`🎲 Random: ${result.message}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function spawnBeeSwarm() {
  try {
    const result = await window.sniAPI.spawnBeeSwarm(7);
    if (result.success) {
      log(result.message, 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function triggerEnemyWaves(durationSeconds) {
  try {
    const result = await window.sniAPI.triggerEnemyWaves(durationSeconds);
    if (result.success) {
      log(result.message, 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function triggerBeeSwarmWaves(durationSeconds) {
  try {
    const result = await window.sniAPI.triggerBeeSwarmWaves(durationSeconds);
    if (result.success) {
      log(result.message, 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function makeEnemiesInvisible(durationSeconds) {
  try {
    const result = await window.sniAPI.makeEnemiesInvisible(durationSeconds);
    if (result.success) {
      log(result.message, 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function enableInfiniteMagic(durationSeconds) {
  console.log(`[Renderer] enableInfiniteMagic called with duration: ${durationSeconds}`);
  try {
    const result = await window.sniAPI.enableInfiniteMagic(durationSeconds);
    console.log('[Renderer] enableInfiniteMagic result:', result);
    if (result.success) {
      log(result.message, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('[Renderer] enableInfiniteMagic error:', error);
    log(`Error: ${error.message}`, 'error');
  }
}

async function deleteAllSaves() {
  try {
    const result = await window.sniAPI.deleteAllSaves();
    if (result.success) {
      log(result.message, 'error');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= MAGIC ITEMS =============

async function toggleFireRod() {
  try {
    const result = await window.sniAPI.toggleFireRod();
    if (result.success) {
      log(`Fire Rod: ${result.fireRod ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function giveFireRod() {
  try {
    const result = await window.sniAPI.giveFireRod();
    if (result.success) {
      log('Fire Rod granted!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleIceRod() {
  try {
    const result = await window.sniAPI.toggleIceRod();
    if (result.success) {
      log(`Ice Rod: ${result.iceRod ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function giveIceRod() {
  try {
    const result = await window.sniAPI.giveIceRod();
    if (result.success) {
      log('Ice Rod granted!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function giveCapes() {
  try {
    const result = await window.sniAPI.giveCapes();
    if (result.success) {
      log(result.message || 'Capes granted!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function giveFlute() {
  try {
    const result = await window.sniAPI.giveFlute();
    if (result.success) {
      log(result.message, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function removeFlute() {
  try {
    const result = await window.sniAPI.removeFlute();
    if (result.success) {
      log(result.message, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function deactivateFlute() {
  try {
    const result = await window.sniAPI.deactivateFlute();
    if (result.success) {
      log(result.message, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleMedallion(name) {
  try {
    const result = await window.sniAPI.toggleMedallion(name);
    if (result.success) {
      log(`${name.charAt(0).toUpperCase() + name.slice(1)}: ${result.has ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleAllMedallions() {
  try {
    const result = await window.sniAPI.toggleAllMedallions();
    if (result.success) {
      log(result.message, result.has ? 'success' : 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function giveAllMedallions() {
  try {
    const result = await window.sniAPI.giveAllMedallions();
    if (result.success) {
      log(result.message || 'All medallions granted!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= MAGIC SYSTEM =============

async function enableMagic() {
  try {
    const result = await window.sniAPI.enableMagic();
    if (result.success) {
      log(result.message || 'Magic enabled!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function removeMagic() {
  try {
    const result = await window.sniAPI.removeMagic();
    if (result.success) {
      log(result.message || 'Magic removed!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function setMagicUpgrade(level) {
  try {
    const result = await window.sniAPI.setMagicUpgrade(level);
    if (result.success) {
      log(`Magic: ${result.upgrade}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// Chaotic Features
async function enableIceWorld(durationSeconds) {
  try {
    const result = await window.sniAPI.enableIceWorld(durationSeconds);
    if (result.success) {
      log(result.message || `❄️ Ice World for ${durationSeconds}s!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function spawnBossRush(durationSeconds) {
  try {
    const result = await window.sniAPI.spawnBossRush(durationSeconds);
    if (result.success) {
      log(result.message || `💀 Boss Rush for ${durationSeconds}s!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function enableItemLock(durationSeconds) {
  try {
    const result = await window.sniAPI.enableItemLock(durationSeconds);
    if (result.success) {
      log(result.message || `🔒 Item Lock for ${durationSeconds}s!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function enableGlassCannon(durationSeconds) {
  try {
    const result = await window.sniAPI.enableGlassCannon(durationSeconds);
    if (result.success) {
      log(result.message || `💀 Glass Cannon for ${durationSeconds}s!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function enableInvertControls(durationSeconds) {
  try {
    console.log(`[enableInvertControls] Called with duration: ${durationSeconds}`);
    const result = await window.sniAPI.enableInvertControls(durationSeconds);
    console.log('[enableInvertControls] Result:', result);
    if (result.success) {
      log(result.message || `🔄 Controls inverted for ${durationSeconds}s!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('[enableInvertControls] Error:', error);
    log(`Error: ${error.message}`, 'error');
  }
}

async function blessingAndCurse() {
  try {
    const result = await window.sniAPI.blessingAndCurse();
    if (result.success) {
      log(result.message || '🎲 Effect Roulette activated!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= BOTTLES =============

async function addBottle() {
  try {
    const result = await window.sniAPI.addBottle();
    if (result.success) {
      log(`Bottle added! Total: ${result.bottles}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function removeBottle() {
  try {
    const result = await window.sniAPI.removeBottle();
    if (result.success) {
      log(`Bottle removed! Total: ${result.bottles}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function fillBottles(type) {
  try {
    const result = await window.sniAPI.fillBottlesPotion(type);
    if (result.success) {
      log(result.message || `Bottles filled with ${type} potion!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= HEARTS =============

async function setHearts(count) {
  try {
    const result = await window.sniAPI.setHearts(count);
    if (result.success) {
      log(`Hearts set to ${result.hearts}!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= PROGRESS =============

async function togglePendant(name) {
  try {
    const result = await window.sniAPI.togglePendant(name);
    if (result.success) {
      log(`${name.charAt(0).toUpperCase() + name.slice(1)} Pendant: ${result.has ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleAllPendants() {
  try {
    const result = await window.sniAPI.toggleAllPendants();
    if (result.success) {
      log(result.message, result.has ? 'success' : 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function giveAllPendants() {
  try {
    const result = await window.sniAPI.giveAllPendants();
    if (result.success) {
      log(result.message || 'All pendants granted!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleCrystal(num) {
  try {
    const result = await window.sniAPI.toggleCrystal(num);
    if (result.success) {
      log(`Crystal ${num}: ${result.has ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleAllCrystals() {
  try {
    const result = await window.sniAPI.toggleAllCrystals();
    if (result.success) {
      log(result.message, result.has ? 'success' : 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function giveAllCrystals() {
  try {
    const result = await window.sniAPI.giveAllCrystals();
    if (result.success) {
      log(result.message || 'All crystals granted!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= KEYS =============

async function giveKeys(dungeon, count) {
  try {
    const result = await window.sniAPI.giveSmallKeys(dungeon, count);
    if (result.success) {
      log(`Small keys for ${dungeon}: ${result.keys}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function addSmallKey(dungeon) {
  try {
    console.log('addSmallKey called with dungeon:', dungeon);
    const result = await window.sniAPI.addSmallKey(dungeon);
    console.log('addSmallKey result:', result);
    if (result.success) {
      log(`${dungeon}: ${result.keys} keys`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('addSmallKey error:', error);
    log(`Error: ${error.message}`, 'error');
  }
}

async function removeSmallKey(dungeon) {
  try {
    console.log('removeSmallKey called with dungeon:', dungeon);
    const result = await window.sniAPI.removeSmallKey(dungeon);
    console.log('removeSmallKey result:', result);
    if (result.success) {
      log(`${dungeon}: ${result.keys} keys`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('removeSmallKey error:', error);
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleBigKey(dungeon) {
  try {
    const result = await window.sniAPI.toggleBigKey(dungeon);
    if (result.success) {
      log(`${dungeon} Big Key: ${result.has ? 'ON' : 'OFF'}`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function giveBigKey(dungeon) {
  try {
    const result = await window.sniAPI.giveBigKey(dungeon);
    if (result.success) {
      log(result.message || `Big key for ${dungeon} granted!`, 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= PRESETS =============

async function giveStarterPack() {
  try {
    const result = await window.sniAPI.giveStarterPack();
    if (result.success) {
      log(result.message || 'Starter pack granted!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function giveEndgamePack() {
  if (!confirm('This will MAX OUT everything! Continue?')) return;
  try {
    const result = await window.sniAPI.giveEndgamePack();
    if (result.success) {
      log('🎉 ENDGAME LOADOUT GRANTED! 🎉', 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= INVENTORY =============

async function getInventory() {
  try {
    const result = await window.sniAPI.getInventory();
    if (result.success) {
      const inv = result.inventory;
      log('=== INVENTORY ===', 'info');
      log(`Hearts: ${inv.currentHealth}/${inv.maxHealth} (Pieces: ${inv.heartPieces}/4)`, 'info');
      log(`Rupees: ${inv.rupees}, Bombs: ${inv.bombs}, Arrows: ${inv.arrows}`, 'info');
      log(`Sword: Lv${inv.sword}, Shield: Lv${inv.shield}, Armor: Lv${inv.armor}`, 'info');
      log(`Bottles: ${inv.bottleCount}`, 'info');
      console.log('Full inventory:', inv);
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= WARP =============

async function warpEastern() {
  try {
    const result = await window.sniAPI.warpEastern();
    if (result.success) {
      log('Warped to Eastern Palace!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function fakeMirror() {
  try {
    const result = await window.sniAPI.fakeMirror();
    if (result.success) {
      log(result.message || '🪞 Fake Mirror activated!', 'success');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function chaosDungeonWarp() {
  try {
    const result = await window.sniAPI.chaosDungeonWarp();
    if (result.success) {
      log(result.message || '🎲 Chaos Dungeon Warp!', 'special');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function toggleWorld() {
  try {
    const result = await window.sniAPI.toggleWorld();
    if (result.success) {
      log(result.message || '🌍 World flipped!', 'special');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// ============= ITEM RESTORATION SYSTEM =============

// Test disable item function
async function testDisableItem(itemName) {
  try {
    // Load gift mappings to get duration configured for this item
    const mappingsResult = await window.sniAPI.loadGiftMappings();
    let duration = 60; // Default duration

    if (mappingsResult.success && mappingsResult.mappings) {
      // Find a mapping for this item (search through all gifts)
      for (const [giftName, mapping] of Object.entries(mappingsResult.mappings)) {
        if (mapping.action === 'disableItem' &&
            mapping.params &&
            mapping.params.itemName === itemName) {
          duration = mapping.params.duration || 60;
          break;
        }
      }
    }

    const result = await window.sniAPI.disableItemTemp(itemName, duration);

    if (result.success) {
      log(`${result.displayName} disabled for ${duration} seconds`, 'warning');
      // Show toast notification
      toastManager.showDisable(result.displayName, duration);
    } else if (result.alreadyDisabled) {
      log(result.error, 'warning');
    } else if (result.noAction) {
      log(result.warning, 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// Listen for item restorations from backend
// Poll for active restorations and show restore toasts
setInterval(async () => {
  try {
    const result = await window.sniAPI.getActiveRestorations();
    if (result.success && result.restorations) {
      // Store previous restorations to detect when items are restored
      if (!window.previousRestorations) {
        window.previousRestorations = new Map();
      }

      const currentMap = new Map(result.restorations.map(r => [r.itemName, r]));

      // Check for items that were active but are now gone (restored)
      for (const [itemName, prevData] of window.previousRestorations.entries()) {
        if (!currentMap.has(itemName)) {
          // Item was restored!
          toastManager.showRestore(prevData.displayName);
          log(`${prevData.displayName} has been restored!`, 'success');
        }
      }

      // Update previous restorations
      window.previousRestorations = currentMap;
    }
  } catch (error) {
    // Silently fail - don't spam console with errors
  }
}, 1000); // Check every second

// Initial log
log('ALTTP SNI Controller loaded. Connect to begin!');

// ============= EVENT DELEGATION =============
// Add event listener for all buttons using event delegation
document.addEventListener('click', async (e) => {
  // Ignore clicks on input elements (for gift settings modal)
  if (e.target.tagName === 'INPUT' || e.target.closest('input')) return;

  // Ignore clicks on select elements (for gift settings dropdowns)
  if (e.target.tagName === 'SELECT' || e.target.closest('select')) return;

  // Ignore clicks within gift settings tab (to prevent triggering actions during mapping)
  if (e.target.closest('#gift-settings-tab')) return;

  // Check if clicked element is a button with data-action
  const button = e.target.closest('[data-action]');
  if (!button) return;

  // Get action and parameters
  const action = button.dataset.action;
  const value = button.dataset.value;
  const dungeon = button.dataset.dungeon;

  // Disable button temporarily
  button.disabled = true;

  try {
    console.log(`[Button Click] Action: ${action}, Value: ${value}, Dungeon: ${dungeon}`);

    // Route to appropriate function based on action
    switch(action) {
      // Core functions
      case 'addHeart': await addHeart(); break;
      case 'removeHeart': await removeHeart(); break;
      case 'addHeartPiece': await addHeartPiece(); break;
      case 'killPlayer': await killPlayer(); break;
      case 'testMemory': await testMemory(); break;
      case 'toggleInvincibility': await toggleInvincibility(); break;

      // Resources
      case 'setRupees': await setRupees(parseInt(value)); break;
      case 'addRupees': await addRupees(parseInt(value)); break;
      case 'addRupee': await addRupee(); break;
      case 'removeRupee': await removeRupee(); break;
      case 'setBombs': await setBombs(parseInt(value)); break;
      case 'addBomb': await addBomb(); break;
      case 'removeBomb': await removeBomb(); break;
      case 'setArrows': await setArrows(parseInt(value)); break;
      case 'addArrow': await addArrow(); break;
      case 'removeArrow': await removeArrow(); break;

      // Equipment
      case 'setSword': await setSword(parseInt(value)); break;
      case 'setShield': await setShield(parseInt(value)); break;
      case 'setArmor': await setArmor(parseInt(value)); break;
      case 'setGloves': await setGloves(parseInt(value)); break;

      // Toggles
      case 'toggleBoots': await toggleBoots(); break;
      case 'toggleFlippers': await toggleFlippers(); break;
      case 'toggleMoonPearl': await toggleMoonPearl(); break;
      case 'toggleHookshot': await toggleHookshot(); break;
      case 'toggleLamp': await toggleLamp(); break;
      case 'toggleHammer': await toggleHammer(); break;
      case 'toggleBook': await toggleBook(); break;
      case 'toggleBugNet': await toggleBugNet(); break;
      case 'toggleSomaria': await toggleSomaria(); break;
      case 'toggleByrna': await toggleByrna(); break;
      case 'toggleMirror': await toggleMirror(); break;
      case 'toggleBoomerang': await toggleBoomerang(); break;

      // Magic items
      case 'toggleFireRod': await toggleFireRod(); break;
      case 'giveFireRod': await giveFireRod(); break;
      case 'toggleIceRod': await toggleIceRod(); break;
      case 'giveIceRod': await giveIceRod(); break;
      case 'giveCapes': await giveCapes(); break;
      case 'giveFlute': await giveFlute(); break;
      case 'removeFlute': await removeFlute(); break;
      case 'deactivateFlute': await deactivateFlute(); break;
      case 'toggleMedallion': await toggleMedallion(value); break;
      case 'toggleAllMedallions': await toggleAllMedallions(); break;
      case 'giveAllMedallions': await giveAllMedallions(); break;

      // Magic system
      case 'enableMagic': await enableMagic(); break;
      case 'removeMagic': await removeMagic(); break;
      case 'setMagicUpgrade': await setMagicUpgrade(parseInt(value)); break;

      // Bottles
      case 'addBottle': await addBottle(); break;
      case 'removeBottle': await removeBottle(); break;
      case 'fillBottles': await fillBottles(value); break;

      // Hearts
      case 'setHearts': await setHearts(parseInt(value)); break;

      // Progress
      case 'togglePendant': await togglePendant(value); break;
      case 'toggleAllPendants': await toggleAllPendants(); break;
      case 'giveAllPendants': await giveAllPendants(); break;
      case 'toggleCrystal': await toggleCrystal(parseInt(value)); break;
      case 'toggleAllCrystals': await toggleAllCrystals(); break;
      case 'giveAllCrystals': await giveAllCrystals(); break;

      // Keys
      case 'addSmallKey': await addSmallKey(dungeon); break;
      case 'removeSmallKey': await removeSmallKey(dungeon); break;
      case 'toggleBigKey': await toggleBigKey(dungeon); break;
      case 'giveKeys': await giveKeys(dungeon, parseInt(value)); break;
      case 'giveBigKey': await giveBigKey(dungeon); break;

      // Enemy spawning
      case 'spawnEnemy': await spawnEnemy(button.dataset.enemy); break;
      case 'spawnRandomEnemy': await spawnRandomEnemy(); break;
      case 'triggerChickenAttack': await triggerChickenAttack(60); break;
      case 'triggerEnemyWaves': await triggerEnemyWaves(60); break;
      case 'triggerBeeSwarmWaves': await triggerBeeSwarmWaves(60); break;
      case 'makeEnemiesInvisible': await makeEnemiesInvisible(60); break;
      case 'enableInfiniteMagic': await enableInfiniteMagic(60); break;
      case 'enableIceWorld': await enableIceWorld(60); break;
      case 'spawnBossRush': await spawnBossRush(60); break;
      case 'enableItemLock': await enableItemLock(60); break;
      case 'enableGlassCannon': await enableGlassCannon(60); break;
      case 'enableInvertControls': await enableInvertControls(30); break;
      case 'blessingAndCurse': await blessingAndCurse(); break;
      case 'deleteAllSaves': await deleteAllSaves(); break;
      case 'spawnBeeSwarm': await spawnBeeSwarm(); break;

      // Presets
      case 'giveStarterPack': await giveStarterPack(); break;
      case 'giveEndgamePack': await giveEndgamePack(); break;
      case 'getInventory': await getInventory(); break;
      case 'warpEastern': await warpEastern(); break;
      case 'fakeMirror': await fakeMirror(); break;
      case 'chaosDungeonWarp': await chaosDungeonWarp(); break;
      case 'toggleWorld': await toggleWorld(); break;

      // Item Restoration Testing
      case 'testDisableItem': await testDisableItem(button.dataset.item); break;

      default:
        console.error(`[Button Click] Unknown action: ${action}`);
        log(`Unknown action: ${action}`, 'error');
    }
  } catch (error) {
    console.error('[Button Click] Error:', error);
    log(`Error: ${error.message}`, 'error');
  } finally {
    // Re-enable button
    button.disabled = false;
  }
});

// ===========================
// TAB SWITCHING
// ===========================
let giftSettingsInitialized = false;

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tab-btn');
  if (!tabBtn) return;

  const targetTab = tabBtn.dataset.tab;

  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Remove active class from all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Add active class to clicked tab button
  tabBtn.classList.add('active');

  // Add active class to corresponding tab content
  const targetContent = document.getElementById(targetTab);
  if (targetContent) {
    targetContent.classList.add('active');
  }

  // Initialize gift settings on first open
  if (targetTab === 'gift-settings-tab' && !giftSettingsInitialized && typeof openGiftSettings === 'function') {
    openGiftSettings();
    giftSettingsInitialized = true;
  }
});

// ===========================
// SUBTAB SWITCHING
// ===========================
let overlayGiftsPopulated = false;
let giftDatabasePopulated = false;
let giftImagesPopulated = false;
let databaseUpdatesPopulated = false;

document.addEventListener('click', (e) => {
  const subtabBtn = e.target.closest('.subtab-btn');
  if (!subtabBtn) return;

  const targetSubtab = subtabBtn.dataset.subtab;

  // Get the parent tab to scope the subtab switching
  const parentTab = subtabBtn.closest('.tab-content');
  if (!parentTab) return;

  // Remove active class from all subtab buttons within this parent tab
  parentTab.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Remove active class from all subtab contents within this parent tab
  parentTab.querySelectorAll('.subtab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Add active class to clicked subtab button
  subtabBtn.classList.add('active');

  // Add active class to corresponding subtab content
  const targetContent = document.getElementById(targetSubtab);
  if (targetContent) {
    targetContent.classList.add('active');
  }

  // Populate overlay builder - always refresh to show latest mappings
  if (targetSubtab === 'overlay-builder-subtab' && typeof populateOverlayGiftSelection === 'function') {
    populateOverlayGiftSelection();
    // Populate thresholds
    if (typeof populateOverlayThresholdSelection === 'function') {
      populateOverlayThresholdSelection();
    }
    // Load and display the current overlay save path
    if (typeof loadOverlaySavePath === 'function') {
      loadOverlaySavePath();
    }
    // Restore styling settings
    if (typeof restoreOverlayStyleSettings === 'function') {
      setTimeout(() => restoreOverlayStyleSettings(), 30);
    }
    // Restore threshold display mode toggle state
    if (typeof restoreThresholdDisplayModeToggle === 'function') {
      setTimeout(() => restoreThresholdDisplayModeToggle(), 50);
    }
    // Sync threshold gifts to overlay if inline mode is selected
    if (typeof syncThresholdGiftsToOverlay === 'function') {
      setTimeout(() => syncThresholdGiftsToOverlay(), 100);
    }
  }

  if (targetSubtab === 'gift-database-subtab' && !giftDatabasePopulated && typeof populateGiftDatabase === 'function') {
    populateGiftDatabase();
    if (typeof displayCustomGifts === 'function') {
      displayCustomGifts();
    }
    giftDatabasePopulated = true;
  }

  if (targetSubtab === 'database-updates-subtab' && !databaseUpdatesPopulated && typeof initDatabaseUpdatesTab === 'function') {
    initDatabaseUpdatesTab();
    databaseUpdatesPopulated = true;
  }
});

// Listen for SNI auto-connection events
window.sniAPI.onSNIAutoConnected((data) => {
  if (data.success) {
    log('✅ Auto-connected to SNI', 'success');
    updateSNIStatus(true);
  } else {
    log(`⚠️ Auto-connection failed: ${data.error}`, 'warning');
  }
});

// Listen for Lua Connector auto-connection events
window.sniAPI.onLuaAutoConnected((data) => {
  if (data.success) {
    log('✅ Auto-connected to Lua Connector', 'success');
    updateSNIStatus(true);
  } else {
    log(`⚠️ Lua Connector auto-connection failed: ${data.error}`, 'warning');
  }
});

// Listen for HoellStream status changes
window.sniAPI.onHoellStreamStatus((data) => {
  updateHoellStreamStatus(data.connected);
});

// Listen for TikFinity status changes
window.sniAPI.onTikFinityStatus((data) => {
  updateTikFinityStatus(data.connected);

  if (data.connected) {
    log('✅ TikFinity connected', 'success');
  } else {
    log('⚠️ TikFinity disconnected', 'warning');
  }
});

// ============= ACTION CONSOLE =============
// Load gift images from active-gifts.json
let activeGiftImages = null;
async function loadActiveGiftImages() {
  if (activeGiftImages) return activeGiftImages;

  try {
    const result = await window.sniAPI.getActiveGifts();
    if (result.success && result.activeGifts && result.activeGifts.images) {
      activeGiftImages = result.activeGifts.images;
      return activeGiftImages;
    }
    return {};
  } catch (error) {
    console.error('Error loading active gift images:', error);
    return {};
  }
}

// Get gift image URL by name and coin value
function getGiftImageUrl(giftName, giftImages) {
  if (!giftImages) return null;

  // Search through all coin values to find this gift
  for (const coinValue in giftImages) {
    const coinGifts = giftImages[coinValue];
    if (coinGifts && coinGifts[giftName]) {
      const giftData = coinGifts[giftName];

      // Use local image if available
      if (giftData.local) {
        return giftData.local;
      }

      // Fallback to URL
      if (giftData.url) {
        return giftData.url;
      }
    }
  }

  return null;
}

// Populate Action Console with mapped gifts
async function populateActionConsole() {
  const grid = document.getElementById('action-console-grid');
  if (!grid) return;

  try {
    // Load gift mappings, gift images, and custom actions
    const [result, giftImages] = await Promise.all([
      window.sniAPI.loadGiftMappings(),
      loadActiveGiftImages()
    ]);

    await loadCustomActions();

    // Clear grid
    grid.innerHTML = '';

    let hasContent = false;

    // Add gift-mapped actions
    if (result.success && result.mappings) {
      const mappings = result.mappings;
      const mappingsArray = Object.entries(mappings);

      // Create button for each mapped gift
      for (const [giftName, mapping] of mappingsArray) {
        hasContent = true;
      const button = document.createElement('button');
      button.className = 'action-console-button';
      button.dataset.giftAction = mapping.action;
      button.dataset.giftName = giftName;

      // Determine button style based on action type
      if (mapping.action.includes('Roulette') || mapping.action.includes('Random')) {
        button.classList.add('special');
      } else if (mapping.action.includes('Golden') || mapping.action.includes('gold')) {
        button.classList.add('gold');
      } else if (mapping.action.includes('kill') || mapping.action.includes('delete') || mapping.action.includes('Cannon')) {
        button.classList.add('danger');
      }

      // Get gift image URL or fallback to emoji
      const imageUrl = getGiftImageUrl(giftName, giftImages);
      let imageHtml;

      if (imageUrl) {
        imageHtml = `<img src="${imageUrl}" class="gift-image" alt="${giftName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                     <div class="emoji" style="display:none;">🎁</div>`;
      } else {
        // Fallback to emoji if no image found
        let emoji = '🎁';
        const emojiMatch = giftName.match(/[\u{1F300}-\u{1F9FF}]/u);
        if (emojiMatch) {
          emoji = emojiMatch[0];
        }
        imageHtml = `<div class="emoji">${emoji}</div>`;
      }

      // Get action description
      const description = mapping.description || mapping.action || 'Unknown action';

      button.innerHTML = `
        ${imageHtml}
        <div class="label">${giftName}</div>
        <div class="action-label">${description}</div>
      `;

      // Add click handler
      button.addEventListener('click', async () => {
        await executeGiftAction(mapping);
      });

      grid.appendChild(button);
      }
    }

    // Add custom action buttons
    for (const customAction of customActions) {
      hasContent = true;
      const button = document.createElement('button');
      button.className = 'action-console-button';
      button.dataset.customAction = customAction.id;

      button.innerHTML = `
        <div class="emoji">⚡</div>
        <div class="label">${customAction.label}</div>
        <div class="action-label">Quick Action</div>
        <button class="remove-custom-action" data-id="${customAction.id}" style="position: absolute; top: 5px; right: 5px; background: rgba(255,0,0,0.7); border: none; color: white; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">✕</button>
      `;

      // Add click handler for the action
      button.addEventListener('click', async (e) => {
        // Don't execute if clicking the remove button
        if (e.target.classList.contains('remove-custom-action')) {
          return;
        }
        await executeCustomAction(customAction);
      });

      // Add handler for remove button
      const removeBtn = button.querySelector('.remove-custom-action');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCustomAction(customAction.id);
      });

      grid.appendChild(button);
    }

    // Show empty state if no content
    if (!hasContent) {
      grid.innerHTML = '<div class="action-console-empty"><p>No actions added yet. Click "➕ Add Action" to add operations.</p></div>';
    }
  } catch (error) {
    console.error('Error populating action console:', error);
    grid.innerHTML = '<div class="action-console-empty"><p>Error loading actions.</p></div>';
  }
}

// Execute a custom action
async function executeCustomAction(customAction) {
  try {
    // Try to find the element with data-value or data-enemy
    let element = null;
    if (customAction.value) {
      element = document.querySelector(`[data-action="${customAction.action}"][data-value="${customAction.value}"]`);
      if (!element) {
        // Try data-enemy for enemy spawning actions
        element = document.querySelector(`[data-action="${customAction.action}"][data-enemy="${customAction.value}"]`);
      }
    } else {
      element = document.querySelector(`[data-action="${customAction.action}"]`);
    }

    if (element) {
      element.click();
    } else {
      log(`Action ${customAction.label} executed`, 'success');
    }
  } catch (error) {
    console.error('Error executing custom action:', error);
    log(`Error executing ${customAction.label}`, 'error');
  }
}

// Execute a gift action when action console button is clicked
async function executeGiftAction(mapping) {
  try {
    const action = mapping.action;
    const params = mapping.params || {};

    // Route to the appropriate function based on action
    switch (action) {
      case 'addRupees': await addRupees(params.amount || 50); break;
      case 'removeRupees': await removeRupees(params.amount || 50); break;
      case 'addBombs': await addBombs(params.amount || 10); break;
      case 'removeBombs': await removeBombs(params.amount || 10); break;
      case 'addArrows': await addArrows(params.amount || 10); break;
      case 'removeArrows': await removeArrows(params.amount || 10); break;
      case 'addHeart': await addHeart(); break;
      case 'removeHeart': await removeHeart(); break;
      case 'addHeartPiece': await addHeartPiece(); break;
      case 'addHeartContainer': await addHeartContainer(); break;
      case 'removeHeartContainer': await removeHeartContainer(); break;
      case 'killPlayer': await killPlayer(); break;
      case 'damagePlayer': await damagePlayer(params.hearts || 1); break;
      case 'toggleWorld': await toggleWorld(); break;
      case 'triggerChickenAttack': await triggerChickenAttack(params.duration || 60); break;
      case 'triggerEnemyWaves': await triggerEnemyWaves(params.duration || 60); break;
      case 'triggerBeeSwarmWaves': await triggerBeeSwarmWaves(params.duration || 60); break;
      case 'makeEnemiesInvisible': await makeEnemiesInvisible(params.duration || 60); break;
      case 'spawnBossRush': await spawnBossRush(params.duration || 60); break;
      case 'enableItemLock': await enableItemLock(params.duration || 60); break;
      case 'enableGlassCannon': await enableGlassCannon(params.duration || 60); break;
      case 'enableInvertControls': await enableInvertControls(params.duration || 30); break;
      case 'blessingAndCurse': await blessingAndCurse(); break;
      case 'fakeMirror': await fakeMirror(); break;
      case 'chaosDungeonWarp': await chaosDungeonWarp(); break;
      case 'deleteAllSaves': await deleteAllSaves(); break;
      case 'enableInfiniteMagic': await enableInfiniteMagic(params.duration || 60); break;
      case 'enableIceWorld': await enableIceWorld(params.duration || 60); break;
      default:
        log(`Unknown action in action console: ${action}`, 'error');
    }
  } catch (error) {
    console.error('Error executing gift action:', error);
    log(`Error: ${error.message}`, 'error');
  }
}

// Populate action console on page load
// Activity log storage
let activityLogEntries = [];
const MAX_ACTIVITY_LOG_ENTRIES = 20;

// Add gift activity entry
function addActivityLogEntry(giftData) {
  const { giftName, amount, displayName, source, timestamp } = giftData;

  // Add to beginning of array
  activityLogEntries.unshift({
    giftName,
    amount: amount || 1,
    displayName,
    source,
    timestamp: timestamp || new Date().toISOString()
  });

  // Limit to max entries
  if (activityLogEntries.length > MAX_ACTIVITY_LOG_ENTRIES) {
    activityLogEntries = activityLogEntries.slice(0, MAX_ACTIVITY_LOG_ENTRIES);
  }

  // Update display
  updateActivityLogDisplay();
}

// Update activity log display
function updateActivityLogDisplay() {
  const container = document.getElementById('action-console-activity-list');
  if (!container) return;

  if (activityLogEntries.length === 0) {
    container.innerHTML = '<div style="color: rgba(255,255,255,0.4); font-size: 12px;">No gifts received yet</div>';
    return;
  }

  container.innerHTML = '';

  activityLogEntries.forEach(entry => {
    const div = document.createElement('div');
    div.className = `activity-log-item ${entry.source}`;

    // Format timestamp
    const time = new Date(entry.timestamp);
    const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const timeSpan = document.createElement('span');
    timeSpan.className = 'activity-log-time';
    timeSpan.textContent = timeStr;
    div.appendChild(timeSpan);

    // Source
    const sourceSpan = document.createElement('span');
    sourceSpan.className = 'activity-log-source';
    sourceSpan.textContent = entry.source === 'hoellstream' ? 'HoellStream' : entry.source === 'tikfinity' ? 'TikFinity' : entry.source;
    div.appendChild(sourceSpan);

    // Gift name and amount
    const giftSpan = document.createElement('span');
    giftSpan.className = 'activity-log-gift';
    const amountText = entry.amount > 1 ? ` x${entry.amount}` : '';
    giftSpan.textContent = `${entry.giftName}${amountText}`;
    div.appendChild(giftSpan);

    // Sender
    const senderSpan = document.createElement('span');
    senderSpan.className = 'activity-log-sender';
    senderSpan.textContent = `from ${entry.displayName}`;
    div.appendChild(senderSpan);

    container.appendChild(div);
  });

  // Auto-scroll to top (newest entry)
  container.scrollTop = 0;
}

// Update Action Console threshold display
async function updateActionConsoleThresholds() {
  const container = document.getElementById('action-console-threshold-list');
  if (!container) return;

  try {
    const result = await window.sniAPI.getThresholdStatus();
    if (!result.success) return;

    const status = result.status || [];

    if (status.length === 0) {
      container.innerHTML = '<div style="color: rgba(255,255,255,0.4); font-size: 12px;">No active thresholds</div>';
      return;
    }

    container.innerHTML = '';

    status.forEach(item => {
      const div = document.createElement('div');
      div.className = 'threshold-item';

      const isValueBased = item.giftName === '__VALUE_TOTAL__';

      // Gift name
      const nameDiv = document.createElement('div');
      nameDiv.className = 'threshold-name';
      if (isValueBased) {
        nameDiv.innerHTML = `<span style="color: #a78bfa;">💎 Coin Value</span>`;
      } else {
        nameDiv.innerHTML = `<span style="color: #60a5fa;">${item.giftName}</span>`;
      }
      div.appendChild(nameDiv);

      // Progress bar
      const progressDiv = document.createElement('div');
      progressDiv.className = 'threshold-progress';

      const progressBarBg = document.createElement('div');
      progressBarBg.className = 'threshold-progress-bar-bg';

      const progressBarFill = document.createElement('div');
      progressBarFill.className = 'threshold-progress-bar-fill';
      const percentage = (item.current / item.target) * 100;
      progressBarFill.style.background = percentage >= 100 ? '#10b981' : (isValueBased ? '#a78bfa' : '#3b82f6');
      progressBarFill.style.width = `${Math.min(percentage, 100)}%`;
      progressBarBg.appendChild(progressBarFill);
      progressDiv.appendChild(progressBarBg);

      const progressText = document.createElement('div');
      progressText.className = 'threshold-progress-text';
      if (isValueBased) {
        progressText.textContent = `${item.current.toLocaleString()} / ${item.target.toLocaleString()} coins`;
      } else {
        progressText.textContent = `${item.current} / ${item.target}`;
      }
      progressDiv.appendChild(progressText);

      div.appendChild(progressDiv);
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error updating action console thresholds:', error);
  }
}

// Toggle collapsible sections (main window)
function toggleMainSection(sectionName) {
  const content = document.getElementById(`action-console-${sectionName}-list`);
  const toggle = document.getElementById(`main-${sectionName}-toggle`);

  if (!content || !toggle) return;

  const isCollapsed = content.classList.contains('collapsed');

  if (isCollapsed) {
    content.classList.remove('collapsed');
    toggle.classList.remove('collapsed');
    toggle.textContent = '▼';
    localStorage.setItem(`mainConsole-${sectionName}-collapsed`, 'false');
  } else {
    content.classList.add('collapsed');
    toggle.classList.add('collapsed');
    toggle.textContent = '▶';
    localStorage.setItem(`mainConsole-${sectionName}-collapsed`, 'true');
  }
}

// Toggle collapsible control sections
function toggleControlSection(sectionName) {
  console.log('toggleControlSection called with:', sectionName);
  const content = document.getElementById(`${sectionName}-content`);
  const toggle = document.getElementById(`${sectionName}-toggle`);

  console.log('Elements found:', { content, toggle });

  if (!content || !toggle) {
    console.warn('Missing elements for section:', sectionName);
    return;
  }

  const isCollapsed = content.classList.contains('collapsed');
  console.log('Current state - isCollapsed:', isCollapsed);

  if (isCollapsed) {
    content.classList.remove('collapsed');
    toggle.classList.remove('collapsed');
    toggle.textContent = '▼';
    localStorage.setItem(`controlSection-${sectionName}-collapsed`, 'false');
  } else {
    content.classList.add('collapsed');
    toggle.classList.add('collapsed');
    toggle.textContent = '▶';
    localStorage.setItem(`controlSection-${sectionName}-collapsed`, 'true');
  }

  console.log('Toggled to:', content.classList.contains('collapsed') ? 'collapsed' : 'expanded');
}

// Make functions globally accessible for onclick handlers
window.toggleControlSection = toggleControlSection;
window.toggleMainSection = toggleMainSection;

// Custom Action Console Actions Management
let customActions = [];

async function loadCustomActions() {
  const saved = localStorage.getItem('customActionConsoleActions');
  if (saved) {
    try {
      customActions = JSON.parse(saved);
    } catch (error) {
      console.error('Error loading custom actions:', error);
      customActions = [];
    }
  }
  return customActions;
}

function saveCustomActions() {
  localStorage.setItem('customActionConsoleActions', JSON.stringify(customActions));
}

function addCustomAction(action, value, label) {
  const actionId = `${action}-${value || 'novalue'}-${Date.now()}`;
  customActions.push({
    id: actionId,
    action,
    value,
    label
  });
  saveCustomActions();
  populateActionConsole();
}

function removeCustomAction(actionId) {
  customActions = customActions.filter(a => a.id !== actionId);
  saveCustomActions();
  populateActionConsole();
}

// UI Scaling System
function initializeUIScaling() {
  const sizeSlider = document.getElementById('ui-size-slider');
  const sizeValue = document.getElementById('ui-size-value');

  if (!sizeSlider || !sizeValue) return;

  // Load saved UI size
  const savedSize = localStorage.getItem('uiSize') || '100';
  sizeSlider.value = savedSize;
  applyUISize(parseInt(savedSize));

  // Handle slider changes
  sizeSlider.addEventListener('input', (e) => {
    const size = parseInt(e.target.value);
    applyUISize(size);
    localStorage.setItem('uiSize', size.toString());
  });
}

function applyUISize(size) {
  const scale = size / 100;
  document.body.style.setProperty('--ui-scale', scale);
  const sizeValue = document.getElementById('ui-size-value');
  if (sizeValue) {
    sizeValue.textContent = `${size}%`;
  }
}

// Theme System
function initializeThemeSystem() {
  // Load saved theme or default to deep-blue
  const savedTheme = localStorage.getItem('hoellpwn-theme') || 'deep-blue';
  applyTheme(savedTheme);

  // Set up theme option click handlers
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      applyTheme(theme);
      localStorage.setItem('hoellpwn-theme', theme);

      // Update active state
      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
    });
  });
}

function applyTheme(themeName) {
  // Remove all theme data attributes
  document.body.removeAttribute('data-theme');

  // Apply new theme (if not default deep-blue)
  if (themeName !== 'deep-blue') {
    document.body.setAttribute('data-theme', themeName);
  }

  // Update active state in dropdown
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    if (option.dataset.theme === themeName) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Theme System
  initializeThemeSystem();

  // UI Scaling System
  initializeUIScaling();

  populateActionConsole();
  updateActionConsoleThresholds();
  updateActivityLogDisplay();

  // Update thresholds every 2 seconds
  setInterval(updateActionConsoleThresholds, 2000);

  // Listen for gift activity from main process
  if (window.sniAPI && window.sniAPI.onGiftActivity) {
    window.sniAPI.onGiftActivity((giftData) => {
      addActivityLogEntry(giftData);
    });
  }

  // Pop-out Action Console button
  const popoutBtn = document.getElementById('popout-action-console-btn');
  if (popoutBtn) {
    popoutBtn.addEventListener('click', async () => {
      try {
        await window.sniAPI.openActionConsolePopup();
      } catch (error) {
        console.error('Error opening action console popup:', error);
        log('Error opening action console popup', 'error');
      }
    });
  }

  // Add click event listeners to all collapsible headers
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  collapsibleHeaders.forEach(header => {
    const sectionName = header.getAttribute('data-section');
    if (sectionName) {
      header.addEventListener('click', (e) => {
        // Don't toggle if clicking buttons
        if (e.target.id === 'popout-action-console-btn' || e.target.closest('#popout-action-console-btn') ||
            e.target.id === 'add-action-btn' || e.target.closest('#add-action-btn')) {
          return;
        }
        toggleControlSection(sectionName);
      });
    }
  });

  // Add Action modal functionality
  const addActionBtn = document.getElementById('add-action-btn');
  const addActionModal = document.getElementById('add-action-modal');
  const closeAddActionModal = document.getElementById('close-add-action-modal');
  const cancelAddAction = document.getElementById('cancel-add-action');

  if (addActionBtn && addActionModal) {
    addActionBtn.addEventListener('click', () => {
      addActionModal.style.display = 'flex';
    });

    closeAddActionModal.addEventListener('click', () => {
      addActionModal.style.display = 'none';
    });

    cancelAddAction.addEventListener('click', () => {
      addActionModal.style.display = 'none';
    });

    // Close modal when clicking outside
    addActionModal.addEventListener('click', (e) => {
      if (e.target === addActionModal) {
        addActionModal.style.display = 'none';
      }
    });

    // Action select buttons
    const actionSelectBtns = document.querySelectorAll('.action-select-btn');
    actionSelectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const value = btn.dataset.value;
        const enemy = btn.dataset.enemy;
        const label = btn.dataset.label;

        addCustomAction(action, value || enemy, label);
        addActionModal.style.display = 'none';
        log(`Added ${label} to Action Console`, 'success');
      });
    });
  }

  // Restore collapsed state for control sections
  ['action-console', 'core', 'resources', 'equipment', 'toggle-items', 'pendants-crystals', 'dungeon-keys', 'preset-loadouts', 'enemy-spawning', 'item-disable-testing'].forEach(sectionName => {
    const isCollapsed = localStorage.getItem(`controlSection-${sectionName}-collapsed`) === 'true';
    if (isCollapsed) {
      const content = document.getElementById(`${sectionName}-content`);
      const toggle = document.getElementById(`${sectionName}-toggle`);
      if (content && toggle) {
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
        toggle.textContent = '▶';
      }
    }
  });
});