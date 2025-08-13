@echo off
echo Menjalankan Photobooth App pada port 7890...

:: Pindah ke direktori photobooth2
cd /d %~dp0

:: Backup file .env asli jika belum ada backup
if not exist .env.backup (
    copy .env .env.backup
    echo File .env telah di-backup ke .env.backup
)

:: Ubah PORT di file .env menjadi 7890
powershell -Command "(Get-Content .env) -replace 'PORT=\d+', 'PORT=7890' | Set-Content .env"

echo Port telah diatur ke 7890
echo.

:: Jalankan aplikasi
echo Menjalankan npm run dev...
npm run dev

:: Kembalikan file .env asli saat aplikasi ditutup
echo.
echo Mengembalikan konfigurasi asli...
copy .env.backup .env /y > nul
echo Konfigurasi asli telah dikembalikan.

pause