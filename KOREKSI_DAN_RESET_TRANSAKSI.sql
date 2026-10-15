-- RUANG CUKUR: izin koreksi transaksi dan reset khusus owner.
-- Jalankan di Supabase SQL Editor sebagai pemilik project.
-- Periksa dahulu nama kolom dan trigger stok pada proyek sebelum menjalankan.

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

-- Owner boleh mengoreksi semua transaksi; barber hanya transaksi miliknya.
DROP POLICY IF EXISTS transaction_update_owner_barber ON public.transactions;
CREATE POLICY transaction_update_owner_barber ON public.transactions
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text IN ('owner','kasir'))
  OR (barber_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'barber'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text IN ('owner','kasir'))
  OR (barber_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'barber'))
);

DROP POLICY IF EXISTS transaction_delete_owner_barber ON public.transactions;
CREATE POLICY transaction_delete_owner_barber ON public.transactions
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text IN ('owner','kasir'))
  OR (barber_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'barber'))
);

DROP POLICY IF EXISTS product_sales_update_owner_barber ON public.product_sales;
CREATE POLICY product_sales_update_owner_barber ON public.product_sales
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text IN ('owner','kasir'))
  OR (sold_by = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'barber'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text IN ('owner','kasir'))
  OR (sold_by = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'barber'))
);

DROP POLICY IF EXISTS product_sales_delete_owner_barber ON public.product_sales;
CREATE POLICY product_sales_delete_owner_barber ON public.product_sales
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text IN ('owner','kasir'))
  OR (sold_by = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'barber'))
);

-- RPC reset hanya owner. Mengembalikan stok dari penjualan yang dihapus.
CREATE OR REPLACE FUNCTION public.owner_reset_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'owner'
  ) THEN
    RAISE EXCEPTION 'Hanya owner yang boleh reset transaksi.';
  END IF;

  UPDATE public.products pr
  SET stock = COALESCE(pr.stock, 0) + sales.qty
  FROM (
    SELECT product_id, SUM(quantity)::integer AS qty
    FROM public.product_sales
    GROUP BY product_id
  ) sales
  WHERE pr.id = sales.product_id;

  DELETE FROM public.product_sales;
  DELETE FROM public.transactions;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_reset_transactions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_reset_transactions() TO authenticated;
