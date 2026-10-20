-- RUANG CUKUR: barber dapat membaca transaksi jasa yang ditugaskan kepadanya,
-- termasuk transaksi yang dibuat oleh akun Owner/Admin/Kasir.
-- Jalankan sekali di Supabase SQL Editor.

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS barber_read_assigned_transactions ON public.transactions;

CREATE POLICY barber_read_assigned_transactions
ON public.transactions
FOR SELECT
TO authenticated
USING (
  barber_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role::text = 'barber'
      AND COALESCE(p.status::text, 'active') = 'active'
  )
);

GRANT SELECT ON public.transactions TO authenticated;
