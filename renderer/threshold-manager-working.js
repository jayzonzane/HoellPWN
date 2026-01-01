// Simplified threshold manager - only working operations (no sprite spawning)
const THRESHOLD_ACTIONS = [
  // Core Actions
  { action: 'killPlayer', name: '💀 KO Mario', params: [] },
  { action: 'addLife', name: '💚 Add Life', params: [] },
  { action: 'removeLife', name: '💔 Remove Life', params: [] },
  { action: 'addCoins', name: '🪙 Add Coins', params: [{key: 'amount', label: 'Amount', type: 'number', default: 10}] },
  { action: 'removeCoins', name: '💸 Remove Coins', params: [{key: 'amount', label: 'Amount', type: 'number', default: 10}] },

  // Power-Ups
  { action: 'giveMushroom', name: '🍄 Give Mushroom', params: [] },
  { action: 'giveFireFlower', name: '🔥 Give Fire Flower', params: [] },
  { action: 'giveCapeFeather', name: '🪶 Give Cape Feather', params: [] },
  { action: 'giveStarman', name: '⭐ Give Star Power', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'removePowerup', name: '⬇️ Downgrade Power-up', params: [] },
  { action: 'activatePSwitch', name: '⏱️ Activate P-Switch', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },

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

  // Physics Chaos - Speed
  { action: 'halfSpeed', name: '🐌 Half Speed', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'doubleSpeed', name: '⚡ Double Speed', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },

  // Physics Chaos - Jump
  { action: 'moonJump', name: '🌙 Moon Jump', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'tinyJump', name: '🐜 Tiny Jump', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },

  // Physics Chaos - Gravity
  { action: 'lowGravity', name: '🪶 Low Gravity', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'highGravity', name: '🪨 High Gravity', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },

  // Physics Chaos - Controls
  { action: 'reverseControls', name: '🔄 Reverse Controls', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'enableIcePhysics', name: '❄️ Ice Physics', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] },
  { action: 'disableRunning', name: '🚫 Disable Running', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'forceContinuousRun', name: '🏃 Force Continuous Run', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 20}] },
  { action: 'randomPhysicsChaos', name: '🎲 Random Physics Chaos', params: [{key: 'duration', label: 'Duration (sec)', type: 'number', default: 30}] }
];

// Initialize threshold manager
async function initThresholdManager() {
  console.log('🎯 Initializing Threshold Manager (Working Operations Only)...');

  const thresholdTab = document.getElementById('thresholds-tab');
  if (!thresholdTab) {
    console.error('Threshold tab not found!');
    return;
  }

  // Create threshold list container
  const thresholdList = document.createElement('div');
  thresholdList.id = 'threshold-list';
  thresholdList.className = 'threshold-list';

  // Create add threshold form
  const addForm = document.createElement('div');
  addForm.className = 'threshold-form';
  addForm.innerHTML = `
    <h3>Add Threshold Trigger</h3>
    <div class="form-row">
      <label>Gift Name:</label>
      <select id="threshold-gift-select"></select>
    </div>
    <div class="form-row">
      <label>Gift Count:</label>
      <input type="number" id="threshold-count" value="5" min="1" max="1000">
    </div>
    <div class="form-row">
      <label>Action:</label>
      <select id="threshold-action-select"></select>
    </div>
    <div id="threshold-params-container"></div>
    <button id="add-threshold-btn" class="btn">Add Threshold</button>
  `;

  thresholdTab.appendChild(addForm);
  thresholdTab.appendChild(thresholdList);

  // Populate action dropdown
  const actionSelect = document.getElementById('threshold-action-select');
  THRESHOLD_ACTIONS.forEach(action => {
    const option = document.createElement('option');
    option.value = action.action;
    option.textContent = action.name;
    actionSelect.appendChild(option);
  });

  // Load existing thresholds
  await loadThresholds();

  // Setup event listeners
  setupThresholdEventListeners();

  console.log('✅ Threshold Manager initialized with', THRESHOLD_ACTIONS.length, 'working actions');
}

async function loadThresholds() {
  try {
    const configs = await window.sniAPI.loadThresholdConfigs();
    renderThresholds(configs);
  } catch (error) {
    console.error('Error loading thresholds:', error);
  }
}

function renderThresholds(configs) {
  const thresholdList = document.getElementById('threshold-list');
  if (!thresholdList) return;

  thresholdList.innerHTML = '';

  Object.entries(configs).forEach(([giftName, thresholds]) => {
    thresholds.forEach((threshold, index) => {
      const thresholdItem = document.createElement('div');
      thresholdItem.className = 'threshold-item';

      const actionInfo = THRESHOLD_ACTIONS.find(a => a.action === threshold.action) || { name: threshold.action };

      thresholdItem.innerHTML = `
        <div class="threshold-info">
          <strong>${giftName}</strong> × ${threshold.count} → ${actionInfo.name}
          ${threshold.params ? '<br><small>' + JSON.stringify(threshold.params) + '</small>' : ''}
        </div>
        <button class="btn-sm danger" onclick="deleteThreshold('${giftName}', ${index})">Delete</button>
      `;

      thresholdList.appendChild(thresholdItem);
    });
  });
}

function setupThresholdEventListeners() {
  const actionSelect = document.getElementById('threshold-action-select');
  const paramsContainer = document.getElementById('threshold-params-container');
  const addBtn = document.getElementById('add-threshold-btn');

  // Update params when action changes
  actionSelect.addEventListener('change', () => {
    updateParameterInputs(actionSelect.value, paramsContainer);
  });

  // Add threshold
  addBtn.addEventListener('click', async () => {
    const giftName = document.getElementById('threshold-gift-select').value;
    const count = parseInt(document.getElementById('threshold-count').value);
    const action = actionSelect.value;

    if (!giftName || !count || !action) {
      alert('Please fill in all fields');
      return;
    }

    // Collect parameters
    const params = {};
    const paramInputs = paramsContainer.querySelectorAll('input, select');
    paramInputs.forEach(input => {
      const key = input.dataset.paramKey;
      if (key) {
        params[key] = input.type === 'number' ? parseInt(input.value) : input.value;
      }
    });

    try {
      let configs = await window.sniAPI.loadThresholdConfigs();
      if (!configs[giftName]) configs[giftName] = [];

      configs[giftName].push({ count, action, params });

      await window.sniAPI.saveThresholdConfigs(configs);
      await window.sniAPI.reloadThresholdConfigs();
      await loadThresholds();

      console.log('✅ Threshold added:', giftName, '×', count, '→', action);
    } catch (error) {
      console.error('Error adding threshold:', error);
      alert('Error adding threshold');
    }
  });
}

function updateParameterInputs(actionName, container) {
  container.innerHTML = '';

  const action = THRESHOLD_ACTIONS.find(a => a.action === actionName);
  if (!action || !action.params || action.params.length === 0) return;

  action.params.forEach(param => {
    const row = document.createElement('div');
    row.className = 'form-row';

    const label = document.createElement('label');
    label.textContent = param.label + ':';
    row.appendChild(label);

    const input = document.createElement('input');
    input.type = param.type || 'text';
    input.value = param.default || '';
    input.dataset.paramKey = param.key;
    row.appendChild(input);

    container.appendChild(row);
  });
}

window.deleteThreshold = async function(giftName, index) {
  try {
    let configs = await window.sniAPI.loadThresholdConfigs();
    if (configs[giftName]) {
      configs[giftName].splice(index, 1);
      if (configs[giftName].length === 0) {
        delete configs[giftName];
      }
    }

    await window.sniAPI.saveThresholdConfigs(configs);
    await window.sniAPI.reloadThresholdConfigs();
    await loadThresholds();

    console.log('✅ Threshold deleted');
  } catch (error) {
    console.error('Error deleting threshold:', error);
  }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThresholdManager);
} else {
  initThresholdManager();
}
