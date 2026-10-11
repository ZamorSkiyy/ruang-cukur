-- Ruang Cukur: role khusus kasir dan pembatasan transaksi di database.
-- Jalankan di Supabase SQL Editor sebagai Owner project.

-- 1) Tambahkan role kasir ke enum yang digunakan profiles.role.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kasir';

-- 2) Validasi transaksi di server/database.
-- Owner/Admin/Kasir boleh memilih barber aktif mana pun.
-- Barber hanya boleh mencatat transaksi atas nama akun barber itu sendiri.
CREATE OR REPLACE FUNCTION public.validate_transaction_actor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_barber_role text;
  v_barber_status text;
BEGIN
  SELECT p.role::text
    INTO v_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan atau belum memiliki role.';
  END IF;

  IF v_role = 'barber' AND NEW.barber_id <> auth.uid() THEN
    RAISE EXCEPTION 'Akun barber hanya boleh mencatat transaksi untuk dirinya sendiri.';
  END IF;

  IF v_role NOT IN ('owner', 'admin', 'kasir', 'barber') THEN
    RAISE EXCEPTION 'Role tidak diizinkan mencatat transaksi.';
  END IF;

  SELECT p.role::text, p.status::text
    INTO v_barber_role, v_barber_status
  FROM public.profiles p
  WHERE p.id = NEW.barber_id;

  IF v_barber_role IS DISTINCT FROM 'barber' OR v_barber_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Transaksi hanya dapat dicatat untuk barber yang aktif.';
  END IF;

  -- created_by selalu mengikuti user yang sedang login, tidak boleh dipalsukan oleh client.
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_transaction_actor ON public.transactions;
CREATE TRIGGER trg_validate_transaction_actor
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.validate_transaction_actor();

-- Catatan: trigger ini memvalidasi siapa yang dicatat pada INSERT.
-- Pastikan RLS tabel transactions tetap aktif dan kebijakan SELECT/INSERT hanya untuk pengguna terautentikasi.

-- 3) Setelah akun kasir dibuat melalui Supabase Dashboard > Authentication > Users,
-- ubah role profilnya dengan query berikut (ganti email sesuai akun kasir).
-- Jalankan bagian ini terpisah setelah akun Auth dibuat dan profilnya sudah tersedia:
-- UPDATE public.profiles SET role = 'kasir', status = 'active'
-- WHERE lower(email) = lower('kasir@ruangcukur.id');
-- SELECT id, name, email, role, status FROM public.profiles
-- WHERE lower(email) = lower('kasir@ruangcukur.id');
