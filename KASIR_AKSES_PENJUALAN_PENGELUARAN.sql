-- RUANG CUKUR: akses kasir untuk penjualan produk dan pencatatan pengeluaran
-- Jalankan di Supabase SQL Editor menggunakan akun pemilik project.
-- Kebijakan ini menambahkan akses kasir tanpa menghapus kebijakan yang sudah ada.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Kasir boleh melihat produk aktif yang masih tersedia untuk transaksi penjualan.
DROP POLICY IF EXISTS cashier_read_products_for_sale ON public.products;
CREATE POLICY cashier_read_products_for_sale ON public.products
FOR SELECT TO authenticated
USING (
  status = 'active'
  AND COALESCE(stock, 0) > 0
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text = 'kasir'
      AND COALESCE(p.status::text, 'active') = 'active'
  )
);

-- Kasir dapat melihat daftar penjualan produk.
DROP POLICY IF EXISTS cashier_read_product_sales ON public.product_sales;
CREATE POLICY cashier_read_product_sales ON public.product_sales
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text = 'kasir'
      AND COALESCE(p.status::text, 'active') = 'active'
  )
);

-- Jika fungsi sell_product melakukan INSERT sebagai user biasa, kebijakan ini mengizinkan
-- catatan penjualan yang dibuat atas nama kasir yang sedang login.
DROP POLICY IF EXISTS cashier_insert_product_sales ON public.product_sales;
CREATE POLICY cashier_insert_product_sales ON public.product_sales
FOR INSERT TO authenticated
WITH CHECK (
  sold_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text = 'kasir'
      AND COALESCE(p.status::text, 'active') = 'active'
  )
);

-- Kasir dapat mencatat dan membaca pengeluaran.
DROP POLICY IF EXISTS cashier_read_expenses ON public.expenses;
CREATE POLICY cashier_read_expenses ON public.expenses
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text = 'kasir'
      AND COALESCE(p.status::text, 'active') = 'active'
  )
);

DROP POLICY IF EXISTS cashier_insert_expenses ON public.expenses;
CREATE POLICY cashier_insert_expenses ON public.expenses
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text = 'kasir'
      AND COALESCE(p.status::text, 'active') = 'active'
  )
);

GRANT SELECT ON public.products TO authenticated;
GRANT SELECT, INSERT ON public.product_sales TO authenticated;
GRANT SELECT, INSERT ON public.expenses TO authenticated;

-- Catatan: fungsi RPC public.sell_product(...) mungkin memiliki pemeriksaan role tersendiri.
-- Jika setelah menjalankan SQL ini muncul pesan 
-- Catatan: RPC sell_product mungkin memiliki pemeriksaan role tersendiri.
-- Jika penjualan masih gagal, kirimkan pesan error persis dari aplikasi.
