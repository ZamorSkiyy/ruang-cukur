-- Ruang Cukur: izinkan akun Kasir memilih barber dan mencatat absensi.
-- Jalankan di Supabase > SQL Editor sebagai project owner.
-- Mendukung role 'kasir' dan 'cashier'.

-- SECURITY DEFINER menghindari policy profiles membaca profiles melalui RLS
-- dan menyebabkan infinite recursion.
CREATE OR REPLACE FUNCTION public.current_user_is_cashier()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(coalesce(p.role, '')) IN ('kasir', 'cashier')
  );
$function$;

REVOKE ALL ON FUNCTION public.current_user_is_cashier() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_cashier() TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_attendance ENABLE ROW LEVEL SECURITY;

-- Kasir boleh membaca profil barber untuk dropdown absensi.
DROP POLICY IF EXISTS cashier_select_barber_profiles ON public.profiles;
CREATE POLICY cashier_select_barber_profiles
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'barber'
  AND public.current_user_is_cashier()
);

-- Kasir boleh melihat absensi seluruh barber.
DROP POLICY IF EXISTS cashier_select_barber_attendance ON public.barber_attendance;
CREATE POLICY cashier_select_barber_attendance
ON public.barber_attendance
FOR SELECT
TO authenticated
USING (public.current_user_is_cashier());

-- Kasir boleh mencatat kehadiran untuk profil yang memang ber-role barber.
DROP POLICY IF EXISTS cashier_insert_barber_attendance ON public.barber_attendance;
CREATE POLICY cashier_insert_barber_attendance
ON public.barber_attendance
FOR INSERT
TO authenticated
WITH CHECK (
  recorded_by = auth.uid()
  AND public.current_user_is_cashier()
  AND EXISTS (
    SELECT 1
    FROM public.profiles b
    WHERE b.id = barber_attendance.barber_id
      AND b.role = 'barber'
  )
);

-- Diperlukan oleh upsert saat absensi tanggal tersebut sudah ada.
DROP POLICY IF EXISTS cashier_update_barber_attendance ON public.barber_attendance;
CREATE POLICY cashier_update_barber_attendance
ON public.barber_attendance
FOR UPDATE
TO authenticated
USING (public.current_user_is_cashier())
WITH CHECK (
  recorded_by = auth.uid()
  AND public.current_user_is_cashier()
  AND EXISTS (
    SELECT 1
    FROM public.profiles b
    WHERE b.id = barber_attendance.barber_id
      AND b.role = 'barber'
  )
);
