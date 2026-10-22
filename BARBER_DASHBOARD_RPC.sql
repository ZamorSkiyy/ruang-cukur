-- Ruang Cukur: data Dashboard Barber secara aman melalui RPC.
-- Jalankan seluruh file ini di Supabase > SQL Editor sebagai project owner.
-- Fungsi hanya mengembalikan ringkasan milik barber yang sedang login.
CREATE OR REPLACE FUNCTION public.get_barber_dashboard_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_month_start date := date_trunc('month', CURRENT_DATE)::date;
  v_next_month date := (date_trunc('month', CURRENT_DATE) + interval '1 month')::date;
  v_rule public.payroll_settings%ROWTYPE;
  v_calc_start date;
  v_turnover numeric := 0;
  v_customer_count integer := 0;
  v_attendance_days integer := 0;
  v_active_barbers integer := 0;
  v_global_turnover numeric := 0;
  v_income numeric := 0;
  v_bonus numeric := 0;
  v_base_salary numeric := 0;
  v_threshold numeric := 0;
  v_bonus_rate numeric := 0;
  v_daily_rate numeric := 60000;
  v_commission_rate numeric := 8000;
  v_barber_rate numeric := 0.5;
  v_daily_pay numeric := 0;
  v_commission numeric := 0;
  v_method_label text;
  v_breakdown jsonb := '[]'::jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Silakan login terlebih dahulu.';
  END IF;

  SELECT p.role INTO v_role
  FROM public.profiles p
  WHERE p.id = v_user_id;

  IF coalesce(v_role, '') <> 'barber' THEN
    RAISE EXCEPTION 'Dashboard ini hanya tersedia untuk akun barber.';
  END IF;

  -- Aturan khusus barber diprioritaskan; jika tidak ada, gunakan aturan umum.
  SELECT ps.* INTO v_rule
  FROM public.payroll_settings ps
  WHERE ps.status = 'active'
    AND ps.effective_from < v_next_month
    AND (ps.effective_to IS NULL OR ps.effective_to >= v_month_start)
    AND (ps.barber_id = v_user_id OR ps.barber_id IS NULL)
  ORDER BY (ps.barber_id = v_user_id) DESC,
           ps.effective_from DESC,
           ps.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Belum ada aturan payroll aktif yang berlaku untuk akun ini. Owner/Admin perlu mengaktifkan aturan gaji untuk barber ini atau aturan umum.';
  END IF;

  v_calc_start := v_month_start;
  IF v_rule.method = 'daily_plus_commission' THEN
    v_calc_start := greatest(v_month_start, v_rule.effective_from);
  END IF;

  SELECT coalesce(sum(t.price_snapshot), 0), count(*)::integer
    INTO v_turnover, v_customer_count
  FROM public.transactions t
  WHERE t.barber_id = v_user_id
    AND t.transaction_date >= v_calc_start
    AND t.transaction_date < v_next_month;

  SELECT count(*)::integer INTO v_attendance_days
  FROM public.barber_attendance a
  WHERE a.barber_id = v_user_id
    AND a.present = true
    AND a.attendance_date >= v_calc_start
    AND a.attendance_date < v_next_month;

  v_base_salary := coalesce(v_rule.base_salary, 0);
  v_threshold := coalesce(v_rule.turnover_threshold, 0);
  v_bonus_rate := coalesce(v_rule.bonus_rate, 0);
  v_daily_rate := coalesce(v_rule.daily_rate, 60000);
  v_commission_rate := coalesce(v_rule.commission_rate, 8000);
  v_barber_rate := coalesce(v_rule.barber_share_rate, 0.5);

  IF v_rule.method = 'profit_share_50_50' THEN
    -- Sesuai aturan: omzet jasa barber dikalikan persentase bagian barber.
    v_income := v_turnover * v_barber_rate;
    v_method_label := 'Bagi hasil';
    v_breakdown := jsonb_build_array(
      jsonb_build_object('label', 'Omzet jasa bulan ini', 'amount', v_turnover),
      jsonb_build_object('label', 'Bagian barber (' || to_char(v_barber_rate * 100, 'FM999990.0') || '%)', 'amount', v_income)
    );

  ELSIF v_rule.method = 'daily_plus_commission' THEN
    v_daily_pay := v_attendance_days * v_daily_rate;
    v_commission := v_customer_count * v_commission_rate;
    v_income := v_daily_pay + v_commission;
    v_method_label := 'Gaji harian + komisi per pelanggan';
    v_breakdown := jsonb_build_array(
      jsonb_build_object('label', v_attendance_days || ' hari hadir × Rp' || v_daily_rate, 'amount', v_daily_pay),
      jsonb_build_object('label', v_customer_count || ' pelanggan × Rp' || v_commission_rate, 'amount', v_commission)
    );

  ELSIF v_rule.method = 'base_plus_turnover_bonus' THEN
    IF v_rule.barber_id IS NOT NULL THEN
      -- Aturan khusus barber: bonus dari omzet barber sendiri.
      v_bonus := greatest(v_turnover - v_threshold, 0) * v_bonus_rate;
      v_method_label := 'Gaji pokok + bonus omzet pribadi';
    ELSE
      -- Aturan umum: bonus omzet toko dibagi rata ke barber aktif, mengikuti payroll.
      SELECT coalesce(sum(t.price_snapshot), 0) INTO v_global_turnover
      FROM public.transactions t
      WHERE t.transaction_date >= v_month_start
        AND t.transaction_date < v_next_month;

      SELECT count(*)::integer INTO v_active_barbers
      FROM public.profiles p
      WHERE p.role = 'barber' AND p.status = 'active';

      v_bonus := greatest(v_global_turnover - v_threshold, 0) * v_bonus_rate
                 / greatest(coalesce(v_active_barbers, 0), 1);
      v_method_label := 'Gaji pokok + bagian bonus omzet toko';
    END IF;

    v_income := v_base_salary + v_bonus;
    v_breakdown := jsonb_build_array(
      jsonb_build_object('label', 'Gaji pokok', 'amount', v_base_salary),
      jsonb_build_object('label', 'Omzet jasa barber', 'amount', v_turnover),
      jsonb_build_object('label', 'Ambang omzet bonus', 'amount', v_threshold),
      jsonb_build_object('label', 'Bonus omzet (' || to_char(v_bonus_rate * 100, 'FM999990.0') || '%)', 'amount', v_bonus)
    );
  ELSE
    RAISE EXCEPTION 'Metode payroll tidak dikenali: %', v_rule.method;
  END IF;

  RETURN jsonb_build_object(
    'period_month', v_month_start,
    'income', v_income,
    'method_label', v_method_label,
    'customer_count', v_customer_count,
    'attendance_days', v_attendance_days,
    'breakdown', v_breakdown
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_barber_dashboard_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_barber_dashboard_summary() TO authenticated;
