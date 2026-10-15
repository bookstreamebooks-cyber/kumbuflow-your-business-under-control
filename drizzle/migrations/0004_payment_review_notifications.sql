CREATE OR REPLACE FUNCTION public.notify_payment_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pname text;
BEGIN
  IF OLD.status='pending' AND NEW.status IN ('approved','rejected') THEN
    SELECT name INTO pname FROM public.plans WHERE id=NEW.plan_id;
    INSERT INTO public.notifications(business_id,message) VALUES(NEW.business_id,
      CASE WHEN NEW.status='approved' THEN 'O teu pagamento (ref. '||NEW.reference||') foi aprovado. Plano '||coalesce(pname,'')||' activado.'
      ELSE 'O teu pedido de renovação (ref. '||NEW.reference||') foi rejeitado. Motivo: '||coalesce(NEW.review_note,'—') END);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payment_review_notify AFTER UPDATE ON public.payment_requests FOR EACH ROW EXECUTE FUNCTION public.notify_payment_review();
CREATE OR REPLACE FUNCTION public.mark_notifications_read(b uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT public.owns_business(b) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
UPDATE public.notifications SET read_at=now() WHERE business_id=b AND read_at IS NULL; END $$;
REVOKE EXECUTE ON FUNCTION public.notify_payment_review() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid) TO authenticated;