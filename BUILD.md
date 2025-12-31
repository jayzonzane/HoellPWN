# 🏗️ Zane's World - Build Instructions

Instructions for building release executables of Zane's World.

---

## 📋 Pre-Build Checklist

### Code Readiness
- [x] All 65 SMW operations implemented
- [x] UI updated with Mario theme
- [x] Threshold actions configured
- [x] Memory map complete (150+ addresses)
- [x] Git commits clean and organized
- [x] Documentation complete (README, CHANGELOG, QUICK_START)
- [x] Build configuration verified in package.json
- [ ] Icon.png replaced with Mario-themed icon (optional)

### Testing Status
- [ ] Manual testing with RetroArch + SNI
- [ ] All power-up operations verified
- [ ] Enemy spawning tested
- [ ] Physics chaos tested
- [ ] Level warping tested
- [ ] Timer-based effects verified
- [ ] TikTok gift integration tested
- [ ] Threshold system tested

---

## 🔧 Building from Source

### Prerequisites
```bash
# Install Node.js 18+ (https://nodejs.org/)
# Verify installation:
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### Install Dependencies
```bash
cd /path/to/Zanesworld
npm install
```

This will install:
- `electron` (v38.2.2)
- `electron-builder` (v25.1.8)
- `@grpc/grpc-js` (v1.14.0)
- `@grpc/proto-loader` (v0.8.0)

---

## 🚀 Build Commands

### Windows Portable Executable (Recommended)
```bash
npm run dist:win
```

**Output**: `dist/Zanes_World.exe` (portable, no installer needed)

**Size**: ~150-200 MB (includes Electron runtime)

**Advantages**:
- Single executable
- No installation required
- Can run from USB drive
- Perfect for streaming setups

### Windows Installer (NSIS)
```bash
npm run dist
```

**Output**:
- `dist/Zanes World Setup X.X.X.exe` (installer)
- `dist/Zanes_World.exe` (portable)

**Installer Features**:
- Desktop shortcut creation
- Start menu entry
- Custom install directory
- Uninstaller included

### Linux Builds
```bash
# AppImage (portable)
npm run dist -- --linux AppImage

# Debian package
npm run dist -- --linux deb
```

**Output**:
- `dist/Zanes-World-X.X.X.AppImage`
- `dist/zanes-world_X.X.X_amd64.deb`

### macOS Builds
```bash
# DMG installer
npm run dist -- --mac dmg

# ZIP archive
npm run dist -- --mac zip
```

**Output**:
- `dist/Zanes World-X.X.X.dmg`
- `dist/Zanes World-X.X.X-mac.zip`

**Note**: Code signing required for Gatekeeper (see "Code Signing" below)

---

## 📦 Build Output Structure

After running `npm run dist:win`, you'll find:

```
dist/
├── Zanes_World.exe              # ← Portable executable (distribute this!)
├── Zanes World Setup X.X.X.exe  # Installer (if built)
├── win-unpacked/                # Unpacked app directory (for debugging)
│   ├── Zane's World.exe
│   ├── resources/
│   │   ├── app.asar             # Packed source code
│   │   └── bin/                 # SNI executable
│   └── ...
└── builder-effective-config.yaml # Build configuration used
```

---

## 🔍 Verifying the Build

### 1. File Size Check
```bash
ls -lh dist/Zanes_World.exe
```
Expected: ~150-200 MB

### 2. Test Launch
```bash
# Double-click Zanes_World.exe or run:
./dist/Zanes_World.exe
```

Should launch without errors.

### 3. Check Version
- Launch app
- Open DevTools: `Ctrl+Shift+I`
- Check console for version number

### 4. Smoke Test
- Connect to SNI
- Test one action (e.g., "Give Mushroom")
- Verify it affects RetroArch

---

## ⚙️ Build Configuration

Located in `package.json` under `"build"`:

### Key Settings

**App Identity**
```json
{
  "appId": "com.zanesworld.crowd-control",
  "productName": "Zane's World"
}
```

**Files to Include**
```json
{
  "files": [
    "main.js",
    "preload.js",
    "renderer/**/*",
    "src/**/*",
    "assets/**/*",
    "package.json",
    "bin/**/*"
  ]
}
```

**Extra Resources** (SNI binary)
```json
{
  "extraResources": [
    { "from": "bin", "to": "bin" }
  ]
}
```

**Windows Target**
```json
{
  "win": {
    "target": ["nsis", "portable"],
    "icon": "assets/icon.png"
  }
}
```

**Portable Settings**
```json
{
  "portable": {
    "artifactName": "Zanes_World.exe"
  }
}
```

---

## 🔐 Code Signing (Optional)

### Windows
```json
{
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password",
    "signAndEditExecutable": true
  }
}
```

**Without signing**: Users may see SmartScreen warnings (normal for unsigned apps)

### macOS
```json
{
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAMID)"
  }
}
```

**Required for**: Gatekeeper bypass (app runs without warning)

---

## 📝 Release Process

### 1. Update Version
Edit `package.json`:
```json
{
  "version": "1.0.0"  // Change to 1.1.0, 2.0.0, etc.
}
```

### 2. Update CHANGELOG
Add new version section to `CHANGELOG.md`:
```markdown
## [1.1.0] - 2025-01-15

### Added
- New feature X
- New operation Y

### Fixed
- Bug Z
```

### 3. Commit Version Bump
```bash
git add package.json CHANGELOG.md
git commit -m "Bump version to 1.1.0"
git tag v1.1.0
```

### 4. Build Release
```bash
npm run dist:win
```

### 5. Test Release Build
- Run `dist/Zanes_World.exe`
- Test all critical features
- Verify version number

### 6. Create GitHub Release
```bash
gh release create v1.1.0 \
  dist/Zanes_World.exe \
  --title "Zane's World v1.1.0" \
  --notes "See CHANGELOG.md for details"
```

Or upload manually via GitHub web interface.

---

## 🐛 Troubleshooting Build Issues

### "npm ERR! ENOENT: no such file"
**Solution**: Run `npm install` first

### "electron-builder not found"
**Solution**:
```bash
npm install --save-dev electron-builder
```

### "EACCES: permission denied"
**Solution** (Linux/Mac):
```bash
sudo npm install --unsafe-perm=true
```

### Build hangs at "packaging"
**Solution**:
- Close antivirus temporarily
- Ensure enough disk space (~2GB free)
- Delete `dist/` and `node_modules/` folders, rebuild

### "Code signing required" (macOS)
**Solution**:
- Disable code signing for testing:
```json
{
  "mac": {
    "identity": null
  }
}
```
- For distribution: Get Apple Developer certificate

### Large build size (>300MB)
**Solution**: This is normal for Electron apps (includes Chromium + Node.js)

---

## 📊 Build Performance

Typical build times (Windows 10, i7 CPU, SSD):
- **First build**: 3-5 minutes
- **Subsequent builds**: 1-2 minutes (cached dependencies)
- **Clean build**: 3-5 minutes (`npm run dist -- --clean`)

---

## 🎯 Distribution Recommendations

### For End Users
✅ **Distribute**: `dist/Zanes_World.exe` (portable)
- No installation required
- Easy to update (just replace file)
- Works from any location

### For Power Users
✅ **Distribute**: `dist/Zanes World Setup X.X.X.exe` (installer)
- Professional installation experience
- Auto-updates support (if configured)
- Start menu/desktop shortcuts

### File Hosting
- **GitHub Releases**: Best for open-source projects
- **Google Drive**: Easy sharing, no account required for downloads
- **Dropbox**: Direct download links
- **Self-hosted**: Full control, requires web server

---

## 🔄 Auto-Update Support (Future)

To enable auto-updates, configure:

```json
{
  "publish": {
    "provider": "github",
    "owner": "yourusername",
    "repo": "zanesworld"
  }
}
```

Then use `electron-updater` in `main.js`:
```javascript
const { autoUpdater } = require('electron-updater');
autoUpdater.checkForUpdatesAndNotify();
```

---

## ✅ Final Checklist Before Distribution

- [ ] Version number updated in package.json
- [ ] CHANGELOG updated with new version
- [ ] All features tested
- [ ] README reflects current features
- [ ] Build succeeds without errors
- [ ] Portable executable launches and connects to SNI
- [ ] All 65 operations work in test environment
- [ ] File size reasonable (~150-200MB)
- [ ] Git tagged with version (e.g., `v1.0.0`)
- [ ] Release notes written
- [ ] Executable uploaded to distribution platform

---

## 📞 Support

For build issues:
1. Check this document first
2. Search electron-builder docs: https://www.electron.build/
3. Check Node.js version compatibility
4. Verify all dependencies installed

---

**🍄 Happy Building! 🏗️**
