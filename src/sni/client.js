const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

class SNIClient {
  constructor() {
    this.client = null;
    this.deviceURI = null;
    this.connected = false;
    this.devicesClient = null;
    this.memoryClient = null;
    this.currentDevice = null;
    this.addressSpace = 1; // Default to SnesABus for RetroArch
  }

  async connect(host = 'localhost', port = 8191) {
    const PROTO_PATH = path.join(__dirname, '../protos/sni.proto');

    console.log('Loading proto from:', PROTO_PATH);

    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });

    const sni = grpc.loadPackageDefinition(packageDefinition);

    const address = `${host}:${port}`;
    console.log('Connecting to SNI at:', address);

    // Create clients for each service
    this.devicesClient = new sni.Devices(
      address,
      grpc.credentials.createInsecure()
    );

    this.memoryClient = new sni.DeviceMemory(
      address,
      grpc.credentials.createInsecure()
    );

    this.connected = true;
    console.log('SNI clients created successfully');
  }

  async listDevices() {
    if (!this.devicesClient) {
      throw new Error('Not connected to SNI');
    }

    return new Promise((resolve, reject) => {
      this.devicesClient.ListDevices({}, (err, response) => {
        if (err) {
          console.error('ListDevices error:', err);
          reject(err);
        } else {
          console.log('Devices found:', response.devices);
          resolve(response.devices || []);
        }
      });
    });
  }

  selectDevice(deviceInfo) {
    this.currentDevice = deviceInfo;
    this.deviceURI = deviceInfo.uri;

    // Determine address space based on device kind and defaultAddressSpace
    if (deviceInfo.kind === 'retroarch') {
      // RetroArch typically uses SnesABus
      this.addressSpace = deviceInfo.defaultAddressSpace === 'FxPakPro' ? 0 : 1;
    } else if (deviceInfo.kind === 'fxpakpro') {
      // FX Pak Pro uses its own address space
      this.addressSpace = 0;
    } else {
      // Default to what the device says
      this.addressSpace = deviceInfo.defaultAddressSpace === 'FxPakPro' ? 0 : 1;
    }

    console.log(`Selected device: ${deviceInfo.uri}, using address space: ${this.addressSpace === 0 ? 'FxPakPro' : 'SnesABus'}`);
  }

  async readMemory(address, size) {
    if (!this.memoryClient) {
      throw new Error('Not connected to SNI');
    }

    if (!this.deviceURI) {
      throw new Error('No device selected');
    }

    // For RetroArch with SnesABus, we might need to adjust WRAM addresses
    let adjustedAddress = address;
    if (this.addressSpace === 1 && address >= 0x7E0000 && address <= 0x7FFFFF) {
      // This is already a SNES A-bus address, use as-is
      adjustedAddress = address;
    } else if (this.addressSpace === 1 && address >= 0xF50000 && address <= 0xF6FFFF) {
      // Convert FX Pak Pro WRAM address to SNES A-bus
      adjustedAddress = 0x7E0000 + (address - 0xF50000);
    }

    const request = {
      uri: this.deviceURI,
      request: {
        requestAddress: adjustedAddress,
        requestAddressSpace: this.addressSpace,
        requestMemoryMapping: 2, // LoROM = 2
        size: size
      }
    };

    console.log('Reading memory:', {
      original: address.toString(16),
      adjusted: adjustedAddress.toString(16),
      size,
      addressSpace: this.addressSpace === 0 ? 'FxPakPro' : 'SnesABus'
    });

    return new Promise((resolve, reject) => {
      this.memoryClient.SingleRead(request, (err, response) => {
        if (err) {
          console.error('Read memory error:', err);
          reject(err);
        } else {
          const data = response.response.data;
          console.log('Read data:', data);
          resolve(data);
        }
      });
    });
  }

  async writeMemory(address, data) {
    if (!this.memoryClient) {
      throw new Error('Not connected to SNI');
    }

    if (!this.deviceURI) {
      throw new Error('No device selected');
    }

    // Ensure data is a Buffer
    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data);
    }

    // For RetroArch with SnesABus, we might need to adjust WRAM addresses
    let adjustedAddress = address;
    if (this.addressSpace === 1 && address >= 0x7E0000 && address <= 0x7FFFFF) {
      // This is already a SNES A-bus address, use as-is
      adjustedAddress = address;
    } else if (this.addressSpace === 1 && address >= 0xF50000 && address <= 0xF6FFFF) {
      // Convert FX Pak Pro WRAM address to SNES A-bus
      adjustedAddress = 0x7E0000 + (address - 0xF50000);
    }

    const request = {
      uri: this.deviceURI,
      request: {
        requestAddress: adjustedAddress,
        requestAddressSpace: this.addressSpace,
        requestMemoryMapping: 2, // LoROM = 2
        data: data
      }
    };

    console.log('Writing memory:', {
      original: address.toString(16),
      adjusted: adjustedAddress.toString(16),
      data: Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '),
      addressSpace: this.addressSpace === 0 ? 'FxPakPro' : 'SnesABus'
    });

    return new Promise((resolve, reject) => {
      this.memoryClient.SingleWrite(request, (err, response) => {
        if (err) {
          console.error('Write memory error:', err);
          reject(err);
        } else {
          console.log('Write successful');
          resolve(response);
        }
      });
    });
  }

  async testMemoryAccess() {
    console.log('=== Testing Memory Access ===');
    console.log(`Device: ${this.currentDevice?.displayName || 'Unknown'}`);
    console.log(`Device Kind: ${this.currentDevice?.kind || 'Unknown'}`);
    console.log(`Address Space: ${this.addressSpace === 0 ? 'FxPakPro' : 'SnesABus'}`);

    // Test reading from different address formats
    const tests = [
      { name: 'WRAM via FxPakPro', address: 0xF5F36C, space: 0 },
      { name: 'WRAM via SnesABus', address: 0x7EF36C, space: 1 },
      { name: 'Auto-translated', address: 0x7EF36C, space: this.addressSpace }
    ];

    for (const test of tests) {
      try {
        const oldSpace = this.addressSpace;
        this.addressSpace = test.space;

        console.log(`\nTesting ${test.name} at 0x${test.address.toString(16)} with space ${test.space}:`);
        const data = await this.readMemory(test.address, 1);
        console.log(`  Success! Read: 0x${data[0].toString(16)} (${data[0]} decimal)`);

        this.addressSpace = oldSpace;
      } catch (error) {
        console.log(`  Failed: ${error.message}`);
      }
    }

    console.log('\n=== Test Complete ===');
  }

  disconnect() {
    this.connected = false;
    this.devicesClient = null;
    this.memoryClient = null;
    this.deviceURI = null;
    this.currentDevice = null;
  }
}

module.exports = SNIClient;