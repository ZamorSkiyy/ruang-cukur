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
