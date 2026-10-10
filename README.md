# Ruang Cukur

PWA sederhana untuk manajemen Ruang Cukur berbasis Supabase.

## Versi ini
- Login Supabase
- Dashboard omzet/transaksi harian
- Input transaksi layanan
- Daftar layanan aktif
- Payroll bulanan
- Dua metode payroll: 50:50 dan Gaji + Bonus Omzet
- Pengaturan payroll yang dapat dibuat berdasarkan periode
- Snapshot payroll tersimpan di database
- Role mengikuti database: `owner`, `admin`, `barber`

## Aturan payroll aktif
Mulai 1 Oktober 2026: Rp2.200.000 + 20% dari omzet jasa di atas Rp10.000.000, bonus pool dibagi kepada barber aktif.

Aturan payroll disimpan di Supabase, bukan ditanam permanen di JavaScript.

- Laporan Omzet Barber: filter hari, minggu, bulan, tahun, dan barber.


## Perbaikan absensi mandiri barber
1. Upload seluruh isi folder ini ke GitHub/repository Vercel.
2. Jalankan `ABSENSI_BARBER_SELF_SERVICE.sql` di Supabase SQL Editor.
3. Deploy ulang di Vercel, lalu buka situs dan refresh.
4. Login sebagai barber, pilih Menu > Absensi Barber > Absen Hadir Hari Ini.

Barber hanya dapat membuat/melihat absensi miliknya sendiri untuk hari ini. Owner/admin tetap dapat mencatat absensi semua barber.
