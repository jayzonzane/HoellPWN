// Threshold Manager - Handle threshold/accumulator configuration and display

// Track threshold configurations
let thresholdConfigs = {};

// Available actions for thresholds (SMW actions)
const THRESHOLD_ACTIONS = [
  // Core Actions
  { action: 'killPlayer', name: '💀 KO Mario', params: [] },
  { action: 'addLife', name: '💚 Add Life', params: [] },
  { action: 'removeLife', name: '💔 Remove Life', params: [] },
  { action: 'addCoins', name: '🪙 Add Coins', params: [{key: 'amount', label: 'Amount', type: 'number', default: 10}] },
  { action: 'removeCoins', name: '🪙 Remove Coins', params: [{key: 'amount', label: 'Amount', type: 'number', default: 10}] },

  // Power-Ups
  { action: 'giveMushroom', name: '🍄 Give Mushroom', params: [] },
  { action: 'giveFireFlower', name: '🔥 Give Fire Flower', params: [] },
  { action: 'giveCapeFeather', name: '🪶 Give Cape Feather', params: [] },
  { action: 'giveStarman', name: '⭐ Give Star Power', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'removePowerup', name: '⬇️ Downgrade Power-Up', params: [] },
  { action: 'activatePSwitch', name: '⏱️ Activate P-Switch', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 9}] },

  // Yoshi
  { action: 'giveYoshi', name: '💚 Give Yoshi', params: [{key: 'color', label: 'Color (0-3)', type: 'number', default: 0}] },
  { action: 'removeYoshi', name: '🚫 Remove Yoshi', params: [] },

  // Individual Enemy Spawns
  { action: 'spawnRandomEnemy', name: '🎲 Spawn Random Enemy', params: [] },
  { action: 'spawnBooCircle', name: '👻 Spawn Boo Circle', params: [] },
  { action: 'spawnThwomp', name: '🗿 Spawn Thwomp', params: [] },
  { action: 'spawnCharginChuck', name: '🏈 Spawn Chargin\' Chuck', params: [] },
  { action: 'spawnBobOmb', name: '💣 Spawn Bob-omb', params: [] },
  { action: 'spawnMagikoopa', name: '🧙 Spawn Magikoopa', params: [] },
  { action: 'spawnDryBones', name: '💀 Spawn Dry Bones', params: [] },
  { action: 'spawnRex', name: '🦖 Spawn Rex', params: [] },
  { action: 'spawnWiggler', name: '🐛 Spawn Wiggler', params: [] },
  { action: 'clearAllEnemies', name: '🗑️ Clear All Enemies', params: [] },

  // Enemy Waves
  { action: 'spawnEnemyWave', name: '🌊 Enemy Wave', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'spawnKoopaWave', name: '🐢 Koopa Wave', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'spawnBuzzyBeetleWave', name: '🐞 Buzzy Beetle Wave', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'spawnPiranhaPlantWave', name: '🌺 Piranha Plant Wave', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'spawnBulletBillBarrage', name: '🚀 Bullet Bill Barrage', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 15}] },
  { action: 'spawnBoss', name: '🐉 Spawn Boss', params: [{key: 'bossType', label: 'Boss (reznor/bowser)', type: 'text', default: 'reznor'}] },

  // Enemy Effects
  { action: 'makeEnemiesInvisible', name: '👁️ Invisible Enemies', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'doubleEnemySpeed', name: '⚡ Double Enemy Speed', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },

  // Level Warping
  { action: 'warpToWorld1', name: '🏝️ Warp to World 1', params: [] },
  { action: 'warpToWorld2', name: '🍩 Warp to World 2', params: [] },
  { action: 'warpToWorld3', name: '🏔️ Warp to World 3', params: [] },
  { action: 'warpToWorld4', name: '🌉 Warp to World 4', params: [] },
  { action: 'warpToWorld5', name: '🌲 Warp to World 5', params: [] },
  { action: 'warpToWorld6', name: '🍫 Warp to World 6', params: [] },
  { action: 'warpToWorld7', name: '🌋 Warp to World 7', params: [] },
  { action: 'warpToSpecialWorld', name: '⭐ Warp to Star World', params: [] },
  { action: 'warpToBowserCastle', name: '🏰 Warp to Bowser\'s Castle', params: [] },
  { action: 'warpToRandomLevel', name: '🎲 Random Level Warp', params: [] },

  // Physics Chaos
  { action: 'halfSpeed', name: '🐌 Half Speed', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'doubleSpeed', name: '⚡ Double Speed', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'moonJump', name: '🌙 Moon Jump', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'tinyJump', name: '🦐 Tiny Jump', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'lowGravity', name: '🪐 Low Gravity', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'highGravity', name: '🪨 High Gravity', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'reverseControls', name: '🔄 Reverse Controls', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'enableIcePhysics', name: '❄️ Ice Physics', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'disableRunning', name: '🚫 Disable Running', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'forceContinuousRun', name: '🏃 Force Continuous Run', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'randomPhysicsChaos', name: '🎲 Random Physics Chaos', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] }
];

// Initialize threshold manager
async function initThresholdManager() {
  console.log('🎯 Initializing Threshold Manager...');

  // Load threshold configs
  await loadThresholdConfigs();

  // Set up event listeners
  document.getElementById('add-threshold').addEventListener('click', addThreshold);
  document.getElementById('reset-all-thresholds').addEventListener('click', resetAllThresholds);

  // Start progress update interval (every 2 seconds)
  setInterval(updateThresholdProgress, 2000);
  updateThresholdProgress(); // Initial update

  console.log('✅ Threshold Manager initialized');
}

// Load threshold configs from storage
async function loadThresholdConfigs() {
  try {
    const result = await window.sniAPI.loadThresholdConfigs();
    if (result.success) {
      thresholdConfigs = result.thresholds || {};
      console.log(`📂 Loaded ${Object.keys(thresholdConfigs).length} threshold configurations`);
      renderThresholdConfigs();
    } else {
      console.error('Failed to load threshold configs:', result.error);
      thresholdConfigs = {};
    }
  } catch (error) {
    console.error('Error loading threshold configs:', error);
    thresholdConfigs = {};
  }
}

// Save threshold configs to storage
async function saveThresholdConfigs() {
  try {
    const result = await window.sniAPI.saveThresholdConfigs(thresholdConfigs);
    if (result.success) {
      console.log(`💾 Saved ${result.count} threshold configurations`);

      // Reload into poller
      const reloadResult = await window.sniAPI.reloadThresholdConfigs();
      if (reloadResult.success) {
        console.log(`🔄 Reloaded ${reloadResult.count} threshold configs into poller`);
      }

      return true;
    } else {
      console.error('Failed to save threshold configs:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error saving threshold configs:', error);
    return false;
  }
}

// Render threshold configuration list
function renderThresholdConfigs() {
  const container = document.getElementById('threshold-config-list');

  if (Object.keys(thresholdConfigs).length === 0) {
    container.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-style: italic;">No thresholds configured. Click "Add Threshold" to create one.</div>';
    return;
  }

  container.innerHTML = '';

  Object.entries(thresholdConfigs).forEach(([giftName, config]) => {
    const item = createThresholdConfigItem(giftName, config);
    container.appendChild(item);
  });
}

// Create a threshold config item
function createThresholdConfigItem(giftName, config) {
  const div = document.createElement('div');
  div.className = 'threshold-config-item';
  div.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px;';

  const isValueBased = config.type === 'value';

  // Type/Name
  const nameDiv = document.createElement('div');
  nameDiv.style.cssText = 'flex: 1; min-width: 150px;';
  if (isValueBased) {
    nameDiv.innerHTML = `<strong style="color: #a78bfa;">💎 Total Coin Value</strong>`;
  } else {
    nameDiv.innerHTML = `<strong style="color: #60a5fa;">${giftName}</strong>`;
  }
  div.appendChild(nameDiv);

  // Target
  const targetDiv = document.createElement('div');
  targetDiv.style.cssText = 'flex: 0 0 120px;';
  if (isValueBased) {
    targetDiv.innerHTML = `<span style="color: rgba(255,255,255,0.7);">Target:</span> <strong style="color: #fbbf24;">${config.target.toLocaleString()} coins</strong>`;
  } else {
    targetDiv.innerHTML = `<span style="color: rgba(255,255,255,0.7);">Target:</span> <strong style="color: #fbbf24;">${config.target}x</strong>`;
  }
  div.appendChild(targetDiv);

  // Action
  const actionDiv = document.createElement('div');
  actionDiv.style.cssText = 'flex: 2; min-width: 200px;';
  const actionInfo = THRESHOLD_ACTIONS.find(a => a.action === config.action);
  actionDiv.innerHTML = `<span style="color: rgba(255,255,255,0.7);">→</span> <strong>${actionInfo ? actionInfo.name : config.action}</strong>`;
  div.appendChild(actionDiv);

  // Description/params
  if (config.params && Object.keys(config.params).length > 0) {
    const paramsDiv = document.createElement('div');
    paramsDiv.style.cssText = 'flex: 1; color: rgba(255,255,255,0.6); font-size: 13px;';
    const paramsText = Object.entries(config.params).map(([k, v]) => `${k}: ${v}`).join(', ');
    paramsDiv.textContent = `(${paramsText})`;
    div.appendChild(paramsDiv);
  }

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-reset';
  deleteBtn.style.cssText = 'background: #ef4444; padding: 6px 12px; font-size: 13px;';
  deleteBtn.textContent = '🗑️ Delete';
  deleteBtn.addEventListener('click', async () => {
    const confirmMsg = isValueBased ?
      'Delete total coin value threshold?' :
      `Delete threshold for "${giftName}"?`;
    if (confirm(confirmMsg)) {
      delete thresholdConfigs[giftName];
      await saveThresholdConfigs();
      renderThresholdConfigs();
      updateThresholdProgress();
    }
  });
  div.appendChild(deleteBtn);

  return div;
}

// Build gift dropdown options
function buildGiftDropdownOptions() {
  if (typeof TIKTOK_GIFTS === 'undefined') {
    return '<option value="">No gifts available</option>';
  }

  // Create flat list of all gifts with coin values
  const allGifts = [];
  Object.entries(TIKTOK_GIFTS).forEach(([coins, giftNames]) => {
    giftNames.forEach(name => {
      allGifts.push({ name, coins: parseInt(coins) });
    });
  });

  // Sort by coin value, then name
  allGifts.sort((a, b) => a.coins - b.coins || a.name.localeCompare(b.name));

  // Build options
  let options = '<option value="">-- Select a Gift --</option>';
  allGifts.forEach(gift => {
    options += `<option value="${gift.name}" data-coins="${gift.coins}">${gift.name} (${gift.coins} coins)</option>`;
  });

  return options;
}

// Add a new threshold
async function addThreshold() {
  // Create modal for threshold configuration
  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';

  const content = document.createElement('div');
  content.style.cssText = 'background: #1e293b; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 24px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;';

  content.innerHTML = `
    <h3 style="margin-top: 0; color: rgba(255,255,255,0.9);">➕ Add Threshold</h3>

    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.8);">Threshold Type:</label>
      <select id="threshold-type" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
        <option value="count">🎯 Count-based (e.g., 5x Galaxy)</option>
        <option value="value">💎 Value-based (e.g., 10,000 total coins)</option>
      </select>
      <small style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 4px; display: block;">
        Count-based: Triggers after receiving a specific gift X times<br>
        Value-based: Triggers after accumulating X total coin value from ANY gifts
      </small>
    </div>

    <div id="count-based-fields">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.8);">Gift Name:</label>
        <input type="text" id="threshold-gift-name-manual" placeholder="Type gift name here (or use dropdown below)..." style="width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 2px solid rgba(96, 165, 250, 0.5); border-radius: 4px; color: white; font-size: 14px;">
        <div style="text-align: center; color: rgba(255,255,255,0.5); font-size: 12px; margin: 8px 0;">- OR -</div>
        <select id="threshold-gift-select" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
          ${buildGiftDropdownOptions()}
        </select>
        <small style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 4px; display: block;">💡 Type gift name above or select from dropdown</small>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.8);">Target Count:</label>
        <input type="number" id="threshold-target" value="5" min="1" max="100" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
      </div>
    </div>

    <div id="value-based-fields" style="display: none;">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.8);">Target Coin Value:</label>
        <input type="number" id="threshold-value-target" value="10000" min="1" max="1000000" step="100" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
        <small style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 4px; display: block;">Total coin value from ALL gifts received this session</small>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.8);">Action:</label>
      <select id="threshold-action" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
        ${THRESHOLD_ACTIONS.map(a => `<option value="${a.action}">${a.name}</option>`).join('')}
      </select>
    </div>

    <div id="threshold-params-container" style="margin-bottom: 16px;"></div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="threshold-cancel" class="btn-secondary">Cancel</button>
      <button id="threshold-save" class="btn-primary">Save Threshold</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Handle threshold type change
  const thresholdTypeSelect = document.getElementById('threshold-type');
  const countBasedFields = document.getElementById('count-based-fields');
  const valueBasedFields = document.getElementById('value-based-fields');

  function updateTypeFields() {
    if (thresholdTypeSelect.value === 'count') {
      countBasedFields.style.display = 'block';
      valueBasedFields.style.display = 'none';
    } else {
      countBasedFields.style.display = 'none';
      valueBasedFields.style.display = 'block';
    }
  }

  thresholdTypeSelect.addEventListener('change', updateTypeFields);
  updateTypeFields(); // Initial render

  // Handle gift dropdown selection
  const giftSelect = document.getElementById('threshold-gift-select');
  const giftManual = document.getElementById('threshold-gift-name-manual');

  giftSelect.addEventListener('change', () => {
    if (giftSelect.value) {
      giftManual.value = ''; // Clear manual input when dropdown is used
      giftManual.placeholder = 'Or type custom gift name...';
    }
  });

  giftManual.addEventListener('focus', () => {
    // Clear dropdown when user focuses on manual input
    giftSelect.value = '';
    giftManual.placeholder = 'Type exact gift name (e.g., "Galaxy", "Rose")';
    giftManual.style.border = '2px solid rgba(96, 165, 250, 0.8)';
  });

  giftManual.addEventListener('blur', () => {
    giftManual.style.border = '2px solid rgba(96, 165, 250, 0.5)';
    if (!giftManual.value) {
      giftManual.placeholder = 'Type gift name here (or use dropdown below)...';
    }
  });

  giftManual.addEventListener('input', () => {
    if (giftManual.value) {
      giftSelect.value = ''; // Clear dropdown when manual input is used
    }
  });

  // Handle action change to show params
  const actionSelect = document.getElementById('threshold-action');
  const paramsContainer = document.getElementById('threshold-params-container');

  function updateParamsUI() {
    const selectedAction = THRESHOLD_ACTIONS.find(a => a.action === actionSelect.value);
    paramsContainer.innerHTML = '';

    if (selectedAction && selectedAction.params && selectedAction.params.length > 0) {
      selectedAction.params.forEach(param => {
        const div = document.createElement('div');
        div.style.marginBottom = '12px';
        div.innerHTML = `
          <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.8);">${param.label}:</label>
          <input type="${param.type}" id="threshold-param-${param.key}" value="${param.default}" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white;">
        `;
        paramsContainer.appendChild(div);
      });
    }
  }

  actionSelect.addEventListener('change', updateParamsUI);
  updateParamsUI(); // Initial render

  // Handle cancel
  document.getElementById('threshold-cancel').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  // Handle save
  document.getElementById('threshold-save').addEventListener('click', async () => {
    const thresholdType = document.getElementById('threshold-type').value;
    const action = document.getElementById('threshold-action').value;

    // Collect params
    const selectedAction = THRESHOLD_ACTIONS.find(a => a.action === action);
    const params = {};
    if (selectedAction && selectedAction.params) {
      selectedAction.params.forEach(param => {
        const input = document.getElementById(`threshold-param-${param.key}`);
        if (input) {
          params[param.key] = param.type === 'number' ? parseFloat(input.value) : input.value;
        }
      });
    }

    // Get description
    const description = selectedAction ? selectedAction.name : action;

    if (thresholdType === 'count') {
      // Count-based threshold - prioritize manual input over dropdown
      const manualInput = document.getElementById('threshold-gift-name-manual').value.trim();
      const dropdownValue = document.getElementById('threshold-gift-select').value;
      const giftName = manualInput || dropdownValue;
      const target = parseInt(document.getElementById('threshold-target').value);

      if (!giftName) {
        alert('Please type a gift name or select one from the dropdown');
        return;
      }

      if (target < 1) {
        alert('Target count must be at least 1');
        return;
      }

      // Save threshold config (count-based)
      thresholdConfigs[giftName] = {
        type: 'count',
        target,
        action,
        description,
        params: Object.keys(params).length > 0 ? params : undefined
      };
    } else {
      // Value-based threshold
      const targetValue = parseInt(document.getElementById('threshold-value-target').value);

      if (targetValue < 1) {
        alert('Target coin value must be at least 1');
        return;
      }

      // Save threshold config (value-based) - use special key "__VALUE_TOTAL__"
      thresholdConfigs['__VALUE_TOTAL__'] = {
        type: 'value',
        target: targetValue,
        action,
        description,
        params: Object.keys(params).length > 0 ? params : undefined
      };
    }

    await saveThresholdConfigs();
    renderThresholdConfigs();
    updateThresholdProgress();

    document.body.removeChild(modal);
  });
}

// Reset all thresholds
async function resetAllThresholds() {
  if (!confirm('Delete ALL threshold configurations? This cannot be undone.')) {
    return;
  }

  thresholdConfigs = {};
  await saveThresholdConfigs();
  renderThresholdConfigs();
  updateThresholdProgress();
}

// Update threshold progress display
async function updateThresholdProgress() {
  try {
    const result = await window.sniAPI.getThresholdStatus();
    if (!result.success) {
      console.error('Failed to get threshold status:', result.error);
      return;
    }

    const container = document.getElementById('threshold-progress-list');
    const status = result.status || [];

    if (status.length === 0) {
      container.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-style: italic;">No thresholds configured</div>';
      return;
    }

    container.innerHTML = '';

    status.forEach(item => {
      const div = document.createElement('div');
      div.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 12px;';

      const isValueBased = item.giftName === '__VALUE_TOTAL__';

      // Gift name or type
      const nameDiv = document.createElement('div');
      nameDiv.style.cssText = 'flex: 1; min-width: 150px;';
      if (isValueBased) {
        nameDiv.innerHTML = `<strong style="color: #a78bfa;">💎 Total Coin Value</strong>`;
      } else {
        nameDiv.innerHTML = `<strong style="color: #60a5fa;">${item.giftName}</strong>`;
      }
      div.appendChild(nameDiv);

      // Progress bar
      const progressDiv = document.createElement('div');
      progressDiv.style.cssText = 'flex: 2; display: flex; align-items: center; gap: 8px;';

      const progressBarBg = document.createElement('div');
      progressBarBg.style.cssText = 'flex: 1; background: rgba(0,0,0,0.3); border-radius: 4px; height: 20px; overflow: hidden;';

      const progressBarFill = document.createElement('div');
      const percentage = (item.current / item.target) * 100;
      progressBarFill.style.cssText = `background: ${percentage >= 100 ? '#10b981' : isValueBased ? '#a78bfa' : '#3b82f6'}; height: 100%; width: ${Math.min(percentage, 100)}%; transition: width 0.3s ease;`;
      progressBarBg.appendChild(progressBarFill);
      progressDiv.appendChild(progressBarBg);

      const progressText = document.createElement('div');
      progressText.style.cssText = 'color: rgba(255,255,255,0.9); font-weight: bold; min-width: 80px; text-align: right;';
      if (isValueBased) {
        progressText.textContent = `${item.current.toLocaleString()}/${item.target.toLocaleString()}`;
      } else {
        progressText.textContent = item.progress;
      }
      progressDiv.appendChild(progressText);

      div.appendChild(progressDiv);

      // Action
      const actionDiv = document.createElement('div');
      actionDiv.style.cssText = 'flex: 2; color: rgba(255,255,255,0.7); font-size: 13px;';
      actionDiv.innerHTML = `→ ${item.description}`;
      div.appendChild(actionDiv);

      container.appendChild(div);
    });

  } catch (error) {
    console.error('Error updating threshold progress:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThresholdManager);
} else {
  initThresholdManager();
}
