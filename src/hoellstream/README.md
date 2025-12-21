# HoellStream Integration Module

This module integrates TikTok gift events from HoellStream into the ALTTP SNI Controller.

## Files

### `poller.js`
The main polling engine that:
- Polls HoellStream API every 2 seconds
- Tracks seen event IDs (prevents duplicate processing)
- Filters for gift events only
- Executes mapped game operations
- Handles errors gracefully

**Key Methods:**
- `start()` - Begin polling
- `stop()` - Stop polling
- `clearSeenEvents()` - Reset cache (testing)
- `getStats()` - Get polling statistics

### `gift-mappings.js`
Configuration file that maps TikTok gift names to game actions.

**Current Mappings:**
- `Galaxy` → `killPlayer` (KO the player)

**To Add More Gifts:**
```javascript
'GiftName': {
  action: 'methodName',        // Method from operations-expanded.js
  description: 'What it does',  // Human-readable description
  emoji: '🎁',                  // Icon for logs
  params: { key: value }        // Optional parameters
}
```

## API Contract

**Endpoint:** `http://localhost:3000/api/messages/stream`

**Expected Response:**
```json
{
  "count": 4,
  "events": [
    {
      "id": "tiktok_gift_1760408178571_wps0zy49u",
      "platform": "tiktok",
      "type": "gift",
      "username": "username",
      "displayName": "DisplayName",
      "giftName": "Galaxy",
      "amount": 1,
      "diamondCount": 1,
      "timestamp": "2025-10-14T02:16:18.569Z"
    }
  ]
}
```

**Key Fields:**
- `id` - Unique event ID (used for duplicate detection)
- `type` - Event type (must be "gift")
- `giftName` - Name of the gift (case-sensitive)
- `timestamp` - ISO 8601 timestamp

## Configuration

Default configuration (can be overridden in main.js):
```javascript
{
  apiUrl: 'http://localhost:3000/api/messages/stream',
  pollIntervalMs: 2000,  // 2 seconds
  debugMode: true        // Verbose logging
}
```

## Logging Format

```
[HH:MM:SS.mmm] 🎁 HoellStream: Polling started
[HH:MM:SS.mmm] 🎁 HoellStream: Fetched 4 events
[HH:MM:SS.mmm] 🌌 Galaxy received from LordHoell → KO the player
[HH:MM:SS.mmm] ✅ KO the player completed successfully
[HH:MM:SS.mmm] ✋ Already processed event: tiktok_gift_XXX
[HH:MM:SS.mmm] ❓ Unknown gift: Rose from Username
[HH:MM:SS.mmm] ⚠️  HoellStream: API connection refused
```

## Error Handling

**API Unreachable:**
- Logs warning but continues polling
- App remains functional

**Invalid JSON:**
- Logs error and skips cycle
- Continues polling

**Game Operation Failure:**
- Logs error with details
- Continues processing other events

**No Device Connected:**
- Polling can start but operations will fail
- Graceful error messages

## Testing

See `HOELLSTREAM_INTEGRATION.md` in root directory for full testing guide.

**Quick Test:**
1. Start app: `npm start`
2. Connect device
3. Check console: Should see "Polling started"
4. Send Galaxy gift on TikTok
5. Link should die in-game

**Console Commands:**
```javascript
// Check status
await window.sniAPI.getHoellStreamStats()

// Toggle polling
await window.sniAPI.toggleHoellStream()

// Clear cache (allow re-processing same events)
await window.sniAPI.clearHoellStreamCache()
```

## Integration Points

**main.js:**
- Initializes poller on app start (line ~36)
- Starts polling when device selected (line ~65)
- Stops polling on app quit (line ~680)

**preload.js:**
- Exposes control functions to renderer (line ~102)

**operations-expanded.js:**
- All methods available as gift actions
- No modifications needed

## Performance

- **Memory:** ~1-2 MB for seen events cache
- **CPU:** Negligible (fetch every 2s)
- **Network:** ~500 bytes per request every 2s

## Future Enhancements

- [ ] Visual UI indicator when polling active
- [ ] Gift history log in UI
- [ ] Custom sound effects per gift
- [ ] Gift combos (multiple gifts trigger special action)
- [ ] Cooldowns (limit gift frequency)
- [ ] Gift queue (process one at a time with delays)
- [ ] Configuration UI for gift mappings
- [ ] Hot-reload gift mappings without restart
