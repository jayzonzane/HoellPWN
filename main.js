const { app, BrowserWindow, ipcMain, protocol, net, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;

// We'll initialize these after creating the window
let mainWindow;
let sniClient;
let gameOps;
let expandedOps;
let hoellPoller;
let restorationManager;
let giftUpdater;
let sniProcess = null;

// Function to minimize SNI window using PowerShell
function minimizeSNIWindow() {
  try {
    const { exec } = require('child_process');
    // PowerShell script to find and minimize SNI window
    const psScript = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
          [DllImport("user32.dll")]
          public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
          [DllImport("user32.dll")]
          public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
        }
"@
      $hwnd = [Win32]::FindWindow($null, "sni")
      if ($hwnd -ne [IntPtr]::Zero) {
        [Win32]::ShowWindow($hwnd, 6) | Out-Null
        Write-Host "SNI window minimized"
      }
    `;

    exec(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
      if (error) {
        console.log('Could not minimize SNI window (this is normal if SNI has no window):', error.message);
      } else if (stdout) {
        console.log('📉', stdout.trim());
      }
    });
  } catch (error) {
    console.log('SNI window minimize skipped:', error.message);
  }
}

// Function to start SNI server
function startSNIServer() {
  return new Promise((resolve, reject) => {
    try {
      // In production, extraResources are in process.resourcesPath
      // In development, they're in __dirname
      const sniPath = app.isPackaged
        ? path.join(process.resourcesPath, 'bin', 'sni.exe')
        : path.join(__dirname, 'bin', 'sni.exe');
      console.log('🚀 Starting SNI server from:', sniPath);

      sniProcess = spawn(sniPath, [], {
        stdio: 'pipe',
        windowsHide: true
      });

      sniProcess.stdout.on('data', (data) => {
        console.log(`SNI: ${data.toString().trim()}`);
      });

      sniProcess.stderr.on('data', (data) => {
        console.error(`SNI Error: ${data.toString().trim()}`);
      });

      sniProcess.on('error', (error) => {
        console.error('Failed to start SNI:', error);
        reject(error);
      });

      sniProcess.on('exit', (code) => {
        console.log(`SNI process exited with code ${code}`);
        sniProcess = null;
      });

      // Give SNI time to start (2 seconds)
      setTimeout(() => {
        console.log('✅ SNI server should be ready');

        // Try to minimize SNI window after it starts
        minimizeSNIWindow();

        resolve();
      }, 2000);

    } catch (error) {
      console.error('Error starting SNI:', error);
      reject(error);
    }
  });
}

// Function to restart SNI server
async function restartSNIServer() {
  try {
    console.log('🔄 Restarting SNI server...');

    // Kill existing SNI process if running
    if (sniProcess) {
      console.log('🛑 Stopping existing SNI process...');
      sniProcess.kill();
      sniProcess = null;
      // Wait for process to fully terminate
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Start SNI server again
    await startSNIServer();

    // Wait a bit, then auto-connect
    setTimeout(() => {
      autoConnectSNI();
    }, 1000);

    return { success: true, message: 'SNI server restarted successfully' };
  } catch (error) {
    console.error('Failed to restart SNI:', error);
    return { success: false, error: error.message };
  }
}

// Function to auto-connect to SNI and select first device
async function autoConnectSNI() {
  try {
    console.log('🔌 Auto-connecting to SNI...');
    await sniClient.connect('localhost', 8191);
    const devices = await sniClient.listDevices();

    if (devices && devices.length > 0) {
      console.log(`📱 Found ${devices.length} device(s), auto-selecting first one...`);
      sniClient.selectDevice(devices[0]);

      // Start HoellStream polling when device is connected
      if (hoellPoller && !hoellPoller.isPolling) {
        hoellPoller.start();
        console.log('✅ HoellStream polling started');
      }

      // Start indoors monitoring for stored chicken attacks
      if (expandedOps) {
        expandedOps.startIndoorsMonitoring();
        console.log('🐔 Indoors monitoring started for stored chicken attacks');
      }

      // Notify renderer about successful connection
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('sni-auto-connected', {
          success: true,
          device: devices[0]
        });
      }

      console.log('✅ Auto-connected to device:', devices[0].uri);
    } else {
      console.log('⚠️ No devices found');
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('sni-auto-connected', {
          success: false,
          error: 'No devices found'
        });
      }
    }
  } catch (error) {
    console.error('❌ Auto-connect failed:', error.message);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('sni-auto-connected', {
        success: false,
        error: error.message
      });
    }
  }
}

function createWindow() {
  // Load saved window bounds or use defaults
  let windowBounds = {
    width: 900,
    height: 850
  };

  try {
    const savedBounds = require('fs').readFileSync(WINDOW_SETTINGS_FILE, 'utf8');
    const parsedBounds = JSON.parse(savedBounds);
    // Merge saved bounds with defaults
    windowBounds = { ...windowBounds, ...parsedBounds };
    console.log('📐 Loaded saved window position:', windowBounds);
  } catch (error) {
    // File doesn't exist on first run, use defaults
    console.log('📐 Using default window position');
  }

  mainWindow = new BrowserWindow({
    ...windowBounds,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  mainWindow.loadFile('renderer/index-full.html');

  // Save window bounds when moved or resized
  const saveWindowBounds = () => {
    const bounds = mainWindow.getBounds();
    require('fs').writeFileSync(WINDOW_SETTINGS_FILE, JSON.stringify(bounds, null, 2), 'utf8');
  };

  // Debounce to avoid excessive file writes
  let saveBoundsTimeout;
  const debouncedSave = () => {
    clearTimeout(saveBoundsTimeout);
    saveBoundsTimeout = setTimeout(saveWindowBounds, 500);
  };

  mainWindow.on('resize', debouncedSave);
  mainWindow.on('move', debouncedSave);

  // Save immediately on close
  mainWindow.on('close', saveWindowBounds);

  // Initialize SNI client after window is created
  const SNIClient = require('./src/sni/client');
  const GameOperations = require('./src/sni/operations');
  const ExpandedGameOperations = require('./src/sni/operations-expanded');
  const HoellStreamPoller = require('./src/hoellstream/poller');
  const ItemRestorationManager = require('./src/item-restoration/restoration-manager');
  const GiftUpdater = require('./src/gift-updater');

  sniClient = new SNIClient();
  gameOps = new GameOperations(sniClient);
  expandedOps = new ExpandedGameOperations(sniClient);

  // Initialize ItemRestorationManager
  restorationManager = new ItemRestorationManager(expandedOps);
  console.log('⏱️ ItemRestorationManager initialized');

  // Load TIKTOK_GIFTS database for the poller
  let giftDatabase = null;
  try {
    const { TIKTOK_GIFTS } = require('./renderer/tiktok-gifts.js');
    giftDatabase = TIKTOK_GIFTS;
    console.log('📚 Loaded TIKTOK_GIFTS database for poller');
  } catch (error) {
    console.error('⚠️ Failed to load TIKTOK_GIFTS database:', error);
  }

  // Initialize HoellStream poller (but don't start polling yet)
  // Pass both expandedOps and gameOps (basic operations like KO player)
  hoellPoller = new HoellStreamPoller(expandedOps, gameOps, {
    pollIntervalMs: 2000,
    debugMode: true,
    giftDatabase: giftDatabase
  });
  console.log('🎁 HoellStream poller initialized (polling will start when device connects)');

  // Connect restoration manager to poller
  hoellPoller.setRestorationManager(restorationManager);

  // Initialize Gift Updater
  giftUpdater = new GiftUpdater(app.getPath('userData'));
  console.log('🔄 GiftUpdater initialized');

  // Bootstrap gift database on first run
  initializeGiftDatabase();

  // Load gift mappings from file on startup
  loadGiftMappingsOnStartup();

  // Load threshold configs from file on startup
  loadThresholdConfigsOnStartup();

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// IPC Handlers
ipcMain.handle('connect-sni', async (event, host, port) => {
  try {
    await sniClient.connect(host, port);
    const devices = await sniClient.listDevices();
    return { success: true, devices };
  } catch (error) {
    console.error('Connection error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-device', async (event, deviceInfo) => {
  try {
    sniClient.selectDevice(deviceInfo);

    // Start HoellStream polling when device is connected
    if (hoellPoller && !hoellPoller.isPolling) {
      hoellPoller.start();
      console.log('✅ HoellStream polling started');
    }

    // Start indoors monitoring for stored chicken attacks
    if (expandedOps) {
      expandedOps.startIndoorsMonitoring();
      console.log('🐔 Indoors monitoring started for stored chicken attacks');
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restart-sni', async (event) => {
  try {
    return await restartSNIServer();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-heart', async () => {
  try {
    if (!sniClient.deviceURI) {
      throw new Error('No device selected');
    }
    return await gameOps.addHeartContainer();
  } catch (error) {
    console.error('Add heart error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-heart', async () => {
  try {
    if (!sniClient.deviceURI) {
      throw new Error('No device selected');
    }
    return await gameOps.removeHeartContainer();
  } catch (error) {
    console.error('Remove heart error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('kill-player', async () => {
  try {
    if (!sniClient.deviceURI) {
      throw new Error('No device selected');
    }
    return await gameOps.killPlayer();
  } catch (error) {
    console.error('KO player error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('warp-eastern', async () => {
  try {
    if (!sniClient.deviceURI) {
      throw new Error('No device selected');
    }
    return await gameOps.warpToEasternPalace();
  } catch (error) {
    console.error('Warp error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fake-mirror', async () => {
  try {
    if (!sniClient.deviceURI) {
      throw new Error('No device selected');
    }
    return await expandedOps.fakeMirror();
  } catch (error) {
    console.error('Fake Mirror error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('chaos-dungeon-warp', async () => {
  try {
    if (!sniClient.deviceURI) {
      throw new Error('No device selected');
    }
    return await expandedOps.chaosDungeonWarp();
  } catch (error) {
    console.error('Chaos Dungeon Warp error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-world', async () => {
  try {
    if (!sniClient.deviceURI) {
      throw new Error('No device selected');
    }
    return await expandedOps.toggleWorld();
  } catch (error) {
    console.error('Toggle World error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-memory', async () => {
  try {
    if (!sniClient.deviceURI) {
      throw new Error('No device selected');
    }
    await sniClient.testMemoryAccess();
    return { success: true };
  } catch (error) {
    console.error('Test memory error:', error);
    return { success: false, error: error.message };
  }
});

// ============= EXPANDED OPERATIONS =============

// Rupees
ipcMain.handle('set-rupees', async (event, amount) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.setRupees(amount);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Bombs & Arrows
ipcMain.handle('set-bombs', async (event, amount) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.setBombs(amount);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-arrows', async (event, amount) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.setArrows(amount);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Equipment
ipcMain.handle('set-sword', async (event, level) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.setSword(level);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-shield', async (event, level) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.setShield(level);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Items
ipcMain.handle('toggle-boots', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleBoots();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-flippers', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleFlippers();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-invincibility', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleInvincibility();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Freeze Player
ipcMain.handle('toggle-freeze-player', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleFreezePlayer();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Ice Physics (slippery floor)
ipcMain.handle('give-ice-physics', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveIcePhysics();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Enemy Spawning
ipcMain.handle('spawn-enemy', async (event, enemyType) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.spawnEnemyNearLink(enemyType);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('spawn-random-enemy', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.spawnRandomEnemy();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Bee Swarm Attack
ipcMain.handle('spawn-bee-swarm', async (event, count) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.spawnBeeSwarm(count);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-bee-swarm', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.stopBeeSwarm();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Chicken Attack
ipcMain.handle('trigger-chicken-attack', async (event, durationSeconds) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.triggerChickenAttack(durationSeconds);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Enemy Waves
ipcMain.handle('trigger-enemy-waves', async (event, durationSeconds) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.triggerEnemyWaves(durationSeconds);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('trigger-bee-swarm-waves', async (event, durationSeconds) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.triggerBeeSwarmWaves(durationSeconds);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Invisible Enemies
ipcMain.handle('make-enemies-invisible', async (event, durationSeconds) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.makeEnemiesInvisible(durationSeconds);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Infinite Magic
ipcMain.handle('enable-infinite-magic', async (event, durationSeconds) => {
  console.log(`[Main] enable-infinite-magic IPC handler called with duration: ${durationSeconds}`);
  try {
    if (!sniClient.deviceURI) {
      console.log('[Main] No device selected!');
      throw new Error('No device selected');
    }
    console.log('[Main] Calling expandedOps.enableInfiniteMagic...');
    const result = await expandedOps.enableInfiniteMagic(durationSeconds);
    console.log('[Main] enableInfiniteMagic result:', result);
    return result;
  } catch (error) {
    console.error('[Main] enable-infinite-magic error:', error);
    return { success: false, error: error.message };
  }
});

// Delete All Saves
ipcMain.handle('delete-all-saves', async (event) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.deleteAllSaves();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Bottles
ipcMain.handle('add-bottle', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.addBottle();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-bottle', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.removeBottle();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fill-bottles-potion', async (event, potionType) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.fillAllBottlesWithPotion(potionType);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Presets
ipcMain.handle('give-starter-pack', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveStarterPack();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('give-endgame-pack', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveEndgamePack();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get inventory
ipcMain.handle('get-inventory', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    const inventory = await expandedOps.getFullInventory();
    return { success: true, inventory };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// More equipment operations
ipcMain.handle('set-armor', async (event, level) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.setArmor(level);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-gloves', async (event, level) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.setGloves(level);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// More toggles
ipcMain.handle('toggle-moon-pearl', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleMoonPearl();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-hookshot', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleHookshot();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-lamp', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleLamp();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-hammer', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleHammer();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-book', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleBook();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-bug-net', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleBugNet();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-somaria', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleSomaria();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-byrna', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleByrna();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-mirror', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleMirror();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-boomerang', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleBoomerang();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Magic items
ipcMain.handle('toggle-fire-rod', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleFireRod();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('give-fire-rod', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveFireRod();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-ice-rod', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleIceRod();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('give-ice-rod', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveIceRod();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('give-capes', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveCapes();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Flute
ipcMain.handle('give-flute', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveFlute();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-flute', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.removeFlute();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deactivate-flute', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.deactivateFlute();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-medallion', async (event, medallionName) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleMedallion(medallionName);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-all-medallions', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleAllMedallions();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('give-all-medallions', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveAllMedallions();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Magic system
ipcMain.handle('enable-magic', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.enableMagic();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-magic', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.removeMagic();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-magic-upgrade', async (event, level) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.setMagicUpgrade(level);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Hearts
ipcMain.handle('add-heart-piece', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.addHeartPiece();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-hearts', async (event, count) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.setHearts(count);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Chaotic Features
ipcMain.handle('enable-ice-world', async (event, durationSeconds) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.enableIceWorld(durationSeconds);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('spawn-boss-rush', async (event, durationSeconds) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.spawnBossRush(durationSeconds);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('enable-item-lock', async (event, durationSeconds) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.enableItemLock(durationSeconds);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('enable-glass-cannon', async (event, durationSeconds) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.enableGlassCannon(durationSeconds);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('blessing-and-curse', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.blessingAndCurse();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Pendants & Crystals
ipcMain.handle('toggle-pendant', async (event, pendantName) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.togglePendant(pendantName);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-all-pendants', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleAllPendants();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('give-all-pendants', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveAllPendants();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-crystal', async (event, crystalNum) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleCrystal(crystalNum);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-all-crystals', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleAllCrystals();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('give-all-crystals', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveAllCrystals();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Keys
ipcMain.handle('add-small-key', async (event, dungeon) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.addSmallKey(dungeon);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-small-key', async (event, dungeon) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.removeSmallKey(dungeon);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('give-small-keys', async (event, dungeon, count) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveSmallKeys(dungeon, count);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-big-key', async (event, dungeon) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.toggleBigKey(dungeon);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('give-big-key', async (event, dungeon) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.giveBigKey(dungeon);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-rupees', async (event, amount) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.addRupees(amount);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-rupee', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.addRupee();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-rupee', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.removeRupee();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-bomb', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.addBomb();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-bomb', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.removeBomb();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-arrow', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.addArrow();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-arrow', async () => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    return await expandedOps.removeArrow();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============= HOELLSTREAM CONTROLS =============

const pathModule = require('path');
const https = require('https');

// Gift mappings file path - stored in user data directory (OS-specific, uses app name)
// Example paths:
//   Windows: C:\Users\{user}\AppData\Roaming\snes-controller\gift-mappings.json
//   macOS: ~/Library/Application Support/snes-controller/gift-mappings.json
//   Linux: ~/.config/snes-controller/gift-mappings.json
const GIFT_MAPPINGS_FILE = pathModule.join(app.getPath('userData'), 'gift-mappings.json');
const GIFT_NAME_OVERRIDES_FILE = pathModule.join(app.getPath('userData'), 'gift-name-overrides.json');
const CUSTOM_GIFTS_FILE = pathModule.join(app.getPath('userData'), 'custom-gifts.json');
const GIFT_IMAGE_OVERRIDES_FILE = pathModule.join(app.getPath('userData'), 'gift-image-overrides.json');
const THRESHOLD_CONFIGS_FILE = pathModule.join(app.getPath('userData'), 'threshold-configs.json');
const OVERLAY_SETTINGS_FILE = pathModule.join(app.getPath('userData'), 'overlay-settings.json');
const WINDOW_SETTINGS_FILE = pathModule.join(app.getPath('userData'), 'window-settings.json');

// Load gift mappings on startup
async function loadGiftMappingsOnStartup() {
  try {
    const data = await fs.readFile(GIFT_MAPPINGS_FILE, 'utf8');
    const mappings = JSON.parse(data);
    hoellPoller.updateMappings(mappings);
    console.log(`📂 Loaded ${Object.keys(mappings).length} gift mappings on startup`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📂 No gift mappings file found, starting with empty mappings');
      hoellPoller.updateMappings({});
    } else {
      console.error('Error loading gift mappings on startup:', error);
      hoellPoller.updateMappings({});
    }
  }
}

// Load threshold configs on startup
async function loadThresholdConfigsOnStartup() {
  try {
    const data = await fs.readFile(THRESHOLD_CONFIGS_FILE, 'utf8');
    const thresholds = JSON.parse(data);
    await hoellPoller.loadThresholdConfigs(thresholds);
    console.log(`📂 Loaded ${Object.keys(thresholds).length} threshold configurations on startup`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📂 No threshold configs file found, starting with empty thresholds');
      await hoellPoller.loadThresholdConfigs({});
    } else {
      console.error('Error loading threshold configs on startup:', error);
      await hoellPoller.loadThresholdConfigs({});
    }
  }
}

// Initialize gift database on first run
async function initializeGiftDatabase() {
  try {
    // Load initial gifts from tiktok-gifts.js
    const { TIKTOK_GIFTS } = require('./renderer/tiktok-gifts.js');
    const result = await giftUpdater.initialize(TIKTOK_GIFTS);

    if (result.success) {
      console.log('✅ Gift database initialized successfully');
    } else {
      console.error('❌ Failed to initialize gift database:', result.error);
    }
  } catch (error) {
    console.error('❌ Error initializing gift database:', error);
  }
}

// Save gift mappings to JSON file
ipcMain.handle('save-gift-mappings', async (event, mappings) => {
  try {
    await fs.writeFile(GIFT_MAPPINGS_FILE, JSON.stringify(mappings, null, 2), 'utf8');
    console.log(`💾 Saved ${Object.keys(mappings).length} gift mappings to ${GIFT_MAPPINGS_FILE}`);
    return { success: true, count: Object.keys(mappings).length };
  } catch (error) {
    console.error('Error saving gift mappings:', error);
    return { success: false, error: error.message };
  }
});

// Load gift mappings from JSON file
ipcMain.handle('load-gift-mappings', async () => {
  try {
    const data = await fs.readFile(GIFT_MAPPINGS_FILE, 'utf8');
    const mappings = JSON.parse(data);
    console.log(`📂 Loaded ${Object.keys(mappings).length} gift mappings from ${GIFT_MAPPINGS_FILE}`);
    return { success: true, mappings };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - return empty mappings
      console.log('📂 No gift mappings file found, starting fresh');
      return { success: true, mappings: {} };
    }
    console.error('Error loading gift mappings:', error);
    return { success: false, error: error.message };
  }
});

// Reload gift mappings in the poller
ipcMain.handle('reload-gift-mappings', async () => {
  try {
    if (!hoellPoller) {
      return { success: false, error: 'HoellStream poller not initialized' };
    }

    // Load mappings from file
    const data = await fs.readFile(GIFT_MAPPINGS_FILE, 'utf8');
    const mappings = JSON.parse(data);

    // Update poller with new mappings
    hoellPoller.updateMappings(mappings);

    console.log(`🔄 Reloaded ${Object.keys(mappings).length} gift mappings into poller`);
    return { success: true, count: Object.keys(mappings).length };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - use empty mappings
      hoellPoller.updateMappings({});
      return { success: true, count: 0 };
    }
    console.error('Error reloading gift mappings:', error);
    return { success: false, error: error.message };
  }
});

// ============= THRESHOLD CONFIGURATIONS =============

// Save threshold configs to JSON file
ipcMain.handle('save-threshold-configs', async (event, thresholds) => {
  try {
    await fs.writeFile(THRESHOLD_CONFIGS_FILE, JSON.stringify(thresholds, null, 2), 'utf8');
    console.log(`💾 Saved ${Object.keys(thresholds).length} threshold configs to ${THRESHOLD_CONFIGS_FILE}`);
    return { success: true, count: Object.keys(thresholds).length };
  } catch (error) {
    console.error('Error saving threshold configs:', error);
    return { success: false, error: error.message };
  }
});

// Load threshold configs from JSON file
ipcMain.handle('load-threshold-configs', async () => {
  try {
    const data = await fs.readFile(THRESHOLD_CONFIGS_FILE, 'utf8');
    const thresholds = JSON.parse(data);
    console.log(`📂 Loaded ${Object.keys(thresholds).length} threshold configs from ${THRESHOLD_CONFIGS_FILE}`);
    return { success: true, thresholds };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - return empty thresholds
      console.log('📂 No threshold configs file found, starting fresh');
      return { success: true, thresholds: {} };
    }
    console.error('Error loading threshold configs:', error);
    return { success: false, error: error.message };
  }
});

// Reload threshold configs in the poller
ipcMain.handle('reload-threshold-configs', async () => {
  try {
    if (!hoellPoller) {
      return { success: false, error: 'HoellStream poller not initialized' };
    }

    // Load threshold configs from file
    const data = await fs.readFile(THRESHOLD_CONFIGS_FILE, 'utf8');
    const thresholds = JSON.parse(data);

    // Update poller with new threshold configs
    await hoellPoller.loadThresholdConfigs(thresholds);

    console.log(`🔄 Reloaded ${Object.keys(thresholds).length} threshold configs into poller`);
    return { success: true, count: Object.keys(thresholds).length };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - use empty thresholds
      await hoellPoller.loadThresholdConfigs({});
      return { success: true, count: 0 };
    }
    console.error('Error reloading threshold configs:', error);
    return { success: false, error: error.message };
  }
});

// Get current threshold status (progress for all configured thresholds)
ipcMain.handle('get-threshold-status', async () => {
  try {
    if (!hoellPoller) {
      return { success: false, error: 'HoellStream poller not initialized' };
    }
    const status = hoellPoller.getThresholdStatus();
    return { success: true, status };
  } catch (error) {
    console.error('Error getting threshold status:', error);
    return { success: false, error: error.message };
  }
});

// ============= GIFT NAME OVERRIDES =============

// Save gift name overrides to JSON file
ipcMain.handle('save-gift-name-overrides', async (event, overrides) => {
  try {
    await fs.writeFile(GIFT_NAME_OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf8');
    console.log(`💾 Saved ${Object.keys(overrides).length} gift name overrides to ${GIFT_NAME_OVERRIDES_FILE}`);
    return { success: true, count: Object.keys(overrides).length };
  } catch (error) {
    console.error('Error saving gift name overrides:', error);
    return { success: false, error: error.message };
  }
});

// Load gift name overrides from JSON file
ipcMain.handle('load-gift-name-overrides', async () => {
  try {
    const data = await fs.readFile(GIFT_NAME_OVERRIDES_FILE, 'utf8');
    const overrides = JSON.parse(data);
    console.log(`📂 Loaded ${Object.keys(overrides).length} gift name overrides from ${GIFT_NAME_OVERRIDES_FILE}`);
    return { success: true, overrides };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - return empty overrides
      console.log('📂 No gift name overrides file found, starting fresh');
      return { success: true, overrides: {} };
    }
    console.error('Error loading gift name overrides:', error);
    return { success: false, error: error.message };
  }
});

// ============= CUSTOM GIFTS =============

// Save custom gifts to JSON file
ipcMain.handle('save-custom-gifts', async (event, customGifts) => {
  try {
    await fs.writeFile(CUSTOM_GIFTS_FILE, JSON.stringify(customGifts, null, 2), 'utf8');
    console.log(`💾 Saved ${customGifts.length} custom gifts to ${CUSTOM_GIFTS_FILE}`);
    return { success: true, count: customGifts.length };
  } catch (error) {
    console.error('Error saving custom gifts:', error);
    return { success: false, error: error.message };
  }
});

// Load custom gifts from JSON file
ipcMain.handle('load-custom-gifts', async () => {
  try {
    const data = await fs.readFile(CUSTOM_GIFTS_FILE, 'utf8');
    const customGifts = JSON.parse(data);
    console.log(`📂 Loaded ${customGifts.length} custom gifts from ${CUSTOM_GIFTS_FILE}`);
    return { success: true, customGifts };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - return empty array
      console.log('📂 No custom gifts file found, starting fresh');
      return { success: true, customGifts: [] };
    }
    console.error('Error loading custom gifts:', error);
    return { success: false, error: error.message };
  }
});

// ============= GIFT IMAGE OVERRIDES =============

// Save gift image overrides to JSON file
ipcMain.handle('save-gift-image-overrides', async (event, overrides) => {
  try {
    await fs.writeFile(GIFT_IMAGE_OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf8');
    console.log(`💾 Saved ${Object.keys(overrides).length} gift image overrides to ${GIFT_IMAGE_OVERRIDES_FILE}`);
    return { success: true, count: Object.keys(overrides).length };
  } catch (error) {
    console.error('Error saving gift image overrides:', error);
    return { success: false, error: error.message };
  }
});

// Load gift image overrides from JSON file
ipcMain.handle('load-gift-image-overrides', async () => {
  try {
    const data = await fs.readFile(GIFT_IMAGE_OVERRIDES_FILE, 'utf8');
    const overrides = JSON.parse(data);
    console.log(`📂 Loaded ${Object.keys(overrides).length} gift image overrides from ${GIFT_IMAGE_OVERRIDES_FILE}`);
    return { success: true, overrides };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - return empty overrides
      console.log('📂 No gift image overrides file found, starting fresh');
      return { success: true, overrides: {} };
    }
    console.error('Error loading gift image overrides:', error);
    return { success: false, error: error.message };
  }
});

// ============= GIFT IMAGE DOWNLOAD =============

// Download a single image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = require('fs').createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        require('fs').unlink(filepath, () => {}); // Delete failed file
        reject(err);
      });
    }).on('error', reject);
  });
}

// Download all gift images from CDN URLs
ipcMain.handle('download-all-gift-images', async (event) => {
  try {
    console.log('🖼️ Starting gift images download...');

    // Download to userData directory (writable location)
    const userDataPath = app.getPath('userData');
    const imagesDir = pathModule.join(userDataPath, 'gift-images');

    // Create directory if it doesn't exist
    try {
      await fs.mkdir(imagesDir, { recursive: true });
      console.log(`📁 Using images directory: ${imagesDir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // Load active gifts database (has all current gifts with image URLs)
    let imagesToDownload = [];

    if (giftUpdater) {
      const activeGifts = await giftUpdater.getActiveGifts();
      if (activeGifts && activeGifts.images) {
        // Use active-gifts.json which has all gifts from database updates
        for (const [coinValue, gifts] of Object.entries(activeGifts.images)) {
          for (const [giftName, giftData] of Object.entries(gifts)) {
            if (giftData && giftData.cdn) {
              const sanitized = giftName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
              const filename = `${sanitized}_${coinValue}.webp`;
              imagesToDownload.push({
                url: giftData.cdn,
                filename,
                giftName,
                coinValue
              });
            }
          }
        }
      }
    }

    // Fallback to hardcoded GIFT_IMAGES if active gifts not available
    if (imagesToDownload.length === 0) {
      console.log('⚠️ Using fallback hardcoded gift images');
      const giftImagesModule = require('./renderer/gift-images.js');
      const { GIFT_IMAGES } = giftImagesModule;

      for (const [coinValue, gifts] of Object.entries(GIFT_IMAGES)) {
        for (const [giftName, giftData] of Object.entries(gifts)) {
          if (giftData && giftData.cdn) {
            const sanitized = giftName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `${sanitized}_${coinValue}.webp`;
            imagesToDownload.push({
              url: giftData.cdn,
              filename,
              giftName,
              coinValue
            });
          }
        }
      }
    }

    console.log(`📦 Found ${imagesToDownload.length} images to download from active-gifts.json`);

    if (imagesToDownload.length === 0) {
      console.error('❌ No images found to download! Check if active-gifts.json has images field.');
    }

    // Download images with progress updates
    let downloaded = 0;
    let failed = 0;
    const total = imagesToDownload.length;

    for (const img of imagesToDownload) {
      const filepath = pathModule.join(imagesDir, img.filename);

      // Send progress update to renderer
      mainWindow.webContents.send('image-download-progress', {
        current: downloaded + failed + 1,
        total,
        filename: img.filename,
        giftName: img.giftName,
        status: 'downloading'
      });

      try {
        await downloadImage(img.url, filepath);
        downloaded++;
        console.log(`✅ Downloaded: ${img.filename}`);

        // Send success update
        mainWindow.webContents.send('image-download-progress', {
          current: downloaded + failed,
          total,
          filename: img.filename,
          giftName: img.giftName,
          status: 'success'
        });
      } catch (error) {
        failed++;
        console.error(`❌ Failed to download ${img.filename}:`, error.message);

        // Send error update
        mainWindow.webContents.send('image-download-progress', {
          current: downloaded + failed,
          total,
          filename: img.filename,
          giftName: img.giftName,
          status: 'error',
          error: error.message
        });
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 Download complete! Success: ${downloaded}, Failed: ${failed}`);

    return {
      success: true,
      downloaded,
      failed,
      total,
      imagesDir
    };
  } catch (error) {
    console.error('Error downloading gift images:', error);
    return { success: false, error: error.message };
  }
});

// Get the downloaded images directory path
ipcMain.handle('get-downloaded-images-path', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const imagesDir = pathModule.join(userDataPath, 'gift-images');
    return { success: true, path: imagesDir };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Download a single gift image from URL
ipcMain.handle('download-single-gift-image', async (event, giftName, coins, url) => {
  try {
    console.log(`🖼️ Downloading single image: ${giftName} (${coins} coins) from ${url}`);

    // Download to userData directory
    const userDataPath = app.getPath('userData');
    const imagesDir = pathModule.join(userDataPath, 'gift-images');

    // Create directory if it doesn't exist
    try {
      await fs.mkdir(imagesDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // Sanitize filename
    const sanitized = giftName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitized}_${coins}.webp`;
    const filepath = pathModule.join(imagesDir, filename);

    // Download the image
    await downloadImage(url, filepath);
    console.log(`✅ Downloaded: ${filename}`);

    // Update active-gifts.json to include this image
    if (giftUpdater) {
      const activeGifts = await giftUpdater.getActiveGifts();
      if (activeGifts && activeGifts.images) {
        // Initialize coin value group if it doesn't exist
        if (!activeGifts.images[coins]) {
          activeGifts.images[coins] = {};
        }

        // Update or add the image data
        activeGifts.images[coins][giftName] = {
          cdn: url,
          local: `./gift-images/${filename}`
        };

        // Save updated active-gifts.json
        const activeGiftsPath = pathModule.join(userDataPath, 'active-gifts.json');
        await fs.writeFile(activeGiftsPath, JSON.stringify(activeGifts, null, 2), 'utf8');
        console.log(`💾 Updated active-gifts.json for ${giftName}`);
      }
    }

    return {
      success: true,
      filename,
      filepath
    };
  } catch (error) {
    console.error('Error downloading single gift image:', error);
    return { success: false, error: error.message };
  }
});

// Download missing gift images only
ipcMain.handle('download-missing-gift-images', async (event) => {
  try {
    console.log('🔍 Checking for missing gift images...');

    // Download to userData directory (writable location)
    const userDataPath = app.getPath('userData');
    const imagesDir = pathModule.join(userDataPath, 'gift-images');

    // Create directory if it doesn't exist
    try {
      await fs.mkdir(imagesDir, { recursive: true });
      console.log(`📁 Using images directory: ${imagesDir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // Load active gifts database
    if (!giftUpdater) {
      return { success: false, error: 'Gift updater not initialized' };
    }

    const activeGifts = await giftUpdater.getActiveGifts();
    if (!activeGifts || !activeGifts.images) {
      return { success: false, error: 'No active gifts found' };
    }

    // Check which images are missing
    let missingImages = [];

    for (const [coinValue, gifts] of Object.entries(activeGifts.images)) {
      for (const [giftName, giftData] of Object.entries(gifts)) {
        if (giftData && giftData.cdn && giftData.local) {
          // Extract filename from local path
          const filename = giftData.local.replace('./gift-images/', '');
          const filepath = pathModule.join(imagesDir, filename);

          // Check if file exists
          try {
            await fs.access(filepath);
            // File exists, skip it
          } catch {
            // File doesn't exist, add to download list
            missingImages.push({
              url: giftData.cdn,
              filename,
              filepath,
              giftName,
              coinValue
            });
          }
        }
      }
    }

    console.log(`📦 Found ${missingImages.length} missing images to download`);

    if (missingImages.length === 0) {
      return {
        success: true,
        downloaded: 0,
        failed: 0,
        total: 0,
        message: 'All images already downloaded'
      };
    }

    // Download missing images with progress updates
    let downloaded = 0;
    let failed = 0;
    const total = missingImages.length;

    for (const img of missingImages) {
      // Send progress update to renderer
      mainWindow.webContents.send('image-download-progress', {
        current: downloaded + failed + 1,
        total,
        filename: img.filename,
        giftName: img.giftName,
        status: 'downloading'
      });

      try {
        await downloadImage(img.url, img.filepath);
        downloaded++;
        console.log(`✅ Downloaded missing: ${img.filename}`);

        // Send success update
        mainWindow.webContents.send('image-download-progress', {
          current: downloaded + failed,
          total,
          filename: img.filename,
          giftName: img.giftName,
          status: 'success'
        });
      } catch (error) {
        failed++;
        console.error(`❌ Failed to download ${img.filename}:`, error.message);

        // Send error update
        mainWindow.webContents.send('image-download-progress', {
          current: downloaded + failed,
          total,
          filename: img.filename,
          giftName: img.giftName,
          status: 'error',
          error: error.message
        });
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 Missing images download complete! Success: ${downloaded}, Failed: ${failed}`);

    return {
      success: true,
      downloaded,
      failed,
      total,
      imagesDir
    };
  } catch (error) {
    console.error('Error downloading missing gift images:', error);
    return { success: false, error: error.message };
  }
});

// ============= OVERLAY BUILDER =============

// Save overlay HTML file to configured location (or Downloads folder by default)
ipcMain.handle('save-overlay-file', async (event, htmlContent) => {
  try {
    // Load overlay settings to get custom path
    let savePath = app.getPath('downloads'); // Default

    try {
      const settingsData = await fs.readFile(OVERLAY_SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(settingsData);
      if (settings.savePath) {
        savePath = settings.savePath;
      }
    } catch (error) {
      // If settings file doesn't exist or can't be read, use default
      if (error.code !== 'ENOENT') {
        console.warn('Could not read overlay settings, using default path:', error);
      }
    }

    const filePath = pathModule.join(savePath, 'TikTok-Gift-Overlay.html');

    await fs.writeFile(filePath, htmlContent, 'utf8');
    console.log(`🎬 Saved overlay file to ${filePath}`);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error saving overlay file:', error);
    return { success: false, error: error.message };
  }
});

// Get overlay save path
ipcMain.handle('get-overlay-save-path', async () => {
  try {
    const settingsData = await fs.readFile(OVERLAY_SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(settingsData);
    return { success: true, savePath: settings.savePath || app.getPath('downloads') };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - return default downloads path
      return { success: true, savePath: app.getPath('downloads') };
    }
    console.error('Error getting overlay save path:', error);
    return { success: false, error: error.message };
  }
});

// Set overlay save path
ipcMain.handle('set-overlay-save-path', async (event, savePath) => {
  try {
    // Empty string means reset to default - delete settings file
    if (!savePath || savePath === '') {
      try {
        await fs.unlink(OVERLAY_SETTINGS_FILE);
        console.log('🔄 Reset overlay path to default (Downloads)');
      } catch (error) {
        // File might not exist, that's okay
        if (error.code !== 'ENOENT') {
          console.warn('Could not delete overlay settings file:', error);
        }
      }
      return { success: true, savePath: app.getPath('downloads') };
    }

    // Validate that the path exists and is a directory
    const stats = await fs.stat(savePath);
    if (!stats.isDirectory()) {
      return { success: false, error: 'Path must be a directory' };
    }

    // Save to settings file
    const settings = { savePath };
    await fs.writeFile(OVERLAY_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    console.log(`💾 Saved overlay path setting: ${savePath}`);
    return { success: true, savePath };
  } catch (error) {
    console.error('Error setting overlay save path:', error);
    return { success: false, error: error.message };
  }
});

// Show folder picker dialog for overlay save path
ipcMain.handle('browse-overlay-path', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Folder for Overlay Files'
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    return { success: true, path: result.filePaths[0] };
  } catch (error) {
    console.error('Error showing folder picker:', error);
    return { success: false, error: error.message };
  }
});

// Toggle HoellStream polling on/off
ipcMain.handle('toggle-hoellstream', async () => {
  try {
    if (!hoellPoller) {
      return { success: false, error: 'HoellStream poller not initialized' };
    }

    if (hoellPoller.isPolling) {
      hoellPoller.stop();
      return { success: true, polling: false, message: 'HoellStream polling stopped' };
    } else {
      hoellPoller.start();
      return { success: true, polling: true, message: 'HoellStream polling started' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get HoellStream stats
ipcMain.handle('get-hoellstream-stats', async () => {
  try {
    if (!hoellPoller) {
      return { success: false, error: 'HoellStream poller not initialized' };
    }
    const stats = hoellPoller.getStats();
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Clear seen events (useful for testing)
ipcMain.handle('clear-hoellstream-cache', async () => {
  try {
    if (!hoellPoller) {
      return { success: false, error: 'HoellStream poller not initialized' };
    }
    hoellPoller.clearSeenEvents();
    return { success: true, message: 'Seen events cache cleared' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============= ITEM RESTORATION SYSTEM =============

// Disable item temporarily (for manual testing or TikTok integration)
ipcMain.handle('disable-item-temp', async (event, itemName, durationSeconds) => {
  try {
    if (!sniClient.deviceURI) throw new Error('No device selected');
    if (!restorationManager) throw new Error('Restoration manager not initialized');
    return await restorationManager.disableItemTemporarily(itemName, durationSeconds);
  } catch (error) {
    console.error('Disable item error:', error);
    return { success: false, error: error.message };
  }
});

// Manually restore item early (cancel scheduled restoration)
ipcMain.handle('restore-item', async (event, itemName) => {
  try {
    if (!restorationManager) throw new Error('Restoration manager not initialized');
    return await restorationManager.restoreItem(itemName);
  } catch (error) {
    console.error('Restore item error:', error);
    return { success: false, error: error.message };
  }
});

// Get all active restorations
ipcMain.handle('get-active-restorations', async () => {
  try {
    if (!restorationManager) throw new Error('Restoration manager not initialized');
    const active = restorationManager.getActiveRestorations();
    return { success: true, restorations: active };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Restore all items immediately
ipcMain.handle('restore-all-items', async () => {
  try {
    if (!restorationManager) throw new Error('Restoration manager not initialized');
    return await restorationManager.restoreAll();
  } catch (error) {
    console.error('Restore all items error:', error);
    return { success: false, error: error.message };
  }
});

// Get list of supported items for disable/restore
ipcMain.handle('get-supported-items', async () => {
  try {
    if (!restorationManager) throw new Error('Restoration manager not initialized');
    const items = restorationManager.getSupportedItems();
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============= GIFT DATABASE UPDATE SYSTEM =============

// Update gift database from streamtoearn.io API
ipcMain.handle('update-gift-database', async (event, options = {}) => {
  try {
    if (!giftUpdater) throw new Error('Gift updater not initialized');

    // Set progress callback to send updates to renderer
    giftUpdater.progressCallback = (progress) => {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('gift-update-progress', progress);
      }
    };

    const result = await giftUpdater.updateGiftDatabase(options);
    return result;
  } catch (error) {
    console.error('Update gift database error:', error);
    return { success: false, error: error.message };
  }
});

// Get version history
ipcMain.handle('get-database-versions', async () => {
  try {
    if (!giftUpdater) throw new Error('Gift updater not initialized');
    const versions = await giftUpdater.getVersionHistory();
    return { success: true, versions };
  } catch (error) {
    console.error('Get database versions error:', error);
    return { success: false, error: error.message };
  }
});

// Rollback database to previous version
ipcMain.handle('rollback-database', async (event, backupPath) => {
  try {
    if (!giftUpdater) throw new Error('Gift updater not initialized');
    const result = await giftUpdater.rollback(backupPath);
    return result;
  } catch (error) {
    console.error('Rollback database error:', error);
    return { success: false, error: error.message };
  }
});

// Get active gifts
ipcMain.handle('get-active-gifts', async () => {
  try {
    if (!giftUpdater) throw new Error('Gift updater not initialized');
    const activeGifts = await giftUpdater.getActiveGifts();
    return { success: true, activeGifts };
  } catch (error) {
    console.error('Get active gifts error:', error);
    return { success: false, error: error.message };
  }
});

// Load archived gifts
ipcMain.handle('load-archived-gifts', async () => {
  try {
    if (!giftUpdater) throw new Error('Gift updater not initialized');
    const archivedGifts = await giftUpdater.getArchivedGifts();
    return { success: true, archivedGifts };
  } catch (error) {
    console.error('Load archived gifts error:', error);
    return { success: false, error: error.message };
  }
});

// Restore archived gift to active database
ipcMain.handle('restore-archived-gift', async (event, giftName, coins) => {
  try {
    if (!giftUpdater) throw new Error('Gift updater not initialized');
    const result = await giftUpdater.restoreArchivedGift(giftName, coins);
    return result;
  } catch (error) {
    console.error('Restore archived gift error:', error);
    return { success: false, error: error.message };
  }
});

// Delete archived gift permanently
ipcMain.handle('delete-archived-gift', async (event, giftName, coins) => {
  try {
    if (!giftUpdater) throw new Error('Gift updater not initialized');
    const result = await giftUpdater.deleteArchivedGift(giftName, coins);
    return result;
  } catch (error) {
    console.error('Delete archived gift error:', error);
    return { success: false, error: error.message };
  }
});

// Check if gift mappings reference archived gifts
ipcMain.handle('check-mappings-for-archived-gifts', async (event, giftMappings) => {
  try {
    if (!giftUpdater) throw new Error('Gift updater not initialized');
    const warnings = await giftUpdater.checkMappingsForArchivedGifts(giftMappings);
    return { success: true, warnings };
  } catch (error) {
    console.error('Check mappings for archived gifts error:', error);
    return { success: false, error: error.message };
  }
});

// Register protocol as privileged before app is ready
app.whenReady().then(async () => {
  // Register custom protocol for serving gift images from userData
  try {
    protocol.handle('gift-image', (request) => {
      const url = new URL(request.url);
      // For gift-image://filename.webp, the filename is in url.host, not url.pathname
      let filename = url.host || url.pathname.substring(1);
      const imagePath = path.join(app.getPath('userData'), 'gift-images', filename);
      console.log(`[gift-image protocol] Request: ${request.url} -> ${imagePath}`);

      // Convert Windows path separators for file:// URL
      const fileUrl = `file://${imagePath.replace(/\\/g, '/')}`;
      console.log(`[gift-image protocol] Fetching: ${fileUrl}`);
      return net.fetch(fileUrl);
    });
    console.log('✅ gift-image:// protocol registered');
  } catch (error) {
    console.error('❌ Failed to register gift-image protocol:', error);
  }

  createWindow();

  // Start SNI server and auto-connect
  try {
    await startSNIServer();
    // Wait a bit more for window to be fully loaded
    setTimeout(() => {
      autoConnectSNI();
    }, 1000);
  } catch (error) {
    console.error('Failed to start SNI server:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  if (hoellPoller && hoellPoller.isPolling) {
    hoellPoller.stop();
    console.log('🎁 HoellStream polling stopped');
  }
  if (restorationManager) {
    restorationManager.cleanup();
    console.log('⏱️ ItemRestorationManager cleaned up');
  }
  // Kill SNI process
  if (sniProcess) {
    console.log('🛑 Stopping SNI server...');
    sniProcess.kill();
    sniProcess = null;
  }
});