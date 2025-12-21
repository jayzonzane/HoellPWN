// Gift name to game action mappings
// NOTE: Mappings are now configured via the Settings Modal UI
// This file is kept for backwards compatibility but mappings are loaded from gift-mappings.json

const GIFT_MAPPINGS = {
  // Hardcoded test mapping (commented out - use Settings Modal instead):
  /*
  'Rose': {
    action: 'killPlayer',
    description: 'KO the player',
    emoji: '🌹'
  },
  */

  // Future mappings - uncomment and modify as needed:
  /*
  'Galaxy': {
    action: 'addHeartContainer',
    description: 'Add a heart container',
    emoji: '🌌'
  },
  'GG': {
    action: 'applyStarterPack',
    description: 'Give starter pack',
    emoji: '🎮'
  },
  'TikTok': {
    action: 'addRupees',
    params: { amount: 100 },
    description: 'Add 100 rupees',
    emoji: '💰'
  },
  */
};

module.exports = { GIFT_MAPPINGS };
