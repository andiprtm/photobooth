# Photobooth App

Aplikasi PWA Photobooth lokal sederhana dengan fitur pengiriman WhatsApp.

## Fitur

- Ambil gambar dari kamera (depan/belakang)
- Countdown 3-2-1 sebelum mengambil gambar
- Komposisi foto dengan overlay frame
- Kontrol dasar (zoom, rotasi, kecerahan, kontras)
- Simpan hasil sebagai JPEG/PNG ke sisi klien (download)
- Kirim hasil ke WhatsApp melalui backend
- Progressive Web App (PWA) yang dapat diinstal dan berfungsi offline

## Teknologi

- **Frontend**: HTML, CSS, JavaScript murni (tanpa framework)
- **Backend**: Node.js, Express
- **WhatsApp API**: whatsapp-web.js

## Cara Menjalankan

### Prasyarat

- Node.js (versi 14 atau lebih baru)
- NPM

### Langkah-langkah

1. Clone atau download repository ini

2. Install dependensi

   ```bash
   npm install
   ```

3. Buat file `.env` (atau gunakan yang sudah ada) dengan konfigurasi berikut:

   ```
   PORT=3000
   ADMIN_TOKEN=admin123
   ```

4. Jalankan server

   ```bash
   node server.js
   ```

5. Buka aplikasi di browser

   - Photobooth: [http://localhost:3000](http://localhost:3000) (atau port alternatif yang ditampilkan di terminal)
   - Admin Panel: [http://localhost:3000/admin](http://localhost:3000/admin) (sesuaikan port jika diperlukan)

6. Pada halaman admin, scan QR code untuk menghubungkan WhatsApp

## Struktur Proyek

```
├── public/                 # Frontend assets
│   ├── index.html          # Halaman utama photobooth
│   ├── admin.html          # Halaman admin untuk WhatsApp
│   ├── manifest.webmanifest # Konfigurasi PWA
│   ├── sw.js               # Service Worker untuk PWA
│   ├── styles/             # CSS files
│   │   └── main.css        # Stylesheet utama
│   ├── scripts/            # JavaScript modules
│   │   ├── app.js          # Entry point aplikasi
│   │   ├── camera.js       # Modul kamera
│   │   ├── editor.js       # Modul editor foto
│   │   ├── frames.js       # Modul frame
│   │   ├── waClient.js     # Modul client WhatsApp
│   │   ├── utils.js        # Fungsi utilitas
│   │   └── admin.js        # Script halaman admin
│   └── frames/             # Frame dan aset gambar
│       ├── frame1.svg      # Frame contoh
│       ├── frame2.svg      # Frame contoh
│       ├── frame3.svg      # Frame contoh
│       └── index.json      # Daftar frame
├── server.js               # Server Express
├── wa.js                   # Modul WhatsApp
├── package.json            # Dependensi Node.js
└── .env                    # Konfigurasi environment
```

## Catatan Penting

- Aplikasi ini dirancang untuk penggunaan lokal/event pribadi, bukan untuk deployment publik.
- Sesi WhatsApp disimpan di folder `.wwebjs_session` dan harus dijaga di mesin yang sama.
- Pastikan perangkat memiliki kamera yang berfungsi dan memberikan izin akses kamera.
- Untuk iOS Safari, kamera akan dimulai setelah interaksi pengguna (tap tombol).
- Server secara otomatis mencari port alternatif jika port default (3000) sudah digunakan. Perhatikan output terminal untuk melihat port yang digunakan.

## Pengembangan Lanjutan

- Tambahkan lebih banyak frame dan efek
- Implementasikan fitur galeri untuk melihat foto yang telah diambil
- Tambahkan autentikasi untuk halaman admin
- Tingkatkan UI/UX sesuai kebutuhan

## Lisensi

ISC