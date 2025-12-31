# 🍄 Zane's World

**Super Mario World TikTok Crowd Control Application**

Zane's World is a crowd interaction tool that allows TikTok viewers to control Super Mario World gameplay through gift donations. Built on HoellStream infrastructure, it provides 65+ interactive actions that affect Mario, enemies, physics, and level progression in real-time.

---

## 🎮 Features

### Core Actions (5)
- **💀 KO Mario** - Instantly defeat Mario
- **💚 Add Life** - Grant an extra life
- **💔 Remove Life** - Remove a life
- **🪙 Add Coins** - Add coins (default: 10, auto-converts to lives at 100)
- **💸 Remove Coins** - Remove coins

### Power-Ups (6)
- **🍄 Give Mushroom** - Transform small Mario to Super Mario (or store in reserve box)
- **🔥 Give Fire Flower** - Grant fire power-up
- **🪶 Give Cape Feather** - Grant cape power-up with flight ability
- **⭐ Give Star Power** - Temporary invincibility (configurable duration)
- **⬇️ Downgrade Power-up** - Remove current power-up
- **🅿️ Activate P-Switch** - Trigger P-Switch effect (configurable duration)

### Yoshi (2)
- **🦖 Give Yoshi** - Spawn Yoshi (supports color parameter: 0=Green, 1=Red, 2=Blue, 3=Yellow)
- **👋 Remove Yoshi** - Remove Yoshi

### Individual Enemy Spawns (10)
- **🎲 Spawn Random Enemy** - Spawn a random enemy near Mario
- **👻 Spawn Boo Circle** - Spawn a circle of Boos around Mario
- **🪨 Spawn Thwomp** - Spawn Thwomp above Mario
- **🏈 Spawn Chargin' Chuck** - Spawn aggressive Chargin' Chuck
- **💣 Spawn Bob-omb** - Spawn walking bomb enemy
- **🧙 Spawn Magikoopa** - Spawn magic-wielding Magikoopa
- **💀 Spawn Dry Bones** - Spawn reviving skeleton enemy
- **🦖 Spawn Rex** - Spawn Rex dinosaur enemy
- **🐛 Spawn Wiggler** - Spawn angry Wiggler
- **🧹 Clear All Enemies** - Remove all active enemies from screen

### Enemy Waves (6)
- **🌊 Enemy Wave** - Spawn enemies continuously for duration (default: 30s)
- **🐢 Koopa Wave** - Wave of Koopa Troopas
- **🪲 Buzzy Beetle Wave** - Wave of Buzzy Beetles
- **🌺 Piranha Plant Wave** - Wave of Piranha Plants
- **🔫 Bullet Bill Barrage** - Continuous Bullet Bill spawns
- **👑 Spawn Boss** - Spawn a boss enemy (supports boss type parameter)

### Enemy Effects (2)
- **👻 Make Enemies Invisible** - Turn all enemies invisible temporarily (default: 30s)
- **⚡ Double Enemy Speed** - Make all enemies move twice as fast (default: 20s)

### Level Warping (10)
- **🏝️ Warp to World 1** - Yoshi's Island
- **🍩 Warp to World 2** - Donut Plains
- **🏔️ Warp to World 3** - Vanilla Dome
- **🌉 Warp to World 4** - Twin Bridges Area
- **🌲 Warp to World 5** - Forest of Illusion
- **🍫 Warp to World 6** - Chocolate Island
- **🌋 Warp to World 7** - Valley of Bowser
- **⭐ Warp to Star World** - Secret star-themed levels
- **🏰 Warp to Bowser's Castle** - Final boss area
- **🎲 Random Level Warp** - Warp to a random level

### Physics Chaos - Speed & Movement (6)
- **🐌 Half Speed** - Reduce Mario's movement speed by 50% (default: 30s)
- **⚡ Double Speed** - Increase Mario's movement speed by 200% (default: 30s)
- **🌙 Moon Jump** - Extremely high jump height (default: 30s)
- **🐜 Tiny Jump** - Drastically reduced jump height (default: 30s)
- **🪶 Low Gravity** - Float longer in air (default: 30s)
- **🪨 High Gravity** - Fall faster, lower jumps (default: 30s)

### Physics Chaos - Controls & Special (5)
- **🔄 Reverse Controls** - Left becomes right, right becomes left (default: 20s)
- **❄️ Ice Physics** - Slippery ground, reduced traction (default: 30s)
- **🚫 Disable Running** - Prevent B-button dash (default: 20s)
- **🏃 Force Continuous Run** - Always running at max speed (default: 20s)
- **🎲 Random Physics Chaos** - Apply a random physics modifier (default: 30s)

---

## 🛠️ Technical Details

### Architecture
- **Platform:** Electron-based desktop application
- **Game Communication:** SNI (SNES Network Interface) via gRPC
- **Target Emulator:** RetroArch with bsnes core
- **Memory Base:** 0x7E0000 (SNES WRAM)
- **Supported Game:** Super Mario World (US 1.0, vanilla + ROM hacks)

### Memory Map
The application manipulates 150+ memory addresses including:
- **Player State:** Power-up status, lives, coins, reserve items
- **Sprite Tables:** 12 normal + 10 extended + 12 minor extended sprite slots
- **Physics:** X/Y velocity, gravity, P-meter, jump state
- **Level State:** Current level, world number, checkpoint, timer
- **Yoshi State:** Presence, color, berry counter
- **Camera:** X/Y position, layer scrolling

### Timer-Based Effects
Many actions use 60fps (16ms) intervals for smooth modifications:
- Physics modifiers update velocities in real-time
- Enemy waves spawn at 2-second intervals
- Timed effects automatically clean up after duration expires

### Gift Integration
- **TikTok Polling:** HoellStream SSE endpoint for live gift detection
- **Threshold System:** Trigger special actions when gift counts reach thresholds
- **Gift Mapping:** Map specific TikTok gifts to specific SMW actions
- **Archived Gifts:** Auto-restore archived gifts on startup
- **Database Sync:** Live synchronization with HoellStream gift database

---

## 📋 Prerequisites

### Required Software
1. **RetroArch** - SNES emulator
   - Download: [https://www.retroarch.com/](https://www.retroarch.com/)
   - Core required: `bsnes` (recommended) or `snes9x`

2. **SNI** - SNES Network Interface
   - Included in `bin/sni-v0.0.102a-windows-amd64/sni.exe`
   - Must be running before launching Zane's World

3. **Super Mario World ROM**
   - US 1.0 version recommended
   - Supports vanilla and ROM hacks

### Optional
- **HoellStream Account** - For TikTok gift integration
  - Visit: [https://streamtoearn.io](https://streamtoearn.io)
  - Configure TikTok username and webhook

---

## 🚀 Setup Instructions

### 1. Install RetroArch
1. Download and install RetroArch
2. Download the `bsnes` core: *Online Updater → Core Downloader → bsnes*
3. Load Super Mario World ROM
4. Enable network commands:
   - *Settings → Network → Network Commands* → **ON**
   - *Network Command Port:* `55355` (default)

### 2. Start SNI
1. Navigate to `bin/sni-v0.0.102a-windows-amd64/`
2. Run `sni.exe`
3. Verify it detects RetroArch connection
4. Leave running in background

### 3. Launch Zane's World
1. Run `Zanes_World.exe` (or `npm start` for development)
2. Go to **Settings** tab
3. Configure SNI connection:
   - **SNI Host:** `localhost`
   - **SNI Port:** `8191` (default)
4. Click **Connect to SNI**
5. Verify connection status shows "Connected"

### 4. Configure TikTok Integration (Optional)
1. Create HoellStream account at [streamtoearn.io](https://streamtoearn.io)
2. In Zane's World **Settings** tab:
   - Enter your **TikTok Username**
   - Click **Update Gifts from Database**
3. Go to **Gift Settings** tab
4. Map gifts to actions:
   - Select gift from dropdown
   - Choose action from list
   - Configure parameters (duration, amount, etc.)
   - Click **Save Mapping**

### 5. Configure Thresholds (Optional)
1. Go to **Thresholds** tab
2. Add threshold trigger:
   - **Gift Name:** Choose gift type
   - **Count:** Number of gifts needed
   - **Action:** Action to trigger
   - **Parameters:** Configure duration/amount
3. Click **Add Threshold**

---

## 🎯 Usage

### Manual Control
- Go to **Full Controls** tab
- Click action buttons to trigger effects immediately
- Perfect for testing or non-TikTok streams

### TikTok Live Stream
1. Start TikTok live stream
2. Enable **Start Polling** in Zane's World
3. Viewers send gifts → Actions trigger automatically
4. View live activity in **Activity Log**

### Threshold System
- Tracks cumulative gift counts per type
- Triggers special actions when thresholds are met
- Example: 5 roses → Warp to Bowser's Castle
- Resets can be configured per threshold

---

## 🧪 Testing

### Recommended Test Order

**1. Basic Power-Ups**
- Give Mushroom (small → super)
- Give Fire Flower
- Give Cape Feather
- Downgrade Power-up

**2. Core Actions**
- Add/Remove Lives
- Add/Remove Coins
- KO Mario (respawn test)

**3. Enemy Spawns**
- Spawn Random Enemy (verify near Mario)
- Spawn Boo Circle (verify positioning)
- Clear All Enemies

**4. Physics Chaos**
- Half Speed (verify movement)
- Moon Jump (verify jump height)
- Reverse Controls (verify left/right swap)
- Let timer expire, verify restoration

**5. Enemy Waves**
- Enemy Wave (verify continuous spawning)
- Koopa Wave
- Verify cleanup after duration

**6. Level Warping**
- Warp to World 1 (verify level change)
- Warp to Random Level
- Warp to Bowser's Castle

**7. Threshold System**
- Configure threshold (e.g., 3 gifts → Random Enemy)
- Send gifts manually via UI
- Verify threshold triggers at correct count

### Known Test Scenarios
- **During level transitions:** Some operations may be queued
- **During pause:** Memory writes may not take effect until unpause
- **Simultaneous actions:** Timer-based effects properly stack
- **Sprite slot limit:** Spawns fail gracefully when all 12 slots full

---

## 🐛 Troubleshooting

### "Failed to connect to SNI"
- **Solution:** Ensure `sni.exe` is running
- Check SNI port is `8191` (default)
- Verify RetroArch network commands enabled

### "Device not found"
- **Solution:** Ensure RetroArch is running with SMW loaded
- Restart SNI and reconnect
- Check RetroArch network command port is `55355`

### Actions don't affect game
- **Solution:** Verify SNI connection is active
- Check game is not paused
- Ensure correct memory addresses for ROM version
- Some ROM hacks may use different addresses

### Gift polling not working
- **Solution:** Check TikTok username is correct
- Verify HoellStream webhook is configured
- Check internet connection
- Try "Update Gifts from Database" button

### Timer-based effects stuck
- **Solution:** Effects auto-cleanup after duration
- Restart application to force cleanup
- Check console logs for errors

### Enemies not spawning
- **Solution:** Verify sprite slots available (max 12 normal)
- Some levels have spawn restrictions
- Try "Clear All Enemies" first

---

## 📁 Project Structure

```
Zanesworld/
├── main.js                          # Electron main process
├── preload.js                       # IPC bridge
├── package.json                     # App metadata & dependencies
├── renderer/
│   ├── index-full.html             # Main UI (7 rows of SMW actions)
│   ├── renderer-full.js            # UI logic & event handlers
│   ├── styles-full.css             # Mario-themed styling
│   ├── gift-settings-modal.js      # Gift mapping interface
│   ├── archived-gifts-modal.js     # Archived gifts UI
│   └── threshold-manager.js        # Threshold action definitions
├── src/
│   ├── sni/
│   │   ├── client.js               # SNI gRPC client
│   │   ├── memory-complete.js      # SMW memory addresses (150+)
│   │   └── operations-expanded.js  # SMW operations (65 methods)
│   ├── hoellstream/
│   │   └── poller.js               # TikTok gift polling
│   └── item-restoration/
│       └── restoration-manager.js  # Temporary effect manager
├── bin/
│   └── sni-v0.0.102a-windows-amd64/
│       └── sni.exe                 # SNI executable
└── assets/
    └── icon.png                    # App icon (TODO: Mario-themed)
```

---

## 🔧 Development

### Install Dependencies
```bash
npm install
```

### Run Development Mode
```bash
npm start
```

### Build Executable
```bash
# Windows
npm run dist:win

# Output: dist/Zanes_World.exe
```

### Adding New Operations
1. Add memory address to `src/sni/memory-complete.js`
2. Implement method in `src/sni/operations-expanded.js`
3. Add button to `renderer/index-full.html`
4. Add action to `renderer/threshold-manager.js` THRESHOLD_ACTIONS array
5. Test with RetroArch + SNI

---

## 🎨 Customization

### Changing Colors
Edit `renderer/styles-full.css`:
```css
body {
  background: linear-gradient(135deg, #E31C23 0%, #228B22 50%, #5CB85C 100%);
}
```

### Adding Custom Actions
See "Development" → "Adding New Operations"

### Custom Gift Mappings
Use **Gift Settings** UI to map any gift to any action with custom parameters

---

## 📝 Version History

### v1.0.0 (Current)
- Initial release
- 65 SMW operations across 7 categories
- Complete UI overhaul from HoellPWN
- Mario-themed branding and styling
- Full TikTok gift integration
- Threshold system support
- 150+ memory addresses documented

---

## 🙏 Credits

### Built On
- **HoellPWN** - Original ALTTP crowd control framework
- **HoellStream** - TikTok gift infrastructure ([streamtoearn.io](https://streamtoearn.io))
- **SNI** - SNES Network Interface by RedGuyyyy
- **RetroArch** - Multi-platform emulator

### Memory Research Sources
- [SMW Central Memory Map](https://www.smwcentral.net/?p=memorymap&game=smw&region=ram)
- [Data Crystal RAM Map](https://datacrystal.tcrf.net/wiki/Super_Mario_World_(SNES)/RAM_map)
- [SnesLab SMW Resource](https://sneslab.net/wiki/SMW_Resource_Memory_Map)
- [TASVideos Game Resources](https://tasvideos.org/GameResources/SNES/SuperMarioWorld)
- [SMW RAM Map (Google Sites)](https://sites.google.com/site/smwrammap/)

### Special Thanks
- Nintendo for Super Mario World
- SMW hacking community for documentation
- TikTok viewers for crowd interaction

---

## 📄 License

This project is for educational and entertainment purposes. Super Mario World is © Nintendo. No ROM files are included.

---

## 🔗 Links

- **HoellStream:** https://streamtoearn.io
- **SNI GitHub:** https://github.com/alttpo/sni
- **RetroArch:** https://www.retroarch.com
- **SMW Central:** https://www.smwcentral.net

---

## 🐞 Bug Reports

If you encounter issues:
1. Check troubleshooting section above
2. Verify RetroArch + SNI setup
3. Check console logs (F12 in app)
4. Document steps to reproduce
5. Note SMW ROM version/hack being used

---

**🍄 Enjoy Zane's World! Let your viewers control the chaos! 🎮**
