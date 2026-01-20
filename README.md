# HoellPWN 1.1

A powerful SNES control application for A Link to the Past with gift integration, overlay generation, and advanced game manipulation features.

## 🎮 What's New

### Latest Updates (January 2026)

#### **Action Console & UI Improvements** `b6df269`
- ✅ **Fixed overlay selection persistence** - Gift overlay selections and custom text now persist when modifying individual gift mappings (no more reset on every change!)
- 📏 **Increased overlay list visibility** - Overlay gift selection now shows 6-8 items at once (up from 2) with 500px max-height
- ➕ **Action Console Popup Enhancement** - Added "Add Action" button to popup window with full category support:
  - Core operations (health, resources, basic functions)
  - Resources (rupees, bombs, arrows, keys)
  - Equipment (swords, shields, armor, items)
  - Toggle Items (boots, flippers, gloves, etc.)
  - Enemy Spawning (all enemy types)
- 🎯 **Equipment Reorganization** - Magic and Bottles now integrated into Equipment section (no longer separate)
- 📦 **Toggle Items Collapsible** - Toggle Items section can now be collapsed/expanded like other sections

#### **Threshold & Overlay Features** `5efd4bd` `233b6ab`
- 🎯 **Auto-sync threshold gifts to overlay** - When inline threshold mode is active, configured threshold gifts automatically appear in overlay selection
- 📊 **Inline threshold display mode** - New display option to show thresholds inline with regular gifts (separate mode still available)
- ⚡ **Improved threshold tracking** - Better synchronization between threshold configuration and overlay display

#### **Connection & Status Improvements** `3934dba` `e8ce21d`
- 🔌 **Connection status indicators** - Real-time connection status for HoellStream and SNI with visual feedback
- ✅ **Fixed HoellStream false connection status** - Resolved issue where connection appeared active when it wasn't
- 🚫 **Removed built-in SNI controller** - SNI must now be run externally on port 8191 (cleaner architecture)

#### **Overlay Builder Enhancements** `3e82a51`
- 💾 **Custom overlay save path** - Choose where to save your generated overlay HTML files
- 🪟 **Window position persistence** - Overlay and action console windows remember their position and size
- 🔄 **Reset to default path** - Easy button to restore default save location

#### **Gift Management System** `5326b6a` `b3db451` `70c0fa8` `dedf844`
- 🖼️ **Automatic gift image downloading** - Downloads all 331 gift images from TikTok CDN with progress tracking
- 📊 **Live database synchronization** - Real-time updates when gift database changes detected
- 🗄️ **Gift archival system** - Automatically archives removed gifts with restoration capability
- 📝 **Version history tracking** - View detailed change logs for gift database updates
- ↩️ **Archived gift restoration** - Restore previously removed gifts to mappings with one click
- 🔄 **Auto-refresh overlays** - Overlay builder automatically updates when gift mappings change

#### **UI Organization** `69d5414`
- 📂 **Collapsible action categories** - All action categories can be collapsed/expanded individually
- 🎛️ **Collapse All / Expand All** - Quick buttons to manage all sections at once
- 💾 **State persistence** - Section collapse states saved across sessions

---

## 🎁 Gift Integration

### Supported Platforms
- **HoellStream** - TikTok gift integration via streamtoearn.io
- **TikFinity** - Alternative TikTok gift platform support

### Features
- Gift-to-action mapping with 100+ operations
- Custom gift overlay generation with live updates
- Gift threshold tracking with progress bars
- Value-based and count-based thresholds
- Automatic gift database updates with archival

---

## 🕹️ SNES Control Features

### Game Operations
- Health & heart container management
- Resource control (rupees, bombs, arrows, keys)
- Equipment manipulation (swords, shields, armor, items)
- Item toggles (boots, flippers, gloves, moon pearl, etc.)
- Enemy spawning (100+ enemy types)
- Game state manipulation (save, load, reset)
- Location warps (dungeons, overworld locations)

### Advanced Features
- Timed item disables
- Chicken attack waves
- Enemy swarm events
- Invisible enemies
- Golden Gauntlet mode (items cost rupees)
- Random item roulettes
- Chaos modes

---

## 🎨 Overlay Builder

### Customization Options
- **Display Modes**: Separate or inline threshold display
- **Style Presets**: Bold & Bright, Elegant Stream, Retro Gaming, Minimal Clean
- **Custom Styling**:
  - Font family & size
  - Background colors & transparency
  - Text colors & glow effects
  - Threshold bar colors
- **Layout Control**: Width, height, stagger timing, pause duration, spacing
- **Gift Selection**: Checkbox selection with reordering and custom text
- **Auto-refresh**: Automatically updates when mappings change

---

## 🔧 Configuration

### Connection Setup
1. **SNI (SNI Connector)**
   - Run SNI externally on port 8191
   - Supports QUsb2Snes, Retroarch, sd2snes, and more

2. **Gift Sources**
   - HoellStream: Connect via room code
   - TikFinity: (Future support)

### Gift Mapping
- Map TikTok gifts to SNES operations
- Configure thresholds for milestone events
- Create custom action console layouts
- Download and manage gift images

---

## 📦 Installation

1. Download the latest release
2. Run `SNES Controller Setup 1.11.0.exe` or `SNES_Controller.exe` (portable)
3. Ensure SNI is running on port 8191
4. Configure your gift source connection
5. Map gifts to actions
6. Generate your overlay
7. Add overlay to OBS as Browser Source

---

## 🛠️ Development

### Tech Stack
- Electron (desktop application)
- Node.js backend
- SNI gRPC integration
- Server-Sent Events (SSE) for real-time updates

### Building from Source
```bash
npm install
npm run dist
```

---

## 📋 Version History

### v1.11.0 (Current)
- Complete gift update and archival system
- Overlay auto-refresh and customization
- Connection status indicators
- Action console improvements
- UI organization enhancements

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

## 📄 License

[Add your license here]

---

## 🙏 Credits

Built with Claude Sonnet 4.5 assistance

---

## 🐛 Known Issues

None currently reported. Please submit issues via GitHub if you encounter problems.

---

## 📧 Support

For questions, issues, or feature requests, please open a GitHub issue.
