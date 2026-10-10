-- Ruang Cukur: izinkan barber mengisi dan melihat absensi miliknya sendiri.
-- Owner/admin tetap memiliki akses pengelolaan absensi semua barber.
ALTER TABLE public.barber_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS barber_attendance_self_select ON public.barber_attendance;
DROP POLICY IF EXISTS barber_attendance_self_insert ON public.barber_attendance;
DROP POLICY IF EXISTS barber_attendance_self_update ON public.barber_attendance;
CREATE POLICY barber_attendance_self_select ON public.barber_attendance
  FOR SELECT TO authenticated
  USING (barber_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'barber'
  ));
CREATE POLICY barber_attendance_self_insert ON public.barber_attendance
  FOR INSERT TO authenticated
  WITH CHECK (barber_id = auth.uid() AND recorded_by = auth.uid() AND present = true AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'barber'
  ));
CREATE POLICY barber_attendance_self_update ON public.barber_attendance
  FOR UPDATE TO authenticated
  USING (barber_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'barber'
  ))
  WITH CHECK (barber_id = auth.uid() AND recorded_by = auth.uid() AND present = true AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'barber'
  ));
