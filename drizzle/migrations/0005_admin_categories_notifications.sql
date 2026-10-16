CREATE TABLE public.expense_categories(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL UNIQUE CHECK(length(trim(name)) BETWEEN 2 AND 60),enabled boolean NOT NULL DEFAULT true,sort integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.expense_categories TO authenticated; GRANT ALL ON public.expense_categories TO service_role;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY category_read ON public.expense_categories FOR SELECT TO authenticated USING(true);
INSERT INTO public.expense_categories(name,sort) VALUES('Renda',1),('Salários',2),('Transporte',3),('Energia e água',4),('Comunicações',5),('Impostos',6),('Manutenção',7),('Outros',99);
CREATE OR REPLACE FUNCTION public.configure_category(c uuid,n text,on_off boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
IF c IS NULL THEN INSERT INTO public.expense_categories(name,enabled,sort) VALUES(trim(n),on_off,(SELECT coalesce(max(sort),0)+1 FROM public.expense_categories WHERE sort<99));
ELSE UPDATE public.expense_categories SET name=trim(n),enabled=on_off WHERE id=c; END IF;
INSERT INTO public.audit_logs(actor_id,event,record_id,details) VALUES(auth.uid(),'category.updated',c,jsonb_build_object('name',n,'enabled',on_off)); END $$;
CREATE OR REPLACE FUNCTION public.admin_notify(b uuid,msg text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cnt integer;
BEGIN IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
IF length(trim(msg)) NOT BETWEEN 5 AND 500 THEN RAISE EXCEPTION 'A mensagem deve ter entre 5 e 500 caracteres'; END IF;
INSERT INTO public.notifications(business_id,message) SELECT id,trim(msg) FROM public.businesses WHERE b IS NULL OR id=b;
GET DIAGNOSTICS cnt=ROW_COUNT;
INSERT INTO public.audit_logs(business_id,actor_id,event,details) VALUES(b,auth.uid(),'notification.sent',jsonb_build_object('count',cnt)); RETURN cnt; END $$;
REVOKE EXECUTE ON FUNCTION public.configure_category(uuid,text,boolean) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.configure_category(uuid,text,boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_notify(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.admin_notify(uuid,text) TO authenticated;