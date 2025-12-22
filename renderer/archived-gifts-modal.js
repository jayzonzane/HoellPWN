/**
 * Archived Gifts Modal - View and manage archived gifts
 * Allows users to restore or permanently delete archived gifts
 */

// Show the archived gifts modal
async function showArchivedGiftsModal() {
  try {
    // Load archived gifts
    const result = await window.sniAPI.loadArchivedGifts();

    if (!result.success) {
      log('Failed to load archived gifts: ' + result.error, 'error');
      return;
    }

    const archivedGifts = result.archivedGifts.gifts || [];

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'archived-gifts-modal';

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
        <div class="modal-header">
          <h2>Archived Gifts (${archivedGifts.length})</h2>
          <button class="close-btn" onclick="closeArchivedGiftsModal()">&times;</button>
        </div>

        <div class="modal-body" style="overflow-y: auto; max-height: calc(80vh - 150px);">
          <p style="margin-bottom: 20px; color: #888;">
            These gifts are no longer available on TikTok but are kept for reference.
            You can restore them to active gifts or permanently delete them.
          </p>

          <div class="archived-search" style="margin-bottom: 15px;">
            <input type="text"
                   id="archived-search-input"
                   placeholder="Search archived gifts..."
                   style="width: 100%; padding: 8px; border: 1px solid #444; background: #2a2a2a; color: #fff; border-radius: 4px;">
          </div>

          <div id="archived-gifts-list" class="archived-gifts-container">
            ${archivedGifts.length === 0
              ? '<p style="text-align: center; color: #888; padding: 40px;">No archived gifts</p>'
              : renderArchivedGifts(archivedGifts)
            }
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: space-between;">
          <button class="btn-secondary" onclick="closeArchivedGiftsModal()">Close</button>
          ${archivedGifts.length > 0 ? '<button class="btn-danger" onclick="confirmRestoreAll()">Restore All</button>' : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add search functionality
    if (archivedGifts.length > 0) {
      const searchInput = document.getElementById('archived-search-input');
      searchInput.addEventListener('input', (e) => {
        filterArchivedGifts(e.target.value, archivedGifts);
      });
    }

    // Show modal with animation
    setTimeout(() => modal.classList.add('show'), 10);

  } catch (error) {
    log('Error showing archived gifts modal: ' + error.message, 'error');
  }
}

// Render archived gifts list
function renderArchivedGifts(gifts) {
  return gifts.map(gift => `
    <div class="archived-gift-card" data-gift-name="${gift.name}" data-gift-coins="${gift.coins}">
      <div class="archived-gift-info">
        <div class="archived-gift-image">
          <img src="${gift.imageUrl || './gift-images/placeholder.webp'}"
               alt="${gift.name}"
               style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px; background: #1a1a1a;"
               onerror="this.src='./gift-images/rose_1.webp'">
        </div>
        <div class="archived-gift-details">
          <div class="archived-gift-name">${gift.name}</div>
          <div class="archived-gift-meta">
            <span class="gift-coins">${gift.coins} coins</span>
            <span class="separator">•</span>
            <span class="archived-date">Archived: ${formatDate(gift.archivedDate)}</span>
          </div>
          <div class="archived-reason">
            Reason: ${formatReason(gift.reason)}
          </div>
        </div>
      </div>
      <div class="archived-gift-actions">
        <button class="btn-small btn-success" onclick="restoreGift('${escapeHtml(gift.name)}', ${gift.coins})">
          ↩️ Restore
        </button>
        <button class="btn-small btn-danger" onclick="deleteGift('${escapeHtml(gift.name)}', ${gift.coins})">
          🗑️ Delete
        </button>
      </div>
    </div>
  `).join('');
}

// Filter archived gifts by search term
function filterArchivedGifts(searchTerm, allGifts) {
  const filtered = allGifts.filter(gift =>
    gift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gift.coins.toString().includes(searchTerm)
  );

  const container = document.getElementById('archived-gifts-list');
  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #888; padding: 40px;">No gifts match your search</p>';
  } else {
    container.innerHTML = renderArchivedGifts(filtered);
  }
}

// Restore a single gift
async function restoreGift(giftName, coins) {
  if (!confirm(`Restore "${giftName}" (${coins} coins) to active gifts?`)) {
    return;
  }

  try {
    log(`Restoring ${giftName}...`, 'info');
    const result = await window.sniAPI.restoreArchivedGift(giftName, coins);

    if (result.success) {
      log(`✅ ${giftName} restored successfully!`, 'success');

      // Remove from UI
      const card = document.querySelector(`[data-gift-name="${giftName}"][data-gift-coins="${coins}"]`);
      if (card) {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => card.remove(), 300);
      }

      // Update count in header
      updateArchivedCount();

    } else {
      log(`Failed to restore ${giftName}: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error restoring gift: ${error.message}`, 'error');
  }
}

// Delete a gift permanently
async function deleteGift(giftName, coins) {
  if (!confirm(`Permanently delete "${giftName}" (${coins} coins) from archive?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    log(`Deleting ${giftName} from archive...`, 'info');
    const result = await window.sniAPI.deleteArchivedGift(giftName, coins);

    if (result.success) {
      log(`🗑️ ${giftName} deleted from archive`, 'success');

      // Remove from UI
      const card = document.querySelector(`[data-gift-name="${giftName}"][data-gift-coins="${coins}"]`);
      if (card) {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => card.remove(), 300);
      }

      // Update count in header
      updateArchivedCount();

    } else {
      log(`Failed to delete ${giftName}: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error deleting gift: ${error.message}`, 'error');
  }
}

// Confirm restore all gifts
async function confirmRestoreAll() {
  if (!confirm('Restore ALL archived gifts to active database?\n\nThis will make all archived gifts available again.')) {
    return;
  }

  try {
    const result = await window.sniAPI.loadArchivedGifts();
    if (!result.success) {
      log('Failed to load archived gifts', 'error');
      return;
    }

    const gifts = result.archivedGifts.gifts || [];
    let restored = 0;
    let failed = 0;

    log(`Restoring ${gifts.length} gifts...`, 'info');

    for (const gift of gifts) {
      const restoreResult = await window.sniAPI.restoreArchivedGift(gift.name, gift.coins);
      if (restoreResult.success) {
        restored++;
      } else {
        failed++;
      }
    }

    log(`✅ Restored ${restored} gifts${failed > 0 ? `, ${failed} failed` : ''}`, 'success');

    // Close modal and refresh
    closeArchivedGiftsModal();

  } catch (error) {
    log(`Error restoring all gifts: ${error.message}`, 'error');
  }
}

// Update archived gifts count in header
function updateArchivedCount() {
  const cards = document.querySelectorAll('.archived-gift-card');
  const count = cards.length;
  const header = document.querySelector('#archived-gifts-modal h2');
  if (header) {
    header.textContent = `Archived Gifts (${count})`;
  }

  // If no gifts left, show empty message
  if (count === 0) {
    const container = document.getElementById('archived-gifts-list');
    if (container) {
      container.innerHTML = '<p style="text-align: center; color: #888; padding: 40px;">No archived gifts</p>';
    }
    // Hide restore all button
    const restoreAllBtn = document.querySelector('.btn-danger');
    if (restoreAllBtn) {
      restoreAllBtn.style.display = 'none';
    }
  }
}

// Close the modal
function closeArchivedGiftsModal() {
  const modal = document.getElementById('archived-gifts-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// Utility: Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Utility: Format reason
function formatReason(reason) {
  const reasons = {
    'removed_from_tiktok': 'Removed from TikTok',
    'coin_value_changed': 'Coin value changed',
    'manual': 'Manually archived'
  };
  return reasons[reason] || reason;
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add CSS styles for archived gifts modal
const archivedGiftsStyles = document.createElement('style');
archivedGiftsStyles.textContent = `
  .archived-gifts-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .archived-gift-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 8px;
    transition: all 0.3s;
  }

  .archived-gift-card:hover {
    background: #333;
    border-color: #555;
  }

  .archived-gift-info {
    display: flex;
    gap: 15px;
    align-items: center;
    flex: 1;
  }

  .archived-gift-details {
    flex: 1;
  }

  .archived-gift-name {
    font-size: 16px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 5px;
  }

  .archived-gift-meta {
    font-size: 13px;
    color: #888;
    margin-bottom: 5px;
  }

  .archived-gift-meta .separator {
    margin: 0 8px;
  }

  .gift-coins {
    color: #ffd700;
    font-weight: 500;
  }

  .archived-reason {
    font-size: 12px;
    color: #aaa;
    font-style: italic;
  }

  .archived-gift-actions {
    display: flex;
    gap: 8px;
  }

  .btn-small {
    padding: 6px 12px;
    font-size: 13px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-success {
    background: #28a745;
    color: white;
  }

  .btn-success:hover {
    background: #218838;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background: #c82333;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-secondary:hover {
    background: #5a6268;
  }
`;
document.head.appendChild(archivedGiftsStyles);
