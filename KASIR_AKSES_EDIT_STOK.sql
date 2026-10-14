-- RUANG CUKUR: akses kasir untuk melihat inventaris dan mengubah STOK saja.
-- Jalankan di Supabase SQL Editor sebagai pemilik project.
-- Kasir tidak diberi hak mengubah nama, harga, kode, atau status produk melalui RPC ini.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cashier_read_inventory_products ON public.products;
CREATE POLICY cashier_read_inventory_products
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role::text = 'kasir'
      AND COALESCE(p.status::text, 'active') = 'active'
  )
);

CREATE OR REPLACE FUNCTION public.cashier_update_product_stock(
  p_product_id uuid,
  p_stock integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Login diperlukan.';
  END IF;

  IF p_stock IS NULL OR p_stock < 0 THEN
    RAISE EXCEPTION 'Stok harus bilangan bulat nol atau lebih.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role::text = 'kasir'
      AND COALESCE(p.status::text, 'active') = 'active'
  ) THEN
    RAISE EXCEPTION 'Hanya akun kasir aktif yang dapat menggunakan fungsi ini.';
  END IF;

  UPDATE public.products
  SET stock = p_stock,
      updated_at = now()
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk tidak ditemukan.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cashier_update_product_stock(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cashier_update_product_stock(uuid, integer) TO authenticated;
GRANT SELECT ON public.products TO authenticated;
