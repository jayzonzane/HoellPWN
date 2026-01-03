// UI Elements
const connectBtn = document.getElementById('connect-btn');
const statusDiv = document.getElementById('status');
const deviceSelect = document.getElementById('device-select');
const controlsSection = document.getElementById('controls-tab');
const logDiv = document.getElementById('log');
const sniStatusLight = document.getElementById('sni-status-light');
const hoellStreamStatusLight = document.getElementById('hoellstream-status-light');

// State
let connected = false;
let selectedDevice = null;
let devices = [];

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

// Toast Notification System (HoellCC)
function showOperationToast(operationName, success = true, message = '') {
  const container = document.getElementById('operation-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 12px 16px;
    background: ${success ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease-out;
    min-width: 280px;
  `;

  const icon = success ? '✅' : '❌';
  const actionText = operationName.replace(/([A-Z])/g, ' $1').trim();
  const displayMessage = message || (success ? `${actionText} executed` : `${actionText} failed`);

  toast.innerHTML = `
    <span style="font-size: 18px;">${icon}</span>
    <div style="flex: 1;">
      <div style="font-weight: 600;">${actionText}</div>
      ${message ? `<div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">${message}</div>` : ''}
    </div>
  `;

  container.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Add CSS animations for toasts
if (!document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Connection handling
connectBtn.addEventListener('click', async () => {
  const host = document.getElementById('host').value || 'localhost';
  const port = document.getElementById('port').value || '8191';

  connectBtn.disabled = true;
  statusDiv.textContent = 'Connecting...';
  statusDiv.className = 'status connecting';
  log(`Connecting to SNI at ${host}:${port}...`);

  try {
    const result = await window.sniAPI.connect(host, port);

    if (result.success) {
      connected = true;
      statusDiv.textContent = 'Connected to SNI';
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

        // Auto-select if only one device
        if (result.devices.length === 1) {
          deviceSelect.value = 0;
          deviceSelect.dispatchEvent(new Event('change'));
        }
      } else {
        log('No devices found. Make sure RetroArch is running with a game loaded.', 'warning');
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
        log(`Selected device: ${device.displayName || device.uri}`, 'success');

        // Check for MarioMod patch (HoellCC spawning requirement)
        checkMarioModPatch();
      }
    } catch (error) {
      log(`Failed to select device: ${error.message}`, 'error');
    }
  } else {
    controlsSection.style.display = 'none';
    selectedDevice = null;
  }
});

// MarioMod Patch Detection (HoellCC)
async function checkMarioModPatch() {
  try {
    const result = await window.sniAPI.checkMarioModPatch();
    const banner = document.getElementById('mariomod-warning-banner');

    if (result.success) {
      if (result.installed) {
        // MarioMod detected - hide warning
        banner.style.display = 'none';
        log('✅ MarioMod patch detected - All spawn operations available', 'success');
      } else {
        // MarioMod NOT detected - show warning
        banner.style.display = 'block';
        log('⚠️ MarioMod patch not detected - Spawn operations unavailable', 'warning');
      }
    } else {
      // Error checking - hide banner
      banner.style.display = 'none';
      log(`MarioMod check failed: ${result.error}`, 'warning');
    }
  } catch (error) {
    log(`Error checking MarioMod: ${error.message}`, 'error');
  }
}

// Recheck MarioMod button handler
document.addEventListener('DOMContentLoaded', () => {
  const recheckBtn = document.getElementById('recheck-mariomod');
  if (recheckBtn) {
    recheckBtn.addEventListener('click', () => {
      log('🔄 Rechecking MarioMod patch...', 'info');
      checkMarioModPatch();
    });
  }

  // Quick Guide toggle handler
  const toggleGuideBtn = document.getElementById('toggle-hoellcc-guide');
  const guidePanel = document.getElementById('hoellcc-quick-guide');
  if (toggleGuideBtn && guidePanel) {
    toggleGuideBtn.addEventListener('click', () => {
      const isVisible = guidePanel.style.display !== 'none';
      guidePanel.style.display = isVisible ? 'none' : 'block';
      toggleGuideBtn.textContent = isVisible ? '📖 Quick Guide' : '📕 Hide Guide';
    });
  }

  // Operation Search/Filter
  const searchInput = document.getElementById('operation-search');
  const searchCount = document.getElementById('search-count');
  const searchResultsDiv = document.getElementById('search-results-count');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      if (query === '') {
        // Reset: show all operations and categories
        document.querySelectorAll('.action-item').forEach(item => {
          item.style.display = '';
        });
        document.querySelectorAll('.settings-category').forEach(cat => {
          cat.style.display = '';
        });
        searchResultsDiv.style.display = 'none';
        return;
      }

      // Search through all action items
      let matchCount = 0;
      const categories = new Set();

      document.querySelectorAll('.action-item').forEach(item => {
        const actionName = item.querySelector('.action-name');
        const giftInput = item.querySelector('.gift-input');

        if (actionName) {
          const nameText = actionName.textContent.toLowerCase();
          const actionAttr = giftInput ? giftInput.getAttribute('data-action') : '';
          const actionText = actionAttr ? actionAttr.toLowerCase() : '';

          const matches = nameText.includes(query) || actionText.includes(query);

          if (matches) {
            item.style.display = '';
            matchCount++;

            // Find and mark the parent category
            const parentCategory = item.closest('.settings-category');
            if (parentCategory) {
              categories.add(parentCategory);
            }
          } else {
            item.style.display = 'none';
          }
        }
      });

      // Show/hide categories based on whether they have matches
      document.querySelectorAll('.settings-category').forEach(cat => {
        if (categories.has(cat)) {
          cat.style.display = '';
        } else {
          cat.style.display = 'none';
        }
      });

      // Update results count
      if (searchCount) {
        searchCount.textContent = matchCount;
      }
      searchResultsDiv.style.display = matchCount > 0 || query ? 'block' : 'none';

      // Log search
      if (query && matchCount > 0) {
        log(`🔍 Found ${matchCount} operations matching "${query}"`, 'info');
      }
    });

    // Clear search on Escape key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
      }
    });
  }
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
    console.log(`[Button Click] Action: ${action}, Value: ${value}`);

    // Handle legacy killPlayer action (for compatibility)
    if (action === 'killPlayer') {
      await killPlayer();
    }
    // All other actions are SMW operations - use generic handler
    else {
      // Get parameters from button dataset (check both data-amount and data-value for coins)
      const duration = button.dataset.duration ? parseInt(button.dataset.duration) : undefined;
      const amount = button.dataset.amount ? parseInt(button.dataset.amount) :
                     button.dataset.value ? parseInt(button.dataset.value) : undefined;
      const color = button.dataset.color ? parseInt(button.dataset.color) : undefined;
      const bossType = button.dataset.bossType ? parseInt(button.dataset.bossType) : undefined;

      // Build arguments array based on what's available
      const args = [];
      if (amount !== undefined) args.push(amount);
      if (duration !== undefined) args.push(duration);
      if (color !== undefined) args.push(color);
      if (bossType !== undefined) args.push(bossType);

      // Execute the SMW operation
      const result = await window.sniAPI.executeSMWOperation(action, ...args);

      if (result.success) {
        log(`${action} executed successfully`, 'success');
      } else {
        log(`Failed: ${result.error}`, 'error');
      }
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

// Listen for HoellStream status changes
window.sniAPI.onHoellStreamStatus((data) => {
  updateHoellStreamStatus(data.connected);
  if (data.connected) {
    log('✅ HoellStream connected', 'success');
  } else {
    log('⚠️ HoellStream disconnected', 'warning');
  }
});