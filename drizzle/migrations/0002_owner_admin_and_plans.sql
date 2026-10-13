CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF lower(NEW.email) = 'bookstreamebooks@gmail.com' AND NEW.email_confirmed_at IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'admin') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.grant_owner_admin() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_owner_admin ON auth.users;
CREATE TRIGGER on_auth_user_owner_admin AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();
INSERT INTO public.user_roles(user_id, role)
SELECT u.id, 'admin' FROM auth.users u
WHERE lower(u.email) = 'bookstreamebooks@gmail.com' AND u.email_confirmed_at IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin');

CREATE OR REPLACE FUNCTION public.configure_plan(p_id text, p_name text, p_price numeric, p_days integer, p_enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF p_price <= 0 OR p_days < 1 OR p_days > 365 THEN RAISE EXCEPTION 'Dados do plano inválidos'; END IF;
  INSERT INTO public.plans(id, name, price, duration_days, enabled)
  VALUES (left(trim(p_id),100), left(trim(p_name),100), p_price, p_days, p_enabled)
  ON CONFLICT (id) DO UPDATE SET name = excluded.name, price = excluded.price, duration_days = excluded.duration_days, enabled = excluded.enabled;
  INSERT INTO public.audit_logs(actor_id, event, details) VALUES (auth.uid(), 'plan.updated', jsonb_build_object('plan', p_id));
END $$;
REVOKE EXECUTE ON FUNCTION public.configure_plan(text,text,numeric,integer,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.configure_plan(text,text,numeric,integer,boolean) TO authenticated;