// UI Elements
const connectBtn = document.getElementById('connect-btn');
const statusDiv = document.getElementById('status');
const deviceSelect = document.getElementById('device-select');
const controlsSection = document.getElementById('controls');
const logDiv = document.getElementById('log');

// State
let connected = false;
let selectedDevice = null;
let devices = [];

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
      }
    } catch (error) {
      log(`Failed to select device: ${error.message}`, 'error');
    }
  } else {
    controlsSection.style.display = 'none';
    selectedDevice = null;
  }
});

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

async function triggerChickenAttack() {
  try {
    const result = await window.sniAPI.triggerChickenAttack();
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

async function triggerEnemyWaves() {
  try {
    const result = await window.sniAPI.triggerEnemyWaves();
    if (result.success) {
      log(result.message, 'warning');
    } else {
      log(`Failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

async function triggerBeeSwarmWaves() {
  try {
    const result = await window.sniAPI.triggerBeeSwarmWaves();
    if (result.success) {
      log(result.message, 'warning');
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
      case 'triggerChickenAttack': await triggerChickenAttack(); break;
      case 'triggerEnemyWaves': await triggerEnemyWaves(); break;
      case 'triggerBeeSwarmWaves': await triggerBeeSwarmWaves(); break;
      case 'spawnBeeSwarm': await spawnBeeSwarm(); break;

      // Presets
      case 'giveStarterPack': await giveStarterPack(); break;
      case 'giveEndgamePack': await giveEndgamePack(); break;
      case 'getInventory': await getInventory(); break;
      case 'warpEastern': await warpEastern(); break;

      // Item Restoration Testing
      case 'testDisableItem': await testDisableItem(button.dataset.item); break;

      default:
        log(`Unknown action: ${action}`, 'error');
    }
  } catch (error) {
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

  // Populate content on first open
  if (targetSubtab === 'overlay-builder-subtab' && !overlayGiftsPopulated && typeof populateOverlayGiftSelection === 'function') {
    populateOverlayGiftSelection();
    overlayGiftsPopulated = true;
  }

  if (targetSubtab === 'gift-database-subtab' && !giftDatabasePopulated && typeof populateGiftDatabase === 'function') {
    populateGiftDatabase();
    if (typeof displayCustomGifts === 'function') {
      displayCustomGifts();
    }
    giftDatabasePopulated = true;
  }

  if (targetSubtab === 'gift-images-subtab' && !giftImagesPopulated && typeof populateGiftImagesList === 'function') {
    populateGiftImagesList();
    giftImagesPopulated = true;
  }
});