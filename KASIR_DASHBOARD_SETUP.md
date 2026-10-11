# Tombol Tambah Kasir di Dashboard Owner

Pembaruan ini menambahkan panel **Manajemen Kasir** di Dashboard untuk Owner/Admin. Pembuatan akun dilakukan melalui Supabase Edge Function, bukan dari browser dengan service-role key.

## Deploy wajib sebelum menggunakan tombol
1. Pastikan role `kasir` sudah didukung oleh skema/profile dan policy RLS proyek.
2. Deploy folder `supabase/functions/create-cashier` dan file bersama `supabase/functions/_shared/cors.ts` sebagai Edge Function bernama `create-cashier`.
3. Pastikan secrets Edge Function tersedia: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY`. Jangan pernah menaruh service-role key di `config.js` atau kode browser.
4. Upload `index.html` dan `app.js` ke GitHub, lalu tunggu deployment Vercel selesai.
5. Login sebagai Owner/Admin aktif, buka Dashboard, klik **+ Tambah Kasir**, lalu isi nama, email, dan password awal minimal 8 karakter.

## Catatan skema
Function ini mengasumsikan `profiles` memiliki kolom `id`, `name`, `email`, `role`, dan `status`, dengan status aktif bernilai `active`. Jika nama kolom/status di database berbeda, sesuaikan function sebelum deploy. Uji dengan akun kasir percobaan terlebih dahulu.
