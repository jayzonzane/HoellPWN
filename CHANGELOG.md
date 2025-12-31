# Changelog

All notable changes to Zane's World will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-31

### 🎉 Initial Release

#### Added - Core Features
- Complete Super Mario World crowd control system
- TikTok gift integration via HoellStream
- SNI (SNES Network Interface) support for RetroArch
- Real-time memory manipulation for SMW gameplay
- Threshold system for cumulative gift triggers
- Gift mapping interface for custom action assignments
- Archived gift auto-restoration on startup
- Live activity logging

#### Added - Game Operations (65 total)

**Core Actions (5)**
- KO Mario
- Add/Remove Life
- Add/Remove Coins (with auto-life conversion at 100 coins)

**Power-Ups (6)**
- Give Mushroom (smart reserve handling)
- Give Fire Flower
- Give Cape Feather
- Give Star Power (configurable duration)
- Downgrade Power-up
- Activate P-Switch (configurable duration)

**Yoshi (2)**
- Give Yoshi (4 color options: Green/Red/Blue/Yellow)
- Remove Yoshi

**Individual Enemy Spawns (10)**
- Spawn Random Enemy
- Spawn Boo Circle
- Spawn Thwomp
- Spawn Chargin' Chuck
- Spawn Bob-omb
- Spawn Magikoopa
- Spawn Dry Bones
- Spawn Rex
- Spawn Wiggler
- Clear All Enemies

**Enemy Waves (6)**
- Enemy Wave (continuous spawning)
- Koopa Wave
- Buzzy Beetle Wave
- Piranha Plant Wave
- Bullet Bill Barrage
- Spawn Boss (configurable boss type)

**Enemy Effects (2)**
- Make Enemies Invisible (timed)
- Double Enemy Speed (timed)

**Level Warping (10)**
- Warp to World 1-7
- Warp to Star World
- Warp to Bowser's Castle
- Random Level Warp

**Physics Chaos (15)**
- Half/Double Speed (timed)
- Moon/Tiny Jump (timed)
- Low/High Gravity (timed)
- Reverse Controls (timed)
- Ice Physics (timed)
- Disable Running (timed)
- Force Continuous Run (timed)
- Random Physics Chaos (timed)

#### Added - Technical Infrastructure
- **Memory Map**: 150+ SMW memory addresses documented
  - Player state (power-up, lives, coins, timer, reserve)
  - Sprite tables (12 normal + 10 extended + 12 minor extended)
  - Physics (velocity, gravity, P-meter, jump state)
  - Level state (current level, world, checkpoint)
  - Yoshi state (presence, color, berry counter)
  - Camera and OAM tables

- **Operations System**: Complete rewrite from HoellPWN base
  - 65 SMW-specific operation methods
  - Helper functions: getMarioPosition, findEmptySpriteSlot, spawnSpriteAtPosition
  - Retry logic: readWithRetry, writeWithRetry (3 attempts, 100ms delay)
  - Timer management: activeTimers Map for timed effects
  - 60fps intervals for smooth physics modifications
  - Automatic cleanup on effect expiration

- **UI/UX**: Mario-themed interface
  - 7 rows of categorized action buttons
  - Red/green/gold Mario color scheme
  - Collapsible action categories
  - Activity log with timestamps
  - Gift settings modal for mapping
  - Threshold configuration interface
  - Archived gifts viewer

#### Added - Documentation
- Comprehensive README.md
- Setup instructions (RetroArch + SNI + TikTok)
- Complete feature documentation
- Testing guide with recommended test order
- Troubleshooting section
- Development guide
- Project structure overview

#### Changed from HoellPWN
- Application name: "SNES Controller" → "Zane's World"
- Product name: "HoellPWN" → "Zane's World"
- Executable: "SNES_Controller.exe" → "Zanes_World.exe"
- App ID: "com.example.app" → "com.zanesworld.crowd-control"
- Version reset: 1.11.2 → 1.0.0
- Complete memory map replacement (ALTTP → SMW)
- Complete operations replacement (60 ALTTP → 65 SMW)
- Complete UI replacement (ALTTP categories → SMW categories)
- CSS theme: Zelda green → Mario red/green/gold

#### Technical Details
- Electron: 38.2.2
- Node gRPC: 1.14.0
- SNI Version: v0.0.102a
- Target Game: Super Mario World (US 1.0)
- Memory Base: 0x7E0000 (SNES WRAM)
- Sprite Slots: 12 normal, 10 extended, 12 minor extended
- Effect Timing: 60fps intervals (16ms) for physics
- Enemy Wave Interval: 2000ms spawns

#### Known Limitations
- Requires RetroArch with network commands enabled
- Requires SNI running in background
- Some ROM hacks may use different memory addresses
- Operations queued during level transitions
- Maximum 12 normal sprite slots (hardware limit)
- Timer-based effects use client-side intervals

#### Supported Platforms
- Windows x64 (primary target)
- Linux (AppImage, deb)
- macOS (dmg, zip)

---

## [Unreleased]

### TODO
- [ ] Replace icon.png with Mario-themed icon
- [ ] Add sprite slot monitoring indicator
- [ ] Add support for extended sprite operations
- [ ] Add level-specific spawn restrictions
- [ ] Add ROM hack compatibility checker
- [ ] Add automatic RetroArch detection
- [ ] Add built-in SNI launcher
- [ ] Add gift sound effects
- [ ] Add on-screen overlay option

### Future Enhancements
- Multiple game support (SMW hacks, other SNES games)
- Custom memory address editor
- Macro system for action combos
- Cooldown system per action
- User-defined random pools
- Save/load action configurations
- Replay system for gift sequences

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes, major feature additions
- **Minor (1.X.0)**: New operations, UI enhancements, backward-compatible
- **Patch (1.0.X)**: Bug fixes, documentation, minor tweaks

---

**[1.0.0]**: Initial release - 2024-12-31
