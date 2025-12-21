// Gift Settings Modal Handler

// Get modal elements
const modal = document.getElementById('gift-settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeBtn = document.querySelector('.modal-close');
const saveBtn = document.getElementById('save-gift-settings');
const saveDatabaseBtn = document.getElementById('save-gift-database');
const saveImagesBtn = document.getElementById('save-gift-images');
const cancelBtn = document.getElementById('cancel-gift-settings');
const resetDatabaseBtn = document.getElementById('reset-gift-database');

// Track selected gift names to prevent duplicates
let selectedGiftNames = new Set();

// Track gift name overrides
let giftNameOverrides = {};

// Track custom gifts
let customGifts = [];

// Track gift image overrides
let giftImageOverrides = {};

// Get gift name (with override applied)
function getGiftName(originalName, coinValue) {
  const key = `${coinValue}-${originalName}`;
  return giftNameOverrides[key] || originalName;
}

// Populate gift database editor
function populateGiftDatabase() {
  const container = document.getElementById('gift-database-list');
  container.innerHTML = '';

  if (typeof TIKTOK_GIFTS === 'undefined') {
    container.innerHTML = '<p>Gift database not loaded</p>';
    return;
  }

  // Group by coin values
  const sortedCoins = Object.keys(TIKTOK_GIFTS).map(Number).sort((a, b) => a - b);

  sortedCoins.forEach(coins => {
    const gifts = TIKTOK_GIFTS[coins];
    if (!gifts || gifts.length === 0) return;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'coin-group';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'coin-group-header';
    headerDiv.textContent = `💰 ${coins} coins (${gifts.length} gifts)`;
    groupDiv.appendChild(headerDiv);

    gifts.forEach(giftName => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'gift-edit-item';

      const coinSpan = document.createElement('span');
      coinSpan.className = 'gift-coin-value';
      coinSpan.textContent = `${coins} 💰`;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'gift-name-input';
      input.value = getGiftName(giftName, coins);
      input.dataset.originalName = giftName;
      input.dataset.coins = coins;

      itemDiv.appendChild(coinSpan);
      itemDiv.appendChild(input);
      groupDiv.appendChild(itemDiv);
    });

    container.appendChild(groupDiv);
  });
}

// Load gift name overrides
async function loadGiftNameOverrides() {
  try {
    const result = await window.sniAPI.loadGiftNameOverrides();
    if (result.success && result.overrides) {
      giftNameOverrides = result.overrides;
    }
  } catch (error) {
    console.error('Error loading gift name overrides:', error);
  }
}

// Load custom gifts
async function loadCustomGifts() {
  try {
    const result = await window.sniAPI.loadCustomGifts();
    if (result.success && result.customGifts) {
      customGifts = result.customGifts;
      // Add custom gifts to TIKTOK_GIFTS dynamically
      customGifts.forEach(gift => {
        if (!TIKTOK_GIFTS[gift.coins]) {
          TIKTOK_GIFTS[gift.coins] = [];
        }
        if (!TIKTOK_GIFTS[gift.coins].includes(gift.name)) {
          TIKTOK_GIFTS[gift.coins].push(gift.name);
        }
        // Add custom image if provided
        if (gift.imageUrl && typeof addCustomGiftImage !== 'undefined') {
          addCustomGiftImage(gift.name, gift.coins, gift.imageUrl);
        }
      });
      displayCustomGifts();
    }
  } catch (error) {
    console.error('Error loading custom gifts:', error);
  }
}

// Save custom gifts
async function saveCustomGifts() {
  try {
    const result = await window.sniAPI.saveCustomGifts(customGifts);
    return result;
  } catch (error) {
    console.error('Error saving custom gifts:', error);
    return { success: false, error: error.message };
  }
}

// Display custom gifts in the list
function displayCustomGifts() {
  const container = document.getElementById('custom-gifts-list');
  if (!container) return;

  if (customGifts.length === 0) {
    container.innerHTML = '<p class="no-custom-gifts">No custom gifts added yet.</p>';
    return;
  }

  container.innerHTML = '';
  customGifts.forEach((gift, index) => {
    const chip = document.createElement('div');
    chip.className = 'custom-gift-chip';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'custom-gift-name';
    nameSpan.textContent = `${gift.name} (${gift.coins} 💰)`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-custom';
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove custom gift';
    removeBtn.dataset.index = index;

    chip.appendChild(nameSpan);
    chip.appendChild(removeBtn);
    container.appendChild(chip);
  });
}

// Add custom gift
async function addCustomGift() {
  const nameInput = document.getElementById('custom-gift-name');
  const coinsInput = document.getElementById('custom-gift-coins');
  const imageInput = document.getElementById('custom-gift-image');

  const name = nameInput.value.trim();
  const coins = parseInt(coinsInput.value);
  const imageUrl = imageInput.value.trim();

  // Validation
  if (!name) {
    log('Gift name is required', 'error');
    return;
  }

  if (!coins || coins < 1 || coins > 50000) {
    log('Coin value must be between 1 and 50,000', 'error');
    return;
  }

  // Check if gift already exists
  const exists = customGifts.some(g => g.name === name && g.coins === coins);
  if (exists) {
    log('This custom gift already exists', 'error');
    return;
  }

  // Add to custom gifts array
  const newGift = { name, coins };
  if (imageUrl) {
    newGift.imageUrl = imageUrl;
  }
  customGifts.push(newGift);

  // Add to TIKTOK_GIFTS dynamically
  if (!TIKTOK_GIFTS[coins]) {
    TIKTOK_GIFTS[coins] = [];
  }
  if (!TIKTOK_GIFTS[coins].includes(name)) {
    TIKTOK_GIFTS[coins].push(name);
  }

  // Add custom image if provided
  if (imageUrl && typeof addCustomGiftImage !== 'undefined') {
    addCustomGiftImage(name, coins, imageUrl);
  }

  // Save to file
  const result = await saveCustomGifts();
  if (result.success) {
    log(`Custom gift "${name}" added successfully!`, 'success');
    displayCustomGifts();

    // Clear form
    nameInput.value = '';
    coinsInput.value = '';
    imageInput.value = '';

    // Refresh coin ranges if needed (in case new coin value added)
    if (typeof updateCoinRanges === 'function') {
      updateCoinRanges();
    }
  } else {
    log(`Failed to save custom gift: ${result.error}`, 'error');
  }
}

// Remove custom gift
async function removeCustomGift(index) {
  if (index < 0 || index >= customGifts.length) return;

  const gift = customGifts[index];
  const confirmMsg = `Remove custom gift "${gift.name}" (${gift.coins} coins)?`;

  if (!confirm(confirmMsg)) return;

  // Remove from array
  customGifts.splice(index, 1);

  // Remove from TIKTOK_GIFTS (only if it's not in the original database)
  if (TIKTOK_GIFTS[gift.coins]) {
    const giftIndex = TIKTOK_GIFTS[gift.coins].indexOf(gift.name);
    if (giftIndex > -1) {
      TIKTOK_GIFTS[gift.coins].splice(giftIndex, 1);
      // If no gifts left for this coin value, remove the coin value
      if (TIKTOK_GIFTS[gift.coins].length === 0) {
        delete TIKTOK_GIFTS[gift.coins];
      }
    }
  }

  // Save to file
  const result = await saveCustomGifts();
  if (result.success) {
    log(`Custom gift "${gift.name}" removed successfully!`, 'success');
    displayCustomGifts();

    // Refresh gift database view if open
    if (document.getElementById('tab-database').classList.contains('active')) {
      populateGiftDatabase();
    }
  } else {
    log(`Failed to save changes: ${result.error}`, 'error');
  }
}

// Save gift database
saveDatabaseBtn.addEventListener('click', async () => {
  try {
    const overrides = {};
    const nameChanges = {}; // Track original->new name mappings
    const inputs = document.querySelectorAll('.gift-name-input');

    inputs.forEach(input => {
      const originalName = input.dataset.originalName;
      const coins = input.dataset.coins;
      const newName = input.value.trim();

      if (newName && newName !== originalName) {
        const key = `${coins}-${originalName}`;
        overrides[key] = newName;

        // Track the name change for updating mappings
        nameChanges[originalName] = newName;
      }
    });

    const result = await window.sniAPI.saveGiftNameOverrides(overrides);
    if (result.success) {
      giftNameOverrides = overrides;

      // Update existing gift mappings with new names
      if (Object.keys(nameChanges).length > 0) {
        await updateMappingsWithNewNames(nameChanges);
      }

      log(`Saved ${Object.keys(overrides).length} gift name overrides!`, 'success');

      // Reload the gift dropdowns to apply changes
      if (document.querySelectorAll('.gift-select').length > 0) {
        convertInputsToSelects();
        loadGiftSettings();
      }
    } else {
      log(`Failed to save: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error saving gift database: ${error.message}`, 'error');
  }
});

// Update gift mappings when gift names change
async function updateMappingsWithNewNames(nameChanges) {
  try {
    const result = await window.sniAPI.loadGiftMappings();
    if (!result.success || !result.mappings) return;

    let updatedCount = 0;
    const updatedMappings = {};

    // Go through existing mappings and update gift names
    Object.entries(result.mappings).forEach(([oldGiftName, mapping]) => {
      // Check if this gift name was changed
      const newGiftName = nameChanges[oldGiftName];

      if (newGiftName) {
        // Use the new name as the key
        updatedMappings[newGiftName] = mapping;
        updatedCount++;
        log(`Updated mapping: "${oldGiftName}" → "${newGiftName}"`, 'info');
      } else {
        // Keep existing mapping unchanged
        updatedMappings[oldGiftName] = mapping;
      }
    });

    if (updatedCount > 0) {
      // Save the updated mappings
      const saveResult = await window.sniAPI.saveGiftMappings(updatedMappings);
      if (saveResult.success) {
        log(`✅ Updated ${updatedCount} gift mapping(s) with new names`, 'success');
        await window.sniAPI.reloadGiftMappings();
      }
    }
  } catch (error) {
    console.error('Error updating mappings:', error);
    log(`⚠️ Failed to update some mappings: ${error.message}`, 'warning');
  }
}

// Reset gift database
resetDatabaseBtn.addEventListener('click', async () => {
  if (!confirm('Reset all gift names to defaults? This will remove all your custom edits.')) {
    return;
  }

  try {
    const result = await window.sniAPI.saveGiftNameOverrides({});
    if (result.success) {
      giftNameOverrides = {};
      populateGiftDatabase();
      log('Gift database reset to defaults!', 'success');

      // Reload the gift dropdowns
      if (document.querySelectorAll('.gift-select').length > 0) {
        convertInputsToSelects();
        loadGiftSettings();
      }
    }
  } catch (error) {
    log(`Error resetting database: ${error.message}`, 'error');
  }
});

// Generate coin range dropdown options
function generateCoinValueOptions() {
  let optionsHTML = '<option value="">Select coin range...</option>';
  if (typeof COIN_RANGES !== 'undefined') {
    COIN_RANGES.forEach(range => {
      optionsHTML += `<option value="${range.min}-${range.max}">${range.label}</option>`;
    });
  }
  return optionsHTML;
}

// Generate gift options for a coin range (with overrides applied)
function generateGiftOptionsForCoinValue(rangeValue, selectedGift = '') {
  let optionsHTML = '<option value="">Select a gift...</option>';
  if (rangeValue && typeof getGiftsForCoinRange !== 'undefined') {
    // Parse range value (e.g., "1-5" or "1001-2000")
    const [minStr, maxStr] = rangeValue.split('-');
    const min = parseInt(minStr);
    const max = parseInt(maxStr);

    if (!isNaN(min) && !isNaN(max)) {
      const giftsWithCoins = getGiftsForCoinRange(min, max);
      if (giftsWithCoins && giftsWithCoins.length > 0) {
        giftsWithCoins.forEach(giftObj => {
          // Apply name override if exists
          const displayName = getGiftName(giftObj.name, giftObj.coins);
          const selected = giftObj.name === selectedGift ? 'selected' : '';
          optionsHTML += `<option value="${giftObj.name}" ${selected}>${displayName} (${giftObj.coins})</option>`;
        });
      }
    }
  }
  return optionsHTML;
}

// Convert text inputs to cascading dropdown system
function convertInputsToSelects() {
  const inputs = document.querySelectorAll('.gift-input');
  inputs.forEach(input => {
    // Create container for both dropdowns
    const container = document.createElement('div');
    container.className = 'gift-dropdown-container';
    container.style.display = 'flex';
    container.style.gap = '10px';
    container.style.flexDirection = 'column';

    // Create coin value dropdown
    const coinSelect = document.createElement('select');
    coinSelect.className = 'coin-select';
    coinSelect.innerHTML = generateCoinValueOptions();

    // Create gift dropdown (initially empty)
    const giftSelect = document.createElement('select');
    giftSelect.className = 'gift-select';
    giftSelect.innerHTML = '<option value="">Select coin value first...</option>';
    giftSelect.disabled = true;

    // Copy data attributes to gift select
    giftSelect.dataset.action = input.dataset.action;
    if (input.dataset.params) giftSelect.dataset.params = input.dataset.params;
    if (input.dataset.item) giftSelect.dataset.item = input.dataset.item;
    if (input.dataset.enemy) giftSelect.dataset.enemy = input.dataset.enemy;
    if (input.dataset.value) giftSelect.dataset.value = input.dataset.value;
    if (input.dataset.dungeon) giftSelect.dataset.dungeon = input.dataset.dungeon;

    // Store reference to paired gift select
    coinSelect.dataset.pairedGiftSelect = Date.now() + Math.random();
    giftSelect.dataset.pairedSelectId = coinSelect.dataset.pairedGiftSelect;

    // Add both to container
    container.appendChild(coinSelect);
    container.appendChild(giftSelect);

    // Replace input with container
    input.parentNode.replaceChild(container, input);
  });
}

// Handle coin value selection
document.addEventListener('change', (e) => {
  if (e.target.classList.contains('coin-select')) {
    const coinSelect = e.target;
    const coinValue = coinSelect.value;
    const pairedId = coinSelect.dataset.pairedGiftSelect;
    const giftSelect = document.querySelector(`.gift-select[data-paired-select-id="${pairedId}"]`);

    if (giftSelect) {
      if (coinValue) {
        // Populate gift dropdown with gifts for this coin value
        giftSelect.innerHTML = generateGiftOptionsForCoinValue(coinValue);
        giftSelect.disabled = false;
      } else {
        // Reset gift dropdown
        giftSelect.innerHTML = '<option value="">Select coin value first...</option>';
        giftSelect.disabled = true;
      }
    }
  }
});

// Tab switching
// Event handlers for gift settings actions
document.addEventListener('click', (e) => {
  // Handle Add Custom Gift button
  if (e.target.id === 'add-custom-gift') {
    addCustomGift();
  }

  // Handle Remove Custom Gift button
  if (e.target.classList.contains('btn-remove-custom')) {
    const index = parseInt(e.target.dataset.index);
    removeCustomGift(index);
  }

  // Handle Generate Overlay button
  if (e.target.id === 'generate-overlay') {
    generateOverlay();
  }
});

// Function to open modal
function openGiftSettings() {
  // Convert inputs to selects if not already done
  if (document.querySelectorAll('.gift-select').length === 0) {
    convertInputsToSelects();
  }
  loadGiftSettings();
  loadGiftNameOverrides();
  loadCustomGifts();
  loadGiftImageOverrides();
  // modal.style.display = 'block'; // No longer needed - using tabs
}

// Modal open/close handlers no longer needed - using tabs
// Open modal from button
// if (settingsBtn) {
//   settingsBtn.addEventListener('click', openGiftSettings);
// }

// Open modal from menu
// const menuGiftSettings = document.getElementById('menu-gift-settings');
// if (menuGiftSettings) {
//   menuGiftSettings.addEventListener('click', openGiftSettings);
// }

// Close modal handlers
// closeBtn.addEventListener('click', () => {
//   modal.style.display = 'none';
// });

// cancelBtn.addEventListener('click', () => {
//   modal.style.display = 'none';
// });

// Close on outside click
// window.addEventListener('click', (e) => {
//   if (e.target === modal) {
//     modal.style.display = 'none';
//   }
// });

// Close on Escape key
// document.addEventListener('keydown', (e) => {
//   if (e.key === 'Escape' && modal.style.display === 'block') {
//     modal.style.display = 'none';
//   }
// });

// Update all gift dropdowns to show/hide options based on selected gifts
function updateAllGiftDropdowns() {
  const allSelects = document.querySelectorAll('.gift-select');
  allSelects.forEach(select => {
    const currentValue = select.value;
    const options = select.querySelectorAll('option');

    options.forEach(option => {
      if (option.value === '') {
        // Always show "Select a gift..." option
        option.disabled = false;
        option.style.display = '';
      } else if (option.value === currentValue) {
        // Always show currently selected value
        option.disabled = false;
        option.style.display = '';
      } else if (selectedGiftNames.has(option.value)) {
        // Hide/disable gifts selected in other dropdowns
        option.disabled = true;
        option.style.display = 'none';
      } else {
        // Show available gifts
        option.disabled = false;
        option.style.display = '';
      }
    });
  });
}

// Find coin value for a gift name
function findCoinValueForGift(giftName) {
  if (typeof TIKTOK_GIFTS === 'undefined') return null;
  for (const [coinValue, gifts] of Object.entries(TIKTOK_GIFTS)) {
    if (gifts.includes(giftName)) {
      return parseInt(coinValue);
    }
  }
  return null;
}

// Find the coin range for a specific coin value
function findRangeForCoinValue(coinValue) {
  if (typeof COIN_RANGES === 'undefined') return null;
  for (const range of COIN_RANGES) {
    if (coinValue >= range.min && coinValue <= range.max) {
      return `${range.min}-${range.max}`;
    }
  }
  return null;
}

// Load existing gift settings
async function loadGiftSettings() {
  try {
    selectedGiftNames.clear();
    const result = await window.sniAPI.loadGiftMappings();
    if (result.success && result.mappings) {
      // Populate the cascading dropdowns with existing mappings
      Object.entries(result.mappings).forEach(([giftName, mapping]) => {
        const action = mapping.action;
        selectedGiftNames.add(giftName);

        // Find the coin value for this gift
        const coinValue = findCoinValueForGift(giftName);
        // Find the range that contains this coin value
        const rangeValue = coinValue ? findRangeForCoinValue(coinValue) : null;

        // Special handling for disableItem actions (with duration)
        if (action === 'disableItem' && mapping.params && mapping.params.itemName) {
          const itemName = mapping.params.itemName;
          const duration = mapping.params.duration;

          // Find gift select by action and item name
          const giftSelect = document.querySelector(`.gift-select[data-action="disableItem"][data-item="${itemName}"]`);
          if (giftSelect && rangeValue) {
            // Find and set the paired coin select
            const pairedId = giftSelect.dataset.pairedSelectId;
            const coinSelect = document.querySelector(`.coin-select[data-paired-gift-select="${pairedId}"]`);
            if (coinSelect) {
              coinSelect.value = rangeValue;
              // Populate gift dropdown with gifts in this range
              giftSelect.innerHTML = generateGiftOptionsForCoinValue(rangeValue, giftName);
              giftSelect.disabled = false;
              giftSelect.value = giftName;
            }

            // Also set the duration input
            const durationInput = document.querySelector(`.duration-input[data-item="${itemName}"]`);
            if (durationInput && duration) {
              durationInput.value = duration;
            }
          }
        } else {
          // Standard handling for other actions
          const paramsStr = mapping.params ? JSON.stringify(mapping.params) : '';
          const giftSelect = document.querySelector(`.gift-select[data-action="${action}"]`);
          if (giftSelect && rangeValue) {
            // Check if params match (for actions with parameters)
            const selectParams = giftSelect.dataset.params;
            if (!selectParams || selectParams === paramsStr) {
              // Find and set the paired coin select
              const pairedId = giftSelect.dataset.pairedSelectId;
              const coinSelect = document.querySelector(`.coin-select[data-paired-gift-select="${pairedId}"]`);
              if (coinSelect) {
                coinSelect.value = rangeValue;
                // Populate gift dropdown with gifts in this range
                giftSelect.innerHTML = generateGiftOptionsForCoinValue(rangeValue, giftName);
                giftSelect.disabled = false;
                giftSelect.value = giftName;
              }
            }
          }
        }
      });
      updateAllGiftDropdowns();
      log('Gift settings loaded', 'info');
    }
  } catch (error) {
    log(`Error loading gift settings: ${error.message}`, 'error');
  }
}

// Handle gift selection change
document.addEventListener('change', (e) => {
  if (e.target.classList.contains('gift-select')) {
    const select = e.target;
    const oldValue = select.dataset.previousValue || '';
    const newValue = select.value;

    // Check if this gift is already mapped to another action
    if (newValue && oldValue !== newValue && selectedGiftNames.has(newValue)) {
      // Find which action it's mapped to
      const otherMapping = findMappingForGift(newValue, select);
      if (otherMapping) {
        const confirmed = confirm(
          `⚠️ "${newValue}" is already mapped to:\n"${otherMapping}"\n\n` +
          `Do you want to remove the old mapping and use it here instead?`
        );

        if (!confirmed) {
          // Revert to old value
          select.value = oldValue;
          return;
        } else {
          // Remove old mapping
          removeOtherMapping(newValue, select);
        }
      }
    }

    // Update selected gifts set
    if (oldValue) {
      selectedGiftNames.delete(oldValue);
    }
    if (newValue) {
      selectedGiftNames.add(newValue);
    }

    // Store new value for next change
    select.dataset.previousValue = newValue;

    // Update all dropdowns to reflect the change
    updateAllGiftDropdowns();
  }
});

// Find which action a gift is currently mapped to
function findMappingForGift(giftName, excludeSelect) {
  const allSelects = document.querySelectorAll('.gift-select');
  for (const select of allSelects) {
    if (select === excludeSelect) continue;
    if (select.value === giftName) {
      const actionItem = select.closest('.action-item');
      if (actionItem) {
        const actionName = actionItem.querySelector('.action-name');
        return actionName ? actionName.textContent : 'Unknown Action';
      }
    }
  }
  return null;
}

// Remove a gift from another mapping
function removeOtherMapping(giftName, excludeSelect) {
  const allSelects = document.querySelectorAll('.gift-select');
  for (const select of allSelects) {
    if (select === excludeSelect) continue;
    if (select.value === giftName) {
      // Remove from this mapping
      selectedGiftNames.delete(giftName);
      select.value = '';
      select.dataset.previousValue = '';

      // Also reset the paired coin select
      const pairedId = select.dataset.pairedSelectId;
      const coinSelect = document.querySelector(`.coin-select[data-paired-gift-select="${pairedId}"]`);
      if (coinSelect) {
        coinSelect.value = '';
        select.innerHTML = '<option value="">Select coin value first...</option>';
        select.disabled = true;
      }
    }
  }
}

// Reset all gift mappings
const resetAllMappingsBtn = document.getElementById('reset-all-gift-mappings');
if (resetAllMappingsBtn) {
  resetAllMappingsBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear ALL gift mappings? This cannot be undone.')) {
      return;
    }

    try {
      // Clear all gift select dropdowns
      const allGiftSelects = document.querySelectorAll('.gift-select');
      allGiftSelects.forEach(select => {
        const oldValue = select.value;
        if (oldValue) {
          selectedGiftNames.delete(oldValue);
        }
        select.value = '';
        select.dataset.previousValue = '';
      });

      // Clear all paired coin selects and disable gift selects
      const allCoinSelects = document.querySelectorAll('.coin-select');
      allCoinSelects.forEach(coinSelect => {
        coinSelect.value = '';
        const pairedId = coinSelect.dataset.pairedGiftSelect;
        const giftSelect = document.querySelector(`.gift-select[data-paired-select-id="${pairedId}"]`);
        if (giftSelect) {
          giftSelect.innerHTML = '<option value="">Select coin value first...</option>';
          giftSelect.disabled = true;
        }
      });

      // Clear all duration inputs
      const allDurationInputs = document.querySelectorAll('.duration-input');
      allDurationInputs.forEach(input => {
        input.value = input.defaultValue || 60;
      });

      // Update all dropdowns
      updateAllGiftDropdowns();

      // Save the empty mappings
      const result = await window.sniAPI.saveGiftMappings({});
      if (result.success) {
        log('All gift mappings cleared!', 'success');
        await window.sniAPI.reloadGiftMappings();
      } else {
        log(`Failed to clear mappings: ${result.error}`, 'error');
      }
    } catch (error) {
      log(`Error clearing gift mappings: ${error.message}`, 'error');
    }
  });
}

// Save gift settings
saveBtn.addEventListener('click', async () => {
  try {
    const mappings = {};

    // Collect all filled dropdowns
    const selects = document.querySelectorAll('.gift-select');
    selects.forEach(select => {
      const giftName = select.value.trim();
      if (giftName) {
        const action = select.dataset.action;

        // Extract emoji from description text
        const actionItem = select.closest('.action-item');
        const descriptionText = actionItem.querySelector('.action-name').textContent;
        const emojiMatch = descriptionText.match(/^([\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
        const emoji = emojiMatch ? emojiMatch[0] : '🎁';

        // Build mapping object
        const mapping = {
          action: action,
          emoji: emoji,
          description: descriptionText
        };

        // Special handling for disableItem actions (with duration input)
        if (action === 'disableItem') {
          const itemName = select.dataset.item;
          const durationInput = document.querySelector(`.duration-input[data-item="${itemName}"]`);
          const duration = durationInput ? parseInt(durationInput.value) : 60;

          mapping.params = {
            itemName: itemName,
            duration: duration
          };
        } else {
          // Standard param handling for other actions
          const paramsStr = select.dataset.params;
          if (paramsStr) {
            try {
              mapping.params = JSON.parse(paramsStr);
            } catch (e) {
              console.error('Error parsing params:', paramsStr, e);
            }
          }
        }

        mappings[giftName] = mapping;
      }
    });

    // Save to backend
    const result = await window.sniAPI.saveGiftMappings(mappings);
    if (result.success) {
      log(`Saved ${Object.keys(mappings).length} gift mappings!`, 'success');
      // modal.style.display = 'none'; // No longer needed - using tabs

      // Reload the poller with new mappings
      await window.sniAPI.reloadGiftMappings();
      log('Gift mappings reloaded in poller', 'success');
    } else {
      log(`Failed to save: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error saving gift settings: ${error.message}`, 'error');
  }
});

// ============= GIFT IMAGE DOWNLOAD =============

// Download all gift images button handler
const downloadAllImagesBtn = document.getElementById('download-all-images');
if (downloadAllImagesBtn) {
  downloadAllImagesBtn.addEventListener('click', async () => {
    const progressDiv = document.getElementById('download-progress');
    const statusSpan = document.getElementById('download-status');
    const countSpan = document.getElementById('download-count');
    const progressBar = document.getElementById('download-progress-bar');
    const currentDiv = document.getElementById('download-current');

    // Disable button and show progress
    downloadAllImagesBtn.disabled = true;
    downloadAllImagesBtn.textContent = '⏳ Downloading...';
    progressDiv.style.display = 'block';
    statusSpan.textContent = 'Initializing download...';
    countSpan.textContent = '0 / ?';
    progressBar.style.width = '0%';

    try {
      // Start download
      const result = await window.sniAPI.downloadAllGiftImages();

      if (result.success) {
        statusSpan.textContent = '✅ Download Complete!';
        countSpan.textContent = `${result.downloaded} / ${result.total}`;
        progressBar.style.width = '100%';
        progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';

        if (result.failed > 0) {
          log(`Downloaded ${result.downloaded} images, ${result.failed} failed`, 'warning');
          currentDiv.textContent = `⚠️ ${result.failed} images failed to download. They will use CDN fallback.`;
        } else {
          log(`Successfully downloaded all ${result.downloaded} images!`, 'success');
          currentDiv.textContent = `📁 Images saved to app data directory`;
        }

        // Re-enable button after a delay
        setTimeout(() => {
          downloadAllImagesBtn.disabled = false;
          downloadAllImagesBtn.textContent = '✅ Re-download Images';
          progressDiv.style.display = 'none';
        }, 5000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      statusSpan.textContent = '❌ Download Failed';
      progressBar.style.background = '#ef4444';
      currentDiv.textContent = `Error: ${error.message}`;
      log(`Failed to download images: ${error.message}`, 'error');

      // Re-enable button
      downloadAllImagesBtn.disabled = false;
      downloadAllImagesBtn.textContent = '🖼️ Download All Images (331 files)';

      setTimeout(() => {
        progressDiv.style.display = 'none';
      }, 5000);
    }
  });
}

// Listen for download progress updates
window.sniAPI.onImageDownloadProgress((data) => {
  const countSpan = document.getElementById('download-count');
  const progressBar = document.getElementById('download-progress-bar');
  const currentDiv = document.getElementById('download-current');

  if (data.status === 'downloading') {
    countSpan.textContent = `${data.current} / ${data.total}`;
    currentDiv.textContent = `Downloading: ${data.giftName}`;
  } else if (data.status === 'success') {
    const percent = (data.current / data.total) * 100;
    progressBar.style.width = `${percent}%`;
  } else if (data.status === 'error') {
    currentDiv.textContent = `⚠️ Failed: ${data.giftName} - ${data.error}`;
  }
});

// ============= OVERLAY BUILDER =============

// Populate overlay gift selection from mapped gifts
async function populateOverlayGiftSelection() {
  const container = document.getElementById('overlay-gift-list');
  if (!container) return;

  try {
    const result = await window.sniAPI.loadGiftMappings();
    if (!result.success || !result.mappings || Object.keys(result.mappings).length === 0) {
      container.innerHTML = '<div style="color: #aaa; text-align: center; padding: 20px;">No gift mappings found. Map some gifts in the "Gift Mappings" tab first.</div>';
      return;
    }

    container.innerHTML = '';
    Object.entries(result.mappings).forEach(([giftName, mapping]) => {
      const item = document.createElement('div');
      item.className = 'overlay-gift-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'overlay-gift-checkbox';
      checkbox.value = giftName;
      checkbox.id = `overlay-gift-${giftName.replace(/\s+/g, '-')}`;
      checkbox.checked = true; // Default to checked

      const label = document.createElement('label');
      label.className = 'overlay-gift-label';
      label.htmlFor = checkbox.id;

      // Clean up action description
      let actionText = mapping.description || mapping.action;
      actionText = actionText.replace(/^Disable\s+/i, '').replace(/^\W+/, '');

      label.textContent = `${giftName} → ${actionText}`;

      item.appendChild(checkbox);
      item.appendChild(label);
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading mappings for overlay:', error);
    container.innerHTML = '<div style="color: #f44; text-align: center; padding: 20px;">Error loading gift mappings.</div>';
  }
}

// Generate overlay HTML file
async function generateOverlay() {
  try {
    // Get configuration
    const width = parseInt(document.getElementById('overlay-width').value) || 1080;
    const height = parseInt(document.getElementById('overlay-height').value) || 200;
    // Convert seconds to milliseconds for HTML generation
    const stagger = (parseFloat(document.getElementById('overlay-stagger').value) || 2) * 1000;
    const pause = (parseFloat(document.getElementById('overlay-pause').value) || 30) * 1000;
    const continuousLoop = document.getElementById('overlay-continuous-loop').checked;

    // Get selected gifts
    const checkboxes = document.querySelectorAll('.overlay-gift-checkbox:checked');
    if (checkboxes.length === 0) {
      log('Please select at least one gift for the overlay', 'error');
      return;
    }

    // Load current mappings to get action descriptions
    const result = await window.sniAPI.loadGiftMappings();
    if (!result.success || !result.mappings) {
      log('Failed to load gift mappings', 'error');
      return;
    }

    // Build gifts array for overlay
    const gifts = [];
    checkboxes.forEach(checkbox => {
      const giftName = checkbox.value;
      const mapping = result.mappings[giftName];
      if (!mapping) return;

      // Get action description
      let action = mapping.description || mapping.action;
      // Clean up action text (remove emoji, "Disable", etc.)
      action = action.replace(/^[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u, '').trim();
      action = action.replace(/^Disable\s+/i, '');

      // Find coin value for gift
      const coinValue = findCoinValueForGift(giftName);

      // Get image URL (with overrides applied) - use local paths for overlay
      let imageUrl = null;
      if (coinValue) {
        imageUrl = getCurrentImageUrl(giftName, coinValue, false); // false = use local paths
      }

      // If no image found, use fallback local path
      if (!imageUrl) {
        imageUrl = './gift-images/rose_1.webp'; // Rose as fallback (local)
      }

      gifts.push({
        name: giftName,
        action: action,
        img: imageUrl
      });
    });

    // Generate HTML content
    const html = generateOverlayHTML(gifts, width, height, stagger, pause, continuousLoop);

    // Save file via IPC
    const saveResult = await window.sniAPI.saveOverlayFile(html);
    if (saveResult.success) {
      log(`Overlay generated successfully! Saved to: ${saveResult.path}`, 'success');
    } else {
      log(`Failed to save overlay: ${saveResult.error}`, 'error');
    }
  } catch (error) {
    log(`Error generating overlay: ${error.message}`, 'error');
  }
}

// Generate overlay HTML content
function generateOverlayHTML(gifts, width, height, stagger, pause, continuousLoop = true) {
  const giftsJSON = JSON.stringify(gifts, null, 2);
  const count = gifts.length;
  const period = stagger * count;
  const loop = period + pause;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>ALttPR TikTok Gift Actions - Animated Overlay</title>
<style>
  :root{
    --w: ${width}px;
    --h: ${height}px;
    --img-size: 96px;
    --top-text-size: 18px;
    --name-text-size: 14px;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: var(--w);
    height: var(--h);
    overflow: hidden;
    background: transparent;
    color: #fff;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans";
  }

  .lane {
    position: relative;
    width: var(--w);
    height: var(--h);
    overflow: hidden;
    -webkit-mask-image: linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%);
    mask-image: linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%);
  }

  .item {
    position: absolute;
    top: 0;
    left: 0;
    display: grid;
    grid-template-rows: auto auto auto;
    justify-items: center;
    text-align: center;
    min-width: 170px;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,.7));
    will-change: transform;
  }

  .action {
    font-weight: 800;
    font-size: var(--top-text-size);
    line-height: 1.1;
    white-space: nowrap;
    text-shadow:
      0 0 6px rgba(0,0,0,.85),
      0 0 14px rgba(0,0,0,.55);
  }

  .pic {
    display: grid;
    place-items: center;
    height: calc(var(--img-size) + 8px);
    margin: 6px 0 2px;
  }

  .pic img {
    height: var(--img-size);
    width: auto;
    object-fit: contain;
    image-rendering: -webkit-optimize-contrast;
  }

  .name {
    font-size: var(--name-text-size);
    opacity: .9;
    letter-spacing: .2px;
    white-space: nowrap;
    text-shadow:
      0 0 6px rgba(0,0,0,.85),
      0 0 14px rgba(0,0,0,.55);
  }
</style>
</head>
<body>
  <div class="lane" id="lane" aria-label="TikTok Gift Actions"></div>

<script>
/* -------- CONFIG -------- */
const STAGGER_MS = ${stagger};
const PAUSE_MS   = ${pause};
const CONTINUOUS_LOOP = ${continuousLoop};

/* -------- DATA -------- */
const gifts = ${giftsJSON};

const lane = document.getElementById('lane');
const COUNT = gifts.length;
const PERIOD_MS = STAGGER_MS * COUNT;
const LOOP_MS   = CONTINUOUS_LOOP ? PERIOD_MS : (PERIOD_MS + PAUSE_MS);

function makeItem(g) {
  const el = document.createElement('div');
  el.className = 'item';

  const top = document.createElement('div');
  top.className = 'action';
  top.textContent = '"' + g.action.replace(/^Disable\\s+/i, "") + '"';

  const pic = document.createElement('div');
  pic.className = 'pic';
  const img = document.createElement('img');
  img.alt = g.name;
  img.src = g.img;
  pic.appendChild(img);

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = g.name;

  el.appendChild(top);
  el.appendChild(pic);
  el.appendChild(name);
  return el;
}

const els = gifts.map(makeItem);
els.forEach(el => lane.appendChild(el));

/* -------- MEASURE & ANIMATE -------- */
const TRAVEL_MS   = ${period};
const TAIL_GAP_PX = 100;

let laneW = 0;
let itemsW = new Array(COUNT).fill(220);

function measure() {
  laneW = lane.clientWidth;
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    itemsW[i] = Math.max(170, Math.ceil(r.width || 220));
  });
}

function positionAt(t) {
  for (let i = 0; i < COUNT; i++) {
    const start = i * STAGGER_MS;
    let phase = t - start;
    if (phase < 0) phase += PERIOD_MS;

    const el = els[i];
    const w = itemsW[i];
    const dist = laneW + w + TAIL_GAP_PX;

    if (phase >= 0 && phase <= TRAVEL_MS) {
      const p = phase / TRAVEL_MS;
      const x = laneW - p * dist;
      el.style.transform = 'translateX(' + x + 'px)';
      el.style.visibility = 'visible';
    } else {
      el.style.transform = 'translateX(' + (laneW + TAIL_GAP_PX) + 'px)';
      el.style.visibility = 'hidden';
    }
  }
}

let startEpoch = performance.now();
function tick(now) {
  const elapsed = now - startEpoch;
  const t = elapsed % LOOP_MS;

  if (CONTINUOUS_LOOP || t < PERIOD_MS) {
    positionAt(t);
  } else {
    els.forEach(el => {
      el.style.transform = 'translateX(' + (lane.clientWidth + TAIL_GAP_PX) + 'px)';
      el.style.visibility = 'hidden';
    });
  }
  requestAnimationFrame(tick);
}

function init() {
  measure();
  requestAnimationFrame(tick);
}
window.addEventListener('resize', measure);
window.addEventListener('load', init);
els.forEach(el => {
  const img = el.querySelector('img');
  img.addEventListener('load', measure, { once: true });
});
</script>
</body>
</html>`;
}

// ============= GIFT IMAGES MANAGER =============

// Get current image URL for a gift (from overrides or default)
// For UI previews, we use CDN URLs; for overlay generation, we use local paths
function getCurrentImageUrl(giftName, coinValue, forPreview = true) {
  const key = `${coinValue}-${giftName}`;
  // Check overrides first
  if (giftImageOverrides[key]) {
    return giftImageOverrides[key];
  }
  // Check default gift images
  if (forPreview && typeof getGiftImageCDN !== 'undefined') {
    // Use CDN for UI preview
    return getGiftImageCDN(giftName, coinValue);
  }
  if (typeof getGiftImageUrl !== 'undefined') {
    // Use local path for overlay generation
    return getGiftImageUrl(giftName, coinValue, !forPreview);
  }
  return null;
}

// Load gift image overrides
async function loadGiftImageOverrides() {
  try {
    const result = await window.sniAPI.loadGiftImageOverrides();
    if (result.success && result.overrides) {
      giftImageOverrides = result.overrides;
    }
  } catch (error) {
    console.error('Error loading gift image overrides:', error);
  }
}

// Save gift image overrides
saveImagesBtn.addEventListener('click', async () => {
  try {
    const inputs = document.querySelectorAll('.gift-image-url-input');
    const overrides = {};

    inputs.forEach(input => {
      const giftName = input.dataset.giftName;
      const coins = input.dataset.coins;
      const url = input.value.trim();
      const key = `${coins}-${giftName}`;

      if (url) {
        overrides[key] = url;
        // Update gift-images.js dynamically
        if (typeof addCustomGiftImage !== 'undefined') {
          addCustomGiftImage(giftName, parseInt(coins), url);
        }
      }
    });

    const result = await window.sniAPI.saveGiftImageOverrides(overrides);
    if (result.success) {
      giftImageOverrides = overrides;
      log(`Saved ${Object.keys(overrides).length} gift image URLs!`, 'success');
    } else {
      log(`Failed to save: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error saving gift images: ${error.message}`, 'error');
  }
});

// Populate gift images list
function populateGiftImagesList() {
  const container = document.getElementById('gift-images-list');
  if (!container) return;

  if (typeof TIKTOK_GIFTS === 'undefined') {
    container.innerHTML = '<div class="no-gifts-message">Gift database not loaded</div>';
    return;
  }

  // Get all unique gifts sorted by coin value
  const allGifts = [];
  Object.entries(TIKTOK_GIFTS).forEach(([coins, giftNames]) => {
    giftNames.forEach(name => {
      allGifts.push({ name, coins: parseInt(coins) });
    });
  });

  allGifts.sort((a, b) => a.coins - b.coins || a.name.localeCompare(b.name));

  if (allGifts.length === 0) {
    container.innerHTML = '<div class="no-gifts-message">No gifts found in database</div>';
    return;
  }

  container.innerHTML = '';
  allGifts.forEach(gift => {
    const currentUrl = getCurrentImageUrl(gift.name, gift.coins);

    const item = document.createElement('div');
    item.className = 'gift-image-item';

    // Preview
    const preview = document.createElement('div');
    preview.className = 'gift-image-preview';
    if (currentUrl) {
      const img = document.createElement('img');
      img.src = currentUrl;
      img.alt = gift.name;
      img.onerror = () => {
        preview.innerHTML = '<span>❌<br>Failed</span>';
        preview.classList.add('no-image');
      };
      preview.appendChild(img);
    } else {
      preview.innerHTML = '<span>No Image</span>';
      preview.classList.add('no-image');
    }

    // Info
    const info = document.createElement('div');
    info.className = 'gift-image-info';

    const nameSpan = document.createElement('div');
    nameSpan.className = 'gift-image-name';
    nameSpan.textContent = gift.name;

    const coinsSpan = document.createElement('div');
    coinsSpan.className = 'gift-image-coins';
    coinsSpan.textContent = `${gift.coins} 💰`;

    info.appendChild(nameSpan);
    info.appendChild(coinsSpan);

    // URL Input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'gift-image-url-input';
    input.placeholder = 'https://p16-webcast.tiktokcdn.com/img/...';
    input.value = currentUrl || '';
    input.dataset.giftName = gift.name;
    input.dataset.coins = gift.coins;

    // Update preview on input change
    input.addEventListener('change', () => {
      const newUrl = input.value.trim();
      preview.innerHTML = '';
      preview.classList.remove('no-image');

      if (newUrl) {
        const img = document.createElement('img');
        img.src = newUrl;
        img.alt = gift.name;
        img.onerror = () => {
          preview.innerHTML = '<span>❌<br>Invalid</span>';
          preview.classList.add('no-image');
        };
        preview.appendChild(img);
      } else {
        preview.innerHTML = '<span>No Image</span>';
        preview.classList.add('no-image');
      }
    });

    // Actions
    const actions = document.createElement('div');
    actions.className = 'gift-image-actions';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn-clear-image';
    clearBtn.textContent = '🗑️ Clear';
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.dispatchEvent(new Event('change'));
    });

    actions.appendChild(clearBtn);

    item.appendChild(preview);
    item.appendChild(info);
    item.appendChild(input);
    item.appendChild(actions);
    container.appendChild(item);
  });
}
