// Toast Notification System for Item Restoration

class ToastManager {
  constructor() {
    this.container = null;
    this.toastCounter = 0;
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
      const container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = document.querySelector('.toast-container');
    }
  }

  /**
   * Show a toast notification
   * @param {Object} options - Toast options
   * @param {string} options.type - 'disable' or 'restore'
   * @param {string} options.itemName - Display name of the item
   * @param {number} options.duration - Duration in seconds (for disable toast)
   * @param {number} options.autoHideDuration - How long to show toast (ms) - null = stay until dismissed
   */
  show(options) {
    const {
      type = 'disable',
      itemName = 'Item',
      duration = 60,
      autoHideDuration = null
    } = options;

    const toastId = `toast-${++this.toastCounter}`;
    const toast = this.createToast(toastId, type, itemName, duration);

    this.container.appendChild(toast);

    // Auto-hide after duration (disable = stay until dismissed, restore = 5s)
    if (autoHideDuration !== null) {
      setTimeout(() => {
        this.hide(toastId);
      }, autoHideDuration);
    }

    return toastId;
  }

  /**
   * Show item disable notification
   * @param {string} itemName - Display name of item
   * @param {number} duration - Duration in seconds
   * @returns {string} Toast ID
   */
  showDisable(itemName, duration) {
    return this.show({
      type: 'disable',
      itemName,
      duration,
      autoHideDuration: duration * 1000 // Auto-hide after the configured duration
    });
  }

  /**
   * Show item restore notification
   * @param {string} itemName - Display name of item
   * @returns {string} Toast ID
   */
  showRestore(itemName) {
    return this.show({
      type: 'restore',
      itemName,
      duration: 0,
      autoHideDuration: 5000 // Auto-hide after 5 seconds
    });
  }

  /**
   * Create toast element
   * @private
   */
  createToast(toastId, type, itemName, duration) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = toastId;

    const icon = type === 'disable' ? '🚫' : '✅';
    const title = type === 'disable'
      ? `${itemName} Disabled`
      : `${itemName} Restored`;
    const message = type === 'disable'
      ? `Item removed for ${duration} seconds`
      : 'Item has been restored to inventory';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="toastManager.hide('${toastId}')">&times;</button>
    `;

    return toast;
  }

  /**
   * Hide a toast notification
   * @param {string} toastId - ID of toast to hide
   */
  hide(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;

    toast.classList.add('toast-exiting');

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Hide all toasts
   */
  hideAll() {
    const toasts = this.container.querySelectorAll('.toast');
    toasts.forEach(toast => {
      this.hide(toast.id);
    });
  }

  /**
   * Update an existing toast (useful for updating duration countdown)
   * @param {string} toastId - Toast ID to update
   * @param {Object} updates - Properties to update
   */
  update(toastId, updates) {
    const toast = document.getElementById(toastId);
    if (!toast) return;

    if (updates.message) {
      const messageEl = toast.querySelector('.toast-message');
      if (messageEl) {
        messageEl.textContent = updates.message;
      }
    }

    if (updates.title) {
      const titleEl = toast.querySelector('.toast-title');
      if (titleEl) {
        titleEl.textContent = updates.title;
      }
    }
  }
}

// Create global instance
const toastManager = new ToastManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = toastManager;
}
