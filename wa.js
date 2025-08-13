const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');

class WhatsAppClient {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.state = 'initializing'; // initializing, qr, connected, disconnected
    this.initialize();
  }

  initialize() {
    // Buat folder session jika belum ada
    const sessionDir = path.join(__dirname, '.wwebjs_session');

    // Inisialisasi client WhatsApp
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: sessionDir
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    // Event handlers
    this.client.on('qr', (qr) => {
      console.log('QR Code received');
      this.qrCode = qr;
      this.state = 'qr';
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      this.state = 'connected';
      this.qrCode = null;
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp authenticated');
      this.qrCode = null;
    });

    this.client.on('auth_failure', (msg) => {
      console.error('WhatsApp authentication failed:', msg);
      this.state = 'disconnected';
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp disconnected:', reason);
      this.state = 'disconnected';
      // Coba reconnect setelah 5 detik
      setTimeout(() => {
        this.initialize();
      }, 5000);
    });

    // Mulai client
    this.client.initialize().catch(err => {
      console.error('Error initializing WhatsApp client:', err);
      this.state = 'disconnected';
    });
  }

  getState() {
    return this.state;
  }

  getQR() {
    return this.qrCode;
  }

  isReady() {
    return this.state === 'connected';
  }

  async logout() {
    if (this.client) {
      await this.client.logout();
      this.state = 'disconnected';
      return true;
    }
    return false;
  }

  async reconnect() {
    if (this.client) {
      await this.client.destroy();
    }
    this.initialize();
    return true;
  }

  async sendImage(to, base64Data, filename, caption = '') {
    if (!this.isReady()) {
      throw new Error('WhatsApp client not ready');
    }

    try {
      // Deteksi mimetype berdasarkan ekstensi file
      const ext = path.extname(filename).toLowerCase();
      let mimetype = 'image/jpeg'; // default
      
      if (ext === '.png') {
        mimetype = 'image/png';
      } else if (ext === '.gif') {
        mimetype = 'image/gif';
      } else if (ext === '.webp') {
        mimetype = 'image/webp';
      }

      const media = new MessageMedia(mimetype, base64Data, filename);
      const result = await this.client.sendMessage(to, media, { caption });
      return result.id._serialized;
    } catch (error) {
      console.error('Error sending image:', error);
      throw error;
    }
  }
}

// Singleton instance
const waClient = new WhatsAppClient();
module.exports = waClient;