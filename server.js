require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Inisialisasi Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Rate limiter sederhana
const rateLimiter = {
  windowMs: 60 * 1000, // 1 menit
  maxRequests: 30, // 30 request per menit
  clients: new Map(),
};

const limiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  
  if (!rateLimiter.clients.has(ip)) {
    rateLimiter.clients.set(ip, {
      count: 1,
      resetTime: now + rateLimiter.windowMs,
    });
    return next();
  }
  
  const client = rateLimiter.clients.get(ip);
  
  if (now > client.resetTime) {
    client.count = 1;
    client.resetTime = now + rateLimiter.windowMs;
    return next();
  }
  
  if (client.count >= rateLimiter.maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak permintaan, coba lagi nanti',
    });
  }
  
  client.count++;
  next();
};

// Import modul WhatsApp
const waClient = require('./wa');

// Middleware untuk validasi nomor WhatsApp
const validatePhoneNumber = (req, res, next) => {
  const { to } = req.body;

  console.log('Nomor tujuan:', to);
  
  // Validasi jika to adalah array
  if (Array.isArray(to)) {
    const invalidNumbers = to.filter(num => !isValidPhoneNumber(num));
    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Nomor tidak valid: ${invalidNumbers.join(', ')}`,
      });
    }
  } else if (!isValidPhoneNumber(to)) {
    return res.status(400).json({
      success: false,
      message: 'Format nomor WhatsApp tidak valid',
    });
  }
  
  next();
};

// Fungsi validasi nomor telepon (format E.164)
function isValidPhoneNumber(number) {
  console.log('Validasi nomor:', number);

  // Cek apakah number adalah null atau undefined
  if (!number) {
    console.log('Nomor tidak ada');
    return false;
  }
  
  // Pastikan number adalah string
  if (typeof number !== 'string') {
    console.log('Nomor bukan string:', number);
    return false;
  }
  console.log('Nomor:', number);
  
  // Hapus semua karakter non-digit untuk pengecekan panjang
  const digits = number.replace(/\D/g, '');
  
  // Validasi berdasarkan panjang digit dan format
  if (number.startsWith('+62')) {
    // Format +62: panjang total 11-14 digit (termasuk kode negara)
    return digits.length >= 10 && digits.length <= 14;
  } else if (number.startsWith('62')) {
    // Format 62: panjang total 10-13 digit (termasuk kode negara)
    return digits.length >= 10 && digits.length <= 13;
  } else if (number.startsWith('0')) {
    // Format 0: panjang total 10-12 digit (nomor lokal Indonesia)
    return digits.length >= 10 && digits.length <= 12;
  } else if (number.startsWith('8')) {
    // Format tanpa awalan: langsung nomor HP (8xxx)
    return digits.length >= 9 && digits.length <= 11;
  } else {
    // Format lainnya
    console.log('Format nomor:', number);
    return /^\d{9,14}$/.test(digits);
  }
}

// Sanitasi caption
function sanitizeCaption(text) {
  if (!text) return '';
  // Hapus karakter kontrol kecuali newline dan tab
  return text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Routes untuk WhatsApp API
app.get('/api/wa/status', async (req, res) => {
  res.json({
    state: waClient.getState(),
  });
});

app.get('/api/wa/qr', async (req, res) => {
  const qrCode = waClient.getQR();
  if (!qrCode) {
    return res.status(404).json({
      success: false,
      message: 'QR code belum tersedia atau sudah terautentikasi',
    });
  }
  res.json({
    success: true,
    qr: qrCode,
  });
});

app.post('/api/wa/logout', async (req, res) => {
  try {
    await waClient.logout();
    res.json({
      success: true,
      message: 'Berhasil logout dari WhatsApp',
    });
  } catch (error) {
    console.error('Error saat logout:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal logout dari WhatsApp',
    });
  }
});

app.post('/api/wa/reconnect', async (req, res) => {
  try {
    await waClient.reconnect();
    res.json({
      success: true,
      message: 'Mencoba menghubungkan kembali ke WhatsApp',
    });
  } catch (error) {
    console.error('Error saat reconnect:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghubungkan kembali ke WhatsApp',
    });
  }
});

app.post('/api/wa/send', limiter, upload.single('file'), validatePhoneNumber, async (req, res) => {
  try {
    if (!waClient.isReady()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp belum terhubung',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File gambar diperlukan',
      });
    }

    const { to, caption } = req.body;
    // Tambahkan pesan default ke caption
    const defaultMessage = "Terima kasih telah menggunakan Photoboth APKM Telkom University Surabaya ❤️";
    const combinedCaption = caption ? `${caption}${defaultMessage}` : defaultMessage;
    const sanitizedCaption = sanitizeCaption(combinedCaption);
    const recipients = Array.isArray(to) ? to : [to];
    
    // Konversi file ke base64
    const base64Data = req.file.buffer.toString('base64');
    const messageIds = [];
    
    // Kirim pesan ke semua penerima
    for (const recipient of recipients) {
      let formattedNumber = recipient;
      
      // Format nomor jika perlu
      if (formattedNumber.startsWith('+')) {
        formattedNumber = formattedNumber.substring(1); // Hapus tanda + di awal
      }
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '62' + formattedNumber.substring(1);
      }
      // Jika nomor dimulai dengan 8, tambahkan 62 di depan
      if (formattedNumber.startsWith('8')) {
        formattedNumber = '62' + formattedNumber;
      }
      if (!formattedNumber.includes('@c.us')) {
        formattedNumber = `${formattedNumber}@c.us`;
      }
      
      const result = await waClient.sendImage(
        formattedNumber,
        base64Data,
        req.file.originalname,
        sanitizedCaption
      );
      
      messageIds.push(result);
    }
    
    res.json({
      success: true,
      messageIds,
    });
  } catch (error) {
    console.error('Error saat mengirim pesan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim pesan: ' + error.message,
    });
  }
});

// Serve halaman admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve halaman utama untuk semua rute lain (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Mulai server dengan fallback ke port alternatif jika port utama sudah digunakan
const startServer = (port) => {
  try {
    const server = app.listen(port, () => {
      console.log(`Server berjalan di http://localhost:${port}`);
    });
    
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${port} sudah digunakan, mencoba port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Server error:', e);
      }
    });
  } catch (err) {
    console.error('Gagal memulai server:', err);
    process.exit(1);
  }
};

startServer(PORT);