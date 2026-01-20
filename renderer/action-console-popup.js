// Action Console Popup Window Logic

let isAlwaysOnTop = false;
let activeGiftImages = null;
let customActions = [];

// Custom Actions Management
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

async function executeCustomAction(customAction) {
  try {
    await window.electronAPI.executeGiftAction({
      action: customAction.action,
      params: customAction.value ? { value: customAction.value } : {}
    });
  } catch (error) {
    console.error('Error executing custom action:', error);
  }
}

// Load gift images from active-gifts.json
async function loadActiveGiftImages() {
  if (activeGiftImages) return activeGiftImages;

  try {
    const result = await window.electronAPI.getActiveGifts();
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

// Populate unmapped gifts grid
async function populateUnmappedGifts() {
  const grid = document.getElementById('unmapped-gifts-grid');
  if (!grid) return;

  try {
    // Load all gifts from active-gifts.json
    const result = await window.electronAPI.getActiveGifts();
    if (!result.success || !result.activeGifts || !result.activeGifts.images) {
      grid.innerHTML = '<div class="action-console-empty"><p>No gifts found.</p></div>';
      return;
    }

    const giftImages = result.activeGifts.images;
    const allGifts = [];

    // Collect all gifts from all coin values
    for (const coinValue in giftImages) {
      const coinGifts = giftImages[coinValue];
      for (const giftName in coinGifts) {
        const giftData = coinGifts[giftName];
        allGifts.push({
          name: giftName,
          imageUrl: giftData.local || giftData.url,
          coinValue: parseInt(coinValue)
        });
      }
    }

    if (allGifts.length === 0) {
      grid.innerHTML = '<div class="action-console-empty"><p>No gifts found.</p></div>';
      return;
    }

    // Sort by coin value (descending)
    allGifts.sort((a, b) => b.coinValue - a.coinValue);

    // Clear grid
    grid.innerHTML = '';

    // Create button for each gift
    for (const gift of allGifts) {
      const button = document.createElement('button');
      button.className = 'action-console-button unmapped';
      button.dataset.giftName = gift.name;

      // Gift image or emoji
      let imageHtml;
      if (gift.imageUrl) {
        imageHtml = `<img src="${gift.imageUrl}" class="gift-image" alt="${gift.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                     <div class="emoji" style="display:none;">🎁</div>`;
      } else {
        imageHtml = `<div class="emoji">🎁</div>`;
      }

      button.innerHTML = `
        ${imageHtml}
        <div class="label">${gift.name}</div>
        <div class="action-label">${gift.coinValue} coins</div>
      `;

      // Add click handler - execute as a test (no specific action)
      button.addEventListener('click', async () => {
        // For now, just log or show a notification
        // You could add a default action here
        console.log(`Clicked unmapped gift: ${gift.name}`);
        alert(`Gift "${gift.name}" (${gift.coinValue} coins)\n\nThis gift is not mapped to any action yet.\nUse Gift Settings to map it to an operation.`);
      });

      grid.appendChild(button);
    }
  } catch (error) {
    console.error('Error populating unmapped gifts:', error);
    grid.innerHTML = '<div class="action-console-empty"><p>Error loading gifts.</p></div>';
  }
}

// Populate the action console grid
async function populateActionConsole() {
  const grid = document.getElementById('action-console-grid');
  if (!grid) return;

  try {
    // Load gift mappings, gift images, and custom actions
    const [result, giftImages] = await Promise.all([
      window.electronAPI.loadGiftMappings(),
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
      button.dataset.action = mapping.action;
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

      // Add click handler - execute action via IPC
      button.addEventListener('click', async () => {
        try {
          await window.electronAPI.executeGiftAction({
            action: mapping.action,
            params: mapping.params || {}
          });
        } catch (error) {
          console.error('Error executing action:', error);
        }
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
      grid.innerHTML = '<div class="action-console-empty"><p>No actions added yet. Click "➕" to add operations.</p></div>';
    }
  } catch (error) {
    console.error('Error populating action console:', error);
    grid.innerHTML = '<div class="action-console-empty"><p>Error loading actions.</p></div>';
  }
}

// Toggle collapsible sections
function toggleSection(sectionName) {
  const content = document.getElementById(`action-console-${sectionName}-list`);
  const toggle = document.getElementById(`${sectionName}-toggle`);

  if (!content || !toggle) return;

  const isCollapsed = content.classList.contains('collapsed');

  if (isCollapsed) {
    content.classList.remove('collapsed');
    toggle.classList.remove('collapsed');
    toggle.textContent = '▼';
    localStorage.setItem(`actionConsole-${sectionName}-collapsed`, 'false');
  } else {
    content.classList.add('collapsed');
    toggle.classList.add('collapsed');
    toggle.textContent = '▶';
    localStorage.setItem(`actionConsole-${sectionName}-collapsed`, 'true');
  }
}

// Toggle always on top
async function toggleAlwaysOnTop() {
  isAlwaysOnTop = !isAlwaysOnTop;
  const btn = document.getElementById('always-on-top-btn');

  if (isAlwaysOnTop) {
    btn.classList.add('active');
    btn.title = 'Always on top (enabled)';
  } else {
    btn.classList.remove('active');
    btn.title = 'Toggle always on top';
  }

  // Tell main process to update window
  await window.electronAPI.setAlwaysOnTop(isAlwaysOnTop);
}

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

// Update threshold display
async function updateActionConsoleThresholds() {
  const container = document.getElementById('action-console-threshold-list');
  if (!container) return;

  try {
    const result = await window.electronAPI.getThresholdStatus();
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Load initial actions
  populateActionConsole();
  updateActionConsoleThresholds();

  // Update thresholds every 2 seconds
  setInterval(updateActionConsoleThresholds, 2000);

  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', () => {
    populateActionConsole();
    updateActionConsoleThresholds();
  });

  // Always on top button
  document.getElementById('always-on-top-btn').addEventListener('click', () => {
    toggleAlwaysOnTop();
  });

  // Button size slider
  const sizeSlider = document.getElementById('button-size-slider');
  const sizeValue = document.getElementById('button-size-value');

  // Load saved button size
  const savedSize = localStorage.getItem('actionConsoleButtonSize') || '100';
  sizeSlider.value = savedSize;
  updateButtonSize(parseInt(savedSize));

  // Handle slider changes
  sizeSlider.addEventListener('input', (e) => {
    const size = parseInt(e.target.value);
    updateButtonSize(size);
    localStorage.setItem('actionConsoleButtonSize', size.toString());
  });

  function updateButtonSize(size) {
    const scale = size / 100;
    document.body.style.setProperty('--button-scale', scale);
    sizeValue.textContent = `${size}%`;
  }

  // Layout selector
  const layoutSelector = document.getElementById('layout-selector');

  // Load saved layout
  const savedLayout = localStorage.getItem('actionConsoleLayout') || 'default';
  layoutSelector.value = savedLayout;
  applyLayout(savedLayout);

  // Handle layout changes
  layoutSelector.addEventListener('change', (e) => {
    const layout = e.target.value;
    applyLayout(layout);
    localStorage.setItem('actionConsoleLayout', layout);
  });

  function applyLayout(layoutName) {
    // Remove all layout data attributes
    document.body.removeAttribute('data-layout');

    // Apply new layout (if not default)
    if (layoutName !== 'default') {
      document.body.setAttribute('data-layout', layoutName);
    }
  }

  // Show unmapped gifts button
  let showUnmapped = false;
  const showUnmappedBtn = document.getElementById('show-unmapped-btn');

  showUnmappedBtn.addEventListener('click', () => {
    showUnmapped = !showUnmapped;
    const unmappedSection = document.getElementById('unmapped-gifts-section');

    if (showUnmapped) {
      unmappedSection.style.display = 'block';
      showUnmappedBtn.classList.add('active');
      showUnmappedBtn.title = 'Hide unmapped gifts';
      populateUnmappedGifts();
    } else {
      unmappedSection.style.display = 'none';
      showUnmappedBtn.classList.remove('active');
      showUnmappedBtn.title = 'Show all gifts (mapped + unmapped)';
    }
  });

  // Listen for updates from main process
  window.electronAPI.onActionConsoleUpdate(() => {
    console.log('Action console updated - refreshing...');
    populateActionConsole();
  });

  // Listen for gift activity events
  if (window.electronAPI && window.electronAPI.onGiftActivity) {
    window.electronAPI.onGiftActivity((giftData) => {
      addActivityLogEntry(giftData);
    });
  }

  // Restore collapsed state
  ['threshold', 'activity'].forEach(sectionName => {
    const isCollapsed = localStorage.getItem(`actionConsole-${sectionName}-collapsed`) === 'true';
    if (isCollapsed) {
      const content = document.getElementById(`action-console-${sectionName}-list`);
      const toggle = document.getElementById(`${sectionName}-toggle`);
      if (content && toggle) {
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
        toggle.textContent = '▶';
      }
    }
  });

  // Add Action modal event listeners
  const addActionBtn = document.getElementById('add-action-btn');
  const addActionModal = document.getElementById('add-action-modal');
  const closeAddActionBtn = document.getElementById('close-add-action');

  if (addActionBtn && addActionModal) {
    // Open modal
    addActionBtn.addEventListener('click', () => {
      addActionModal.style.display = 'flex';
    });

    // Close modal - close button
    if (closeAddActionBtn) {
      closeAddActionBtn.addEventListener('click', () => {
        addActionModal.style.display = 'none';
      });
    }

    // Close modal - click outside
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
        console.log(`Added ${label} to Action Console`);
      });
    });
  }
});
