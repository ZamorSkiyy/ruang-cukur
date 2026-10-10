-- Ruang Cukur: perbaikan generate payroll untuk metode harian + komisi.
-- Jalankan setelah memeriksa pengaturan aktif. Tidak menghapus payroll paid/approved.
CREATE OR REPLACE FUNCTION public.generate_monthly_payroll(p_period_month date)
RETURNS TABLE(barber_id uuid, period_month date, payroll_method text, service_turnover numeric, base_salary numeric, share_amount numeric, bonus_amount numeric, total_salary numeric, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_start date := date_trunc('month', p_period_month)::date;
  v_end date := (date_trunc('month', p_period_month) + interval '1 month')::date;
  v_method text; v_base numeric := 0; v_threshold numeric := 0; v_bonus_rate numeric := 0;
  v_daily_rate numeric := 60000; v_commission_rate numeric := 8000;
  v_effective_from date; v_turnover numeric := 0; v_bonus_pool numeric := 0; v_barber_count integer := 0;
  v_caller_role text; v_matching_rules integer := 0;
BEGIN
  SELECT p.role INTO v_caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF coalesce(v_caller_role,'') NOT IN ('owner','admin') THEN RAISE EXCEPTION 'Hanya owner/admin yang dapat membuat payroll'; END IF;

  -- Pilih aturan aktif terbaru yang masa berlakunya bersinggungan dengan bulan ini.
  -- Untuk metode harian yang mulai di tengah bulan, absensi/transaksi hanya dihitung sejak effective_from.
  SELECT count(*) INTO v_matching_rules FROM public.payroll_settings ps
  WHERE ps.status='active' AND ps.effective_from < v_end
    AND (ps.effective_to IS NULL OR ps.effective_to >= v_start);
  IF v_matching_rules = 0 THEN RAISE EXCEPTION 'Tidak ada aturan payroll aktif untuk periode %', v_start; END IF;

  SELECT ps.method, coalesce(ps.base_salary,0), coalesce(ps.turnover_threshold,0), coalesce(ps.bonus_rate,0),
         coalesce(ps.daily_rate,60000), coalesce(ps.commission_rate,8000), ps.effective_from
    INTO v_method,v_base,v_threshold,v_bonus_rate,v_daily_rate,v_commission_rate,v_effective_from
  FROM public.payroll_settings ps
  WHERE ps.status='active' AND ps.effective_from < v_end
    AND (ps.effective_to IS NULL OR ps.effective_to >= v_start)
  ORDER BY ps.effective_from DESC, ps.created_at DESC LIMIT 1;

  IF EXISTS (SELECT 1 FROM public.payroll pay WHERE pay.period_month=v_start AND pay.status IN ('approved','paid')) THEN
    RAISE EXCEPTION 'Payroll periode % sudah approved/paid; tidak dibuat ulang agar riwayat pembayaran aman',v_start;
  END IF;

  SELECT coalesce(sum(t.price_snapshot),0) INTO v_turnover FROM public.transactions t
   WHERE t.transaction_date >= v_start AND t.transaction_date < v_end;
  SELECT count(*) INTO v_barber_count FROM public.profiles p WHERE p.role='barber' AND p.status='active';
  IF v_barber_count=0 THEN RAISE EXCEPTION 'Tidak ada barber aktif'; END IF;
  IF v_method='base_plus_turnover_bonus' THEN v_bonus_pool := greatest(v_turnover-v_threshold,0)*v_bonus_rate; END IF;

  DELETE FROM public.payroll pay WHERE pay.period_month=v_start AND pay.status IN ('draft','cancelled');

  INSERT INTO public.payroll (
    period_month,barber_id,payroll_method,base_salary,turnover_threshold,bonus_rate,
    barber_share_rate,owner_share_rate,service_turnover,share_amount,bonus_pool,bonus_amount,total_salary,status,created_by,
    attendance_days,commission_heads,daily_rate,commission_rate
  )
  SELECT v_start,p.id,v_method,
    CASE WHEN v_method='base_plus_turnover_bonus' THEN v_base
         WHEN v_method='daily_plus_commission' THEN att.days_present*v_daily_rate ELSE 0 END,
    CASE WHEN v_method='base_plus_turnover_bonus' THEN v_threshold ELSE 0 END,
    CASE WHEN v_method='base_plus_turnover_bonus' THEN v_bonus_rate ELSE 0 END,
    CASE WHEN v_method='profit_share_50_50' THEN 0.5 ELSE 0 END,
    CASE WHEN v_method='profit_share_50_50' THEN 0.5 ELSE 0 END,
    coalesce(tx.turnover,0),
    CASE WHEN v_method='profit_share_50_50' THEN coalesce(tx.barber_share,0)
         WHEN v_method='daily_plus_commission' THEN tx.heads*v_commission_rate ELSE 0 END,
    CASE WHEN v_method='base_plus_turnover_bonus' THEN v_bonus_pool ELSE 0 END,
    CASE WHEN v_method='base_plus_turnover_bonus' THEN v_bonus_pool/v_barber_count ELSE 0 END,
    CASE WHEN v_method='profit_share_50_50' THEN coalesce(tx.barber_share,0)
         WHEN v_method='base_plus_turnover_bonus' THEN v_base+(v_bonus_pool/v_barber_count)
         WHEN v_method='daily_plus_commission' THEN (att.days_present*v_daily_rate)+(tx.heads*v_commission_rate) ELSE 0 END,
    'draft',auth.uid(),
    CASE WHEN v_method='daily_plus_commission' THEN att.days_present ELSE 0 END,
    CASE WHEN v_method='daily_plus_commission' THEN tx.heads ELSE 0 END,
    CASE WHEN v_method='daily_plus_commission' THEN v_daily_rate ELSE 0 END,
    CASE WHEN v_method='daily_plus_commission' THEN v_commission_rate ELSE 0 END
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS days_present FROM public.barber_attendance a
    WHERE a.barber_id=p.id AND a.present=true
      AND a.attendance_date >= GREATEST(v_start, CASE WHEN v_method='daily_plus_commission' THEN v_effective_from ELSE v_start END)
      AND a.attendance_date < v_end
  ) att ON true
  LEFT JOIN LATERAL (
    SELECT coalesce(sum(t.price_snapshot),0) AS turnover, coalesce(sum(t.barber_share),0) AS barber_share, count(*)::integer AS heads
    FROM public.transactions t WHERE t.barber_id=p.id
      AND t.transaction_date >= GREATEST(v_start, CASE WHEN v_method='daily_plus_commission' THEN v_effective_from ELSE v_start END)
      AND t.transaction_date < v_end
  ) tx ON true
  WHERE p.role='barber' AND p.status='active';

  RETURN QUERY SELECT pay.barber_id,pay.period_month,pay.payroll_method,pay.service_turnover,pay.base_salary,pay.share_amount,pay.bonus_amount,pay.total_salary,pay.status
  FROM public.payroll pay WHERE pay.period_month=v_start ORDER BY pay.created_at;
END;
$function$;
