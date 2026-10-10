# Ruang Cukur — Payroll harian + komisi

## Fitur dalam paket
- Form absensi manual per barber/tanggal (upsert, tidak membuat duplikat tanggal).
- Metode payroll `daily_plus_commission` di pengaturan aturan gaji.
- Rincian hari hadir, tarif harian, jumlah pelanggan, tarif komisi pada tampilan payroll.
- Alur status payroll draft → approved → paid.
- Laporan keuangan mengurangkan payroll berstatus approved/paid berdasarkan bulan payroll.
- Metode dan riwayat payroll lama tetap tersedia.

## Penting: urutan instalasi
1. ZIP ini dibuat dari kode aplikasi yang diunggah. Jangan hapus project Supabase yang ada.
2. Migrasi `PAYROLL_ATTENDANCE_MIGRATION.sql` sebelumnya telah dijalankan menurut screenshot pengguna. Jangan jalankan ulang tanpa alasan.
3. Deploy kode ini ke GitHub/Vercel.
4. Login sebagai Owner/Admin → Aturan Gaji → buat aturan baru:
   - Nama: `Gaji Harian + Komisi mulai 10 Okt 2026`
   - Metode: `Gaji Harian + Komisi`
   - Gaji per hari hadir: `60000`
   - Komisi per pelanggan: `8000`
   - Mulai berlaku: `2026-10-10`
5. Sebelum generate payroll Oktober, jalankan `PAYROLL_FUNCTION_FIX.sql` di Supabase SQL Editor. Fungsi ini memilih aturan terbaru yang bersinggungan dengan bulan dan untuk metode harian menghitung absensi/transaksi sejak tanggal efektif aturan.
6. Catat kehadiran pada menu Absensi Barber. Transaksi yang sudah tercatat menjadi sumber komisi.
7. Generate payroll dan periksa nominal. Payroll dibuat sebagai draft; setujui setelah dicek, lalu tandai dibayar setelah transfer.

## Catatan transisi Oktober
Skema baru dihitung dari tanggal efektif 10 Oktober. Fungsi ini tidak otomatis menghitung ulang skema lama untuk 1–9 Oktober. Jika barber masih memiliki hak gaji untuk tanggal 1–9, hitung/rekam penyesuaian periode lama secara terpisah sebelum menyetujui payroll Oktober. Jangan generate jika sudah ada payroll approved/paid.

## Keuangan
Biaya payroll hanya masuk ke laporan keuangan jika status `approved` atau `paid`, dan ditampilkan pada periode laporan yang mencakup tanggal `period_month` (tanggal pertama bulan payroll). Untuk laporan harian/mingguan, payroll bulanan tidak dialokasikan ke hari tertentu.
