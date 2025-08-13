@echo off
echo ===================================
echo    SETUP PHOTOBOOTH APPLICATION
echo ===================================
echo.

:: Pindah ke direktori photobooth2
cd /d %~dp0

echo Membuat file .env...
echo PORT=3000> .env
echo ADMIN_TOKEN=admin123>> .env
echo File .env berhasil dibuat dengan konfigurasi default.
echo.

echo Menginstall dependensi npm...
npm install
echo.

echo ===================================
echo Setup selesai! Untuk menjalankan aplikasi, gunakan:
echo run-photobooth.bat
echo ===================================
echo.

pause