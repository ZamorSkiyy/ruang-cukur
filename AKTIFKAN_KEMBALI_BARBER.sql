-- RUANG CUKUR: aktifkan/nonaktifkan kembali profil barber dari menu Manajemen Barber.
-- Jalankan sekali di Supabase SQL Editor sebagai pemilik project.
-- Mengubah status profil saja; tidak menghapus transaksi/payroll.

CREATE OR REPLACE FUNCTION public.owner_set_barber_status(
  p_barber_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role::text IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Hanya owner/admin yang boleh mengubah status barber.';
  END IF;

  IF p_status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Status harus active atau inactive.';
  END IF;

  UPDATE public.profiles
  SET status = p_status
  WHERE id = p_barber_id
    AND role::text = 'barber';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil barber tidak ditemukan.';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN p_status = 'active'
      THEN 'Barber berhasil diaktifkan kembali.'
      ELSE 'Barber berhasil dinonaktifkan.' END
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.owner_set_barber_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_set_barber_status(uuid, text) TO authenticated;
