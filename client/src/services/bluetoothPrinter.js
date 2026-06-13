class BluetoothPrinter {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.connected = false;
  }

  async connect() {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser. Try Chrome or Edge.');
    }

    try {
      console.log('Requesting Bluetooth device...');
      // standard printer service UUID is often 000018f0-0000-1000-8000-00805f9b34fb or 0000ff00-0000-1000-8000-00805f9b34fb
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9ae9c2c61']
      });

      console.log('Connecting to GATT server...');
      const server = await this.device.gatt.connect();

      console.log('Getting primary service...');
      // Try to find the service
      let service;
      try {
        service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      } catch (e) {
        // Fallback to first available service if typical one isn't found
        const services = await server.getPrimaryServices();
        if (services.length > 0) {
          service = services[0];
        } else {
          throw new Error('No Bluetooth services found on this device.');
        }
      }

      console.log('Getting characteristic...');
      const characteristics = await service.getCharacteristics();
      // Find a characteristic that supports write/writeWithoutResponse
      const writeChar = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);
      if (!writeChar) {
        throw new Error('No writeable characteristic found on printer.');
      }

      this.characteristic = writeChar;
      this.connected = true;
      console.log('Bluetooth Printer Connected!');
      
      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.connected = false;
        this.characteristic = null;
        this.device = null;
        console.log('Bluetooth Printer Disconnected.');
      });

      return this.device.name || 'Bluetooth Printer';
    } catch (error) {
      this.connected = false;
      this.characteristic = null;
      this.device = null;
      console.error('Bluetooth connection failed:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.connected = false;
    this.characteristic = null;
    this.device = null;
  }

  isConnected() {
    return this.connected && this.characteristic !== null;
  }

  // Convert text to ESC/POS uint8 array
  textToBytes(text) {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  async sendCommand(bytes) {
    if (!this.isConnected()) {
      console.log('MOCK PRINT COMMAND:', new TextDecoder().decode(bytes));
      return;
    }
    try {
      // Send data in chunks of 20 bytes (standard BLE package size limit)
      const chunkSize = 20;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        await this.characteristic.writeValue(chunk);
      }
    } catch (error) {
      console.error('Error sending print command:', error);
      throw error;
    }
  }

  // ESC/POS Commands
  // Initialize: ESC @ (1B 40)
  // Align Left: ESC a 0 (1B 61 00)
  // Align Center: ESC a 1 (1B 61 01)
  // Align Right: ESC a 2 (1B 61 02)
  // Bold On: ESC E 1 (1B 45 01)
  // Bold Off: ESC E 0 (1B 45 00)
  // Cut: GS V 66 0 (1D 56 42 00)

  async printReceipt(order, settings) {
    const escInit = new Uint8Array([0x1b, 0x40]);
    const escCenter = new Uint8Array([0x1b, 0x61, 0x01]);
    const escLeft = new Uint8Array([0x1b, 0x61, 0x00]);
    const escRight = new Uint8Array([0x1b, 0x61, 0x02]);
    const escBoldOn = new Uint8Array([0x1b, 0x45, 0x01]);
    const escBoldOff = new Uint8Array([0x1b, 0x45, 0x00]);
    const lf = new Uint8Array([0x0a]);

    let data = new Uint8Array([]);
    const append = (bytes) => {
      const merged = new Uint8Array(data.length + bytes.length);
      merged.set(data);
      merged.set(bytes, data.length);
      data = merged;
    };
    const appendText = (text) => append(this.textToBytes(text));

    append(escInit);
    
    // Header
    append(escCenter);
    append(escBoldOn);
    appendText(`${settings.restaurantName || 'Naidu Hotel'}\n`);
    append(escBoldOff);
    appendText(`${settings.address || '123 Main Street, Bangalore'}\n`);
    appendText(`Phone: ${settings.phone || '+91 9876543210'}\n`);
    appendText('--------------------------------\n'); // 32 characters for 58mm printer

    // Bill Info
    append(escLeft);
    appendText(`Bill No: ${order.billNo}\n`);
    appendText(`Date: ${new Date(order.date).toLocaleDateString()} ${new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`);
    appendText(`Type: ${order.type} (${order.table})\n`);
    if (order.customerName) {
      appendText(`Cust: ${order.customerName}\n`);
    }
    appendText('--------------------------------\n');

    // Items Header
    appendText('Item             Qty       Amt\n');
    appendText('--------------------------------\n');

    // Items List
    order.items.forEach(item => {
      // 58mm width is 32 characters
      // Format: Item (16 chars) + Qty (6 chars) + Amt (10 chars)
      const namePart = item.name.substring(0, 15).padEnd(16, ' ');
      const qtyPart = String(item.quantity).padStart(5, ' ') + ' ';
      const amtPart = String(item.price * item.quantity).padStart(10, ' ');
      appendText(`${namePart}${qtyPart}${amtPart}\n`);
    });
    
    appendText('--------------------------------\n');

    // Calculations
    append(escRight);
    appendText(`Subtotal: Rs. ${order.subtotal.toFixed(2)}\n`);
    if (order.packing > 0) {
      appendText(`Packing: Rs. ${order.packing.toFixed(2)}\n`);
    }
    if (order.discount > 0) {
      appendText(`Discount: Rs. -${order.discount.toFixed(2)}\n`);
    }
    if (order.gst > 0) {
      appendText(`GST (${settings.gstPercentage || 5}%): Rs. ${order.gst.toFixed(2)}\n`);
    }
    append(escBoldOn);
    appendText(`TOTAL: Rs. ${order.total.toFixed(2)}\n`);
    append(escBoldOff);
    appendText('--------------------------------\n');

    // Footer
    append(escCenter);
    appendText(`${settings.footerMessage || 'Thank you! Visit again.'}\n`);
    append(lf);
    append(lf);
    append(lf);

    console.log('Sending receipt payload to Bluetooth printer...');
    await this.sendCommand(data);
  }

  async printKOT(order) {
    const escInit = new Uint8Array([0x1b, 0x40]);
    const escCenter = new Uint8Array([0x1b, 0x61, 0x01]);
    const escLeft = new Uint8Array([0x1b, 0x61, 0x00]);
    const escBoldOn = new Uint8Array([0x1b, 0x45, 0x01]);
    const escBoldOff = new Uint8Array([0x1b, 0x45, 0x00]);
    const lf = new Uint8Array([0x0a]);

    let data = new Uint8Array([]);
    const append = (bytes) => {
      const merged = new Uint8Array(data.length + bytes.length);
      merged.set(data);
      merged.set(bytes, data.length);
      data = merged;
    };
    const appendText = (text) => append(this.textToBytes(text));

    append(escInit);

    // KOT Title
    append(escCenter);
    append(escBoldOn);
    appendText('KITCHEN ORDER TICKET (KOT)\n');
    append(escBoldOff);
    appendText('--------------------------------\n');

    // Details
    append(escLeft);
    appendText(`Bill No: ${order.billNo || 'PENDING'}\n`);
    appendText(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`);
    append(escBoldOn);
    appendText(`Table/Type: ${order.table} / ${order.type}\n`);
    append(escBoldOff);
    appendText('--------------------------------\n');

    // Items
    appendText('Item                      Qty\n');
    appendText('--------------------------------\n');
    append(escBoldOn);
    order.items.forEach(item => {
      const namePart = item.name.substring(0, 25).padEnd(26, ' ');
      const qtyPart = String(item.quantity).padStart(6, ' ');
      appendText(`${namePart}${qtyPart}\n`);
    });
    append(escBoldOff);
    appendText('--------------------------------\n');
    
    append(lf);
    append(lf);
    append(lf);

    console.log('Sending KOT payload to Bluetooth printer...');
    await this.sendCommand(data);
  }

  async printTest() {
    const escInit = new Uint8Array([0x1b, 0x40]);
    const escCenter = new Uint8Array([0x1b, 0x61, 0x01]);
    const escBoldOn = new Uint8Array([0x1b, 0x45, 0x01]);
    const escBoldOff = new Uint8Array([0x1b, 0x45, 0x00]);
    const lf = new Uint8Array([0x0a]);

    let data = new Uint8Array([]);
    const append = (bytes) => {
      const merged = new Uint8Array(data.length + bytes.length);
      merged.set(data);
      merged.set(bytes, data.length);
      data = merged;
    };
    const appendText = (text) => append(this.textToBytes(text));

    append(escInit);
    append(escCenter);
    append(escBoldOn);
    appendText('Rangi Hotel POS\n');
    append(escBoldOff);
    appendText('Printer Connected Successfully!\n');
    appendText(`Test Time: ${new Date().toLocaleTimeString()}\n`);
    appendText('--------------------------------\n');
    append(lf);
    append(lf);
    append(lf);

    console.log('Sending test print payload...');
    await this.sendCommand(data);
  }
}

export const bluetoothPrinter = new BluetoothPrinter();
export default bluetoothPrinter;
