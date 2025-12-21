// UI Elements
const connectBtn = document.getElementById('connect-btn');
const statusDiv = document.getElementById('status');
const deviceSelect = document.getElementById('device-select');
const controlsSection = document.getElementById('controls');
const logDiv = document.getElementById('log');

// Control buttons
const addHeartBtn = document.getElementById('add-heart-btn');
const removeHeartBtn = document.getElementById('remove-heart-btn');
const killBtn = document.getElementById('kill-btn');
const warpBtn = document.getElementById('warp-btn');
const testBtn = document.getElementById('test-btn');

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

  // Keep only last 10 entries
  while (logDiv.children.length > 10) {
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
        devices = result.devices; // Store devices array
        deviceSelect.style.display = 'block';
        deviceSelect.innerHTML = '<option value="">Select a device...</option>';

        result.devices.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = index; // Use index to reference device
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

        // Enable all control buttons
        addHeartBtn.disabled = false;
        removeHeartBtn.disabled = false;
        killBtn.disabled = false;
        warpBtn.disabled = false;
        testBtn.disabled = false;
      }
    } catch (error) {
      log(`Failed to select device: ${error.message}`, 'error');
    }
  } else {
    controlsSection.style.display = 'none';
    selectedDevice = null;

    // Disable all control buttons
    addHeartBtn.disabled = true;
    removeHeartBtn.disabled = true;
    killBtn.disabled = true;
    warpBtn.disabled = true;
    testBtn.disabled = true;
  }
});

// Control button handlers
addHeartBtn.addEventListener('click', async () => {
  if (!selectedDevice) return;

  addHeartBtn.disabled = true;
  try {
    const result = await window.sniAPI.addHeart();
    if (result.success) {
      log(`Added heart container! New max: ${result.newMax} hearts`, 'success');
    } else {
      const errorMsg = result.error || 'Operation failed';
      if (errorMsg.includes('readonly')) {
        log('Failed to add heart: Memory is read-only. Make sure the game is running and not paused.', 'error');
      } else if (errorMsg.includes('maximum')) {
        log('Cannot add more hearts: Already at maximum (20 hearts)', 'warning');
      } else {
        log(`Failed to add heart: ${errorMsg}`, 'error');
      }
    }
  } catch (error) {
    log(`Failed to add heart: ${error.message}`, 'error');
  } finally {
    addHeartBtn.disabled = false;
  }
});

removeHeartBtn.addEventListener('click', async () => {
  if (!selectedDevice) return;

  removeHeartBtn.disabled = true;
  try {
    const result = await window.sniAPI.removeHeart();
    if (result.success) {
      log(`Removed heart container! New max: ${result.newMax} hearts`, 'success');
    } else {
      const errorMsg = result.error || 'Operation failed';
      if (errorMsg.includes('readonly')) {
        log('Failed to remove heart: Memory is read-only. Make sure the game is running and not paused.', 'error');
      } else if (errorMsg.includes('minimum')) {
        log('Cannot remove more hearts: Already at minimum (3 hearts)', 'warning');
      } else {
        log(`Failed to remove heart: ${errorMsg}`, 'error');
      }
    }
  } catch (error) {
    log(`Failed to remove heart: ${error.message}`, 'error');
  } finally {
    removeHeartBtn.disabled = false;
  }
});

killBtn.addEventListener('click', async () => {
  if (!selectedDevice) return;

  if (!confirm('Are you sure you want to KO the player?')) return;

  killBtn.disabled = true;
  try {
    const result = await window.sniAPI.killPlayer();
    if (result.success) {
      log('Player KO\'d!', 'warning');
    } else {
      throw new Error(result.error || 'Operation failed');
    }
  } catch (error) {
    log(`Failed to KO player: ${error.message}`, 'error');
  } finally {
    killBtn.disabled = false;
  }
});

warpBtn.addEventListener('click', async () => {
  if (!selectedDevice) return;

  warpBtn.disabled = true;
  try {
    const result = await window.sniAPI.warpEastern();
    if (result.success) {
      log('Warped to Eastern Palace! (May need to move for room to load)', 'success');
    } else {
      throw new Error(result.error || 'Operation failed');
    }
  } catch (error) {
    log(`Failed to warp: ${error.message}`, 'error');
  } finally {
    warpBtn.disabled = false;
  }
});

// Test button handler
testBtn.addEventListener('click', async () => {
  if (!selectedDevice) return;

  testBtn.disabled = true;
  log('Running memory access diagnostics...', 'info');

  try {
    const result = await window.sniAPI.testMemory();
    if (result.success) {
      log('Memory test completed. Check developer console for details.', 'success');
    } else {
      throw new Error(result.error || 'Test failed');
    }
  } catch (error) {
    log(`Memory test failed: ${error.message}`, 'error');
  } finally {
    testBtn.disabled = false;
  }
});

// Initial state
addHeartBtn.disabled = true;
removeHeartBtn.disabled = true;
killBtn.disabled = true;
warpBtn.disabled = true;
testBtn.disabled = true;

// Initial log
log('Application started. Connect to SNI to begin.');