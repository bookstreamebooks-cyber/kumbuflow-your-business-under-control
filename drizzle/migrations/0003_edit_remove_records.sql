CREATE OR REPLACE FUNCTION public.update_product(b uuid, p uuid, n text, s text, c text, cost_value numeric, price_value numeric, min_value numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.business_active(b) THEN RAISE EXCEPTION 'Subscrição expirada ou acesso negado'; END IF;
 IF length(trim(n))<1 OR cost_value<0 OR price_value<0 OR min_value<0 THEN RAISE EXCEPTION 'Dados inválidos'; END IF;
 UPDATE public.products SET name=trim(n),sku=s,category=c,cost=cost_value,price=price_value,min_stock=min_value WHERE id=p AND business_id=b;
 IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
 INSERT INTO public.audit_logs(business_id,actor_id,event,record_id) VALUES(b,auth.uid(),'product.updated',p);
END $$;

CREATE OR REPLACE FUNCTION public.adjust_stock(b uuid, p uuid, new_stock numeric, reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE old numeric;
BEGIN
 IF NOT public.business_active(b) THEN RAISE EXCEPTION 'Subscrição expirada ou acesso negado'; END IF;
 IF new_stock<0 THEN RAISE EXCEPTION 'Stock inválido'; END IF;
 SELECT stock INTO old FROM public.products WHERE id=p AND business_id=b FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
 IF new_stock<>old THEN
  UPDATE public.products SET stock=new_stock WHERE id=p;
  INSERT INTO public.inventory_movements(business_id,product_id,quantity,kind,notes) VALUES(b,p,new_stock-old,'adjustment',coalesce(reason,''));
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.remove_product(b uuid, p uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.business_active(b) THEN RAISE EXCEPTION 'Subscrição expirada ou acesso negado'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=p AND business_id=b) THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
 IF EXISTS(SELECT 1 FROM public.sale_items WHERE product_id=p) OR EXISTS(SELECT 1 FROM public.purchases WHERE product_id=p) THEN
  UPDATE public.products SET active=false WHERE id=p;
  INSERT INTO public.audit_logs(business_id,actor_id,event,record_id) VALUES(b,auth.uid(),'product.archived',p);
  RETURN 'archived';
 END IF;
 DELETE FROM public.inventory_movements WHERE product_id=p AND business_id=b;
 DELETE FROM public.products WHERE id=p AND business_id=b;
 INSERT INTO public.audit_logs(business_id,actor_id,event,record_id) VALUES(b,auth.uid(),'product.deleted',p);
 RETURN 'deleted';
END $$;

CREATE OR REPLACE FUNCTION public.update_contact(b uuid, kind text, c uuid, n text, ph text, em text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.business_active(b) THEN RAISE EXCEPTION 'Subscrição expirada ou acesso negado'; END IF;
 IF kind='customer' THEN UPDATE public.customers SET name=trim(n),phone=ph,email=em WHERE id=c AND business_id=b;
 ELSIF kind='supplier' THEN UPDATE public.suppliers SET name=trim(n),phone=ph,email=em WHERE id=c AND business_id=b;
 ELSE RAISE EXCEPTION 'Tipo inválido'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'Contacto não encontrado'; END IF;
 INSERT INTO public.audit_logs(business_id,actor_id,event,record_id) VALUES(b,auth.uid(),kind||'.updated',c);
END $$;

CREATE OR REPLACE FUNCTION public.remove_contact(b uuid, kind text, c uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.business_active(b) THEN RAISE EXCEPTION 'Subscrição expirada ou acesso negado'; END IF;
 IF kind='customer' THEN
  IF EXISTS(SELECT 1 FROM public.sales WHERE customer_id=c) OR EXISTS(SELECT 1 FROM public.receivables WHERE customer_id=c) THEN RAISE EXCEPTION 'Este cliente tem vendas registadas e não pode ser removido. Podes editar os dados.'; END IF;
  DELETE FROM public.customers WHERE id=c AND business_id=b;
 ELSIF kind='supplier' THEN
  IF EXISTS(SELECT 1 FROM public.purchases WHERE supplier_id=c) THEN RAISE EXCEPTION 'Este fornecedor tem compras registadas e não pode ser removido. Podes editar os dados.'; END IF;
  DELETE FROM public.suppliers WHERE id=c AND business_id=b;
 ELSE RAISE EXCEPTION 'Tipo inválido'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'Contacto não encontrado'; END IF;
 INSERT INTO public.audit_logs(business_id,actor_id,event,record_id) VALUES(b,auth.uid(),kind||'.deleted',c);
END $$;

CREATE OR REPLACE FUNCTION public.update_expense(b uuid, e uuid, cat text, val numeric, d date, n text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE old public.expenses;
BEGIN
 IF NOT public.business_active(b) THEN RAISE EXCEPTION 'Subscrição expirada ou acesso negado'; END IF;
 IF val<=0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
 SELECT * INTO old FROM public.expenses WHERE id=e AND business_id=b FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Despesa não encontrada'; END IF;
 UPDATE public.expenses SET category=cat,amount=val,expense_date=d,notes=n WHERE id=e;
 INSERT INTO public.audit_logs(business_id,actor_id,event,record_id,details) VALUES(b,auth.uid(),'expense.updated',e,jsonb_build_object('old_amount',old.amount,'new_amount',val,'old_category',old.category));
END $$;

CREATE OR REPLACE FUNCTION public.remove_expense(b uuid, e uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE old public.expenses;
BEGIN
 IF NOT public.business_active(b) THEN RAISE EXCEPTION 'Subscrição expirada ou acesso negado'; END IF;
 SELECT * INTO old FROM public.expenses WHERE id=e AND business_id=b FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Despesa não encontrada'; END IF;
 DELETE FROM public.expenses WHERE id=e;
 INSERT INTO public.audit_logs(business_id,actor_id,event,record_id,details) VALUES(b,auth.uid(),'expense.deleted',e,to_jsonb(old));
END $$;

REVOKE ALL ON FUNCTION public.update_product(uuid,uuid,text,text,text,numeric,numeric,numeric), public.adjust_stock(uuid,uuid,numeric,text), public.remove_product(uuid,uuid), public.update_contact(uuid,text,uuid,text,text,text), public.remove_contact(uuid,text,uuid), public.update_expense(uuid,uuid,text,numeric,date,text), public.remove_expense(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_product(uuid,uuid,text,text,text,numeric,numeric,numeric), public.adjust_stock(uuid,uuid,numeric,text), public.remove_product(uuid,uuid), public.update_contact(uuid,text,uuid,text,text,text), public.remove_contact(uuid,text,uuid), public.update_expense(uuid,uuid,text,numeric,date,text), public.remove_expense(uuid,uuid) TO authenticated;