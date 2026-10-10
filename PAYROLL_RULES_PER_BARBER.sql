-- Ruang Cukur: aturan payroll umum atau khusus per barber + aktivasi/nonaktifkan aturan.
-- Jalankan di Supabase SQL Editor sebagai project owner.
ALTER TABLE public.payroll_settings
  ADD COLUMN IF NOT EXISTS barber_id uuid NULL REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- Status inactive sengaja dipakai sebagai soft-disable agar aturan dan riwayat tetap ada.
-- Jika kolom status memiliki CHECK constraint yang hanya mengizinkan 'active',
-- sesuaikan constraint tersebut untuk mengizinkan 'inactive' sebelum memakai tombol Nonaktifkan.

CREATE OR REPLACE FUNCTION public.generate_monthly_payroll(p_period_month date)
RETURNS TABLE(barber_id uuid, period_month date, payroll_method text, service_turnover numeric, base_salary numeric, share_amount numeric, bonus_amount numeric, total_salary numeric, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_start date := date_trunc('month', p_period_month)::date;
  v_end date := (date_trunc('month', p_period_month) + interval '1 month')::date;
  b record;
  v_method text; v_base numeric; v_threshold numeric; v_bonus_rate numeric;
  v_daily_rate numeric; v_commission_rate numeric; v_effective_from date;
  v_turnover numeric; v_barber_share numeric; v_heads integer; v_days integer;
  v_bonus numeric; v_total numeric; v_caller_role text; v_specific boolean; v_global_turnover numeric; v_active_count integer;
BEGIN
  SELECT p.role INTO v_caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF coalesce(v_caller_role,'') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Hanya owner/admin yang dapat membuat payroll';
  END IF;

  IF EXISTS (SELECT 1 FROM public.payroll pay WHERE pay.period_month=v_start AND pay.status IN ('approved','paid')) THEN
    RAISE EXCEPTION 'Payroll periode % sudah approved/paid; riwayat pembayaran aman dan tidak dibuat ulang', v_start;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.payroll_settings ps
    WHERE ps.status='active' AND ps.effective_from < v_end
      AND (ps.effective_to IS NULL OR ps.effective_to >= v_start)
  ) THEN RAISE EXCEPTION 'Tidak ada aturan payroll aktif untuk periode %', v_start; END IF;

  DELETE FROM public.payroll pay WHERE pay.period_month=v_start AND pay.status IN ('draft','cancelled');
  SELECT coalesce(sum(t.price_snapshot),0) INTO v_global_turnover FROM public.transactions t WHERE t.transaction_date >= v_start AND t.transaction_date < v_end;
  SELECT count(*)::integer INTO v_active_count FROM public.profiles p WHERE p.role='barber' AND p.status='active';
  IF coalesce(v_active_count,0)=0 THEN RAISE EXCEPTION 'Tidak ada barber aktif'; END IF;

  FOR b IN SELECT p.id FROM public.profiles p WHERE p.role='barber' AND p.status='active' LOOP
    -- Aturan khusus barber didahulukan; jika tidak ada, gunakan aturan umum (barber_id IS NULL).
    v_specific := false;
    SELECT ps.method, coalesce(ps.base_salary,0), coalesce(ps.turnover_threshold,0), coalesce(ps.bonus_rate,0),
           coalesce(ps.daily_rate,60000), coalesce(ps.commission_rate,8000), ps.effective_from, (ps.barber_id IS NOT NULL)
      INTO v_method,v_base,v_threshold,v_bonus_rate,v_daily_rate,v_commission_rate,v_effective_from,v_specific
    FROM public.payroll_settings ps
    WHERE ps.status='active' AND ps.effective_from < v_end
      AND (ps.effective_to IS NULL OR ps.effective_to >= v_start)
      AND (ps.barber_id = b.id OR ps.barber_id IS NULL)
    ORDER BY CASE WHEN ps.barber_id = b.id THEN 0 ELSE 1 END,
             ps.effective_from DESC, ps.created_at DESC LIMIT 1;

    IF v_method IS NULL THEN
      RAISE EXCEPTION 'Tidak ada aturan payroll aktif untuk barber % pada periode %', b.id, v_start;
    END IF;

    SELECT coalesce(sum(t.price_snapshot),0), coalesce(sum(t.barber_share),0), count(*)::integer
      INTO v_turnover,v_barber_share,v_heads
    FROM public.transactions t
    WHERE t.barber_id=b.id
      AND t.transaction_date >= v_start AND t.transaction_date < v_end;

    SELECT count(*)::integer INTO v_days FROM public.barber_attendance a
    WHERE a.barber_id=b.id AND a.present=true
      AND a.attendance_date >= GREATEST(v_start, CASE WHEN v_method='daily_plus_commission' THEN v_effective_from ELSE v_start END)
      AND a.attendance_date < v_end;

    -- Aturan umum mempertahankan skema bonus pool omzet toko dibagi rata. Aturan khusus barber menghitung bonus dari omzet barber itu sendiri.
    v_bonus := CASE WHEN v_method='base_plus_turnover_bonus' AND v_specific THEN greatest(v_turnover-v_threshold,0)*v_bonus_rate
                    WHEN v_method='base_plus_turnover_bonus' THEN (greatest(v_global_turnover-v_threshold,0)*v_bonus_rate)/v_active_count ELSE 0 END;
    v_total := CASE
      WHEN v_method='profit_share_50_50' THEN v_barber_share
      WHEN v_method='daily_plus_commission' THEN (v_days*v_daily_rate)+(v_heads*v_commission_rate)
      ELSE v_base+v_bonus END;

    INSERT INTO public.payroll (
      period_month,barber_id,payroll_method,base_salary,turnover_threshold,bonus_rate,
      barber_share_rate,owner_share_rate,service_turnover,share_amount,bonus_pool,bonus_amount,total_salary,status,created_by,
      attendance_days,commission_heads,daily_rate,commission_rate
    ) VALUES (
      v_start,b.id,v_method,
      CASE WHEN v_method='base_plus_turnover_bonus' THEN v_base WHEN v_method='daily_plus_commission' THEN v_days*v_daily_rate ELSE 0 END,
      CASE WHEN v_method='base_plus_turnover_bonus' THEN v_threshold ELSE 0 END,
      CASE WHEN v_method='base_plus_turnover_bonus' THEN v_bonus_rate ELSE 0 END,
      CASE WHEN v_method='profit_share_50_50' THEN 0.5 ELSE 0 END,
      CASE WHEN v_method='profit_share_50_50' THEN 0.5 ELSE 0 END,
      v_turnover,
      CASE WHEN v_method='profit_share_50_50' THEN v_barber_share WHEN v_method='daily_plus_commission' THEN v_heads*v_commission_rate ELSE 0 END,
      CASE WHEN v_method='base_plus_turnover_bonus' AND NOT v_specific THEN v_bonus*v_active_count ELSE v_bonus END, v_bonus,v_total,'draft',auth.uid(),
      CASE WHEN v_method='daily_plus_commission' THEN v_days ELSE 0 END,
      CASE WHEN v_method='daily_plus_commission' THEN v_heads ELSE 0 END,
      CASE WHEN v_method='daily_plus_commission' THEN v_daily_rate ELSE 0 END,
      CASE WHEN v_method='daily_plus_commission' THEN v_commission_rate ELSE 0 END
    );
  END LOOP;

  RETURN QUERY SELECT pay.barber_id,pay.period_month,pay.payroll_method,pay.service_turnover,pay.base_salary,pay.share_amount,pay.bonus_amount,pay.total_salary,pay.status
  FROM public.payroll pay WHERE pay.period_month=v_start ORDER BY pay.created_at;
END;
$function$;
