import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { actionSchema } from './kumbuflow'
import { z } from 'zod'
export const getWorkspace=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const db=context.supabase
 const [business,profile,role,plans,bank,subscriptions,products,customers,suppliers,sales,items,expenses,debts,payments,purchases,requests,audit,movements]=await Promise.all([
 db.from('businesses').select('*').eq('owner_id',context.userId).maybeSingle(),db.from('profiles').select('*').eq('id',context.userId).single(),db.from('user_roles').select('role').eq('user_id',context.userId),db.from('plans').select('*').order('price'),db.from('payment_settings').select('*').maybeSingle(),db.from('subscriptions').select('*').order('expires_at',{ascending:false}),db.from('products').select('*').order('name'),db.from('customers').select('*').order('name'),db.from('suppliers').select('*').order('name'),db.from('sales').select('*').order('created_at',{ascending:false}),db.from('sale_items').select('*'),db.from('expenses').select('*').order('expense_date',{ascending:false}),db.from('receivables').select('*'),db.from('payments').select('*'),db.from('purchases').select('*'),db.from('payment_requests').select('*').order('created_at',{ascending:false}),db.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(100),db.from('inventory_movements').select('*').order('created_at',{ascending:false})])
 for(const result of [business,profile,role,plans,bank,subscriptions,products,customers,suppliers,sales,items,expenses,debts,payments,purchases,requests,audit,movements]) if(result.error) throw new Error('Não foi possível carregar os dados. Tenta novamente.')
 return {business:business.data,profile:profile.data,isAdmin:role.data?.some(r=>r.role==='admin')??false,plans:plans.data??[],bank:bank.data,subscriptions:subscriptions.data??[],products:products.data??[],customers:customers.data??[],suppliers:suppliers.data??[],sales:sales.data??[],items:items.data??[],expenses:expenses.data??[],debts:debts.data??[],payments:payments.data??[],purchases:purchases.data??[],requests:requests.data??[],audit:audit.data??[],movements:movements.data??[],serverTime:new Date().toISOString(),userId:context.userId}
})
export type WorkspaceData=Awaited<ReturnType<typeof getWorkspace>>
export const performAction=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((data)=>actionSchema.parse(data)).handler(async({data:d,context})=>{
 const db=context.supabase;let result
 switch(d.kind){
 case 'onboard':result=await db.rpc('onboard_business',{p_name:d.name,p_sector:d.sector,p_phone:d.phone});break
 case 'product':result=await db.rpc('add_product',{b:d.b,n:d.name,s:d.sku,c:d.category,cost_value:d.cost,price_value:d.price,stock_value:d.stock,min_value:d.min_stock});break
 case 'contact':result=await db.rpc('add_contact',{b:d.b,kind:d.type,n:d.name,ph:d.phone,em:d.email});break
 case 'expense':result=await db.rpc('record_expense',{b:d.b,cat:d.category,val:d.amount,d:d.date,n:d.notes,r:d.receipt??''});break
 case 'sale':result=await db.rpc('record_sale',{b:d.b,customer:d.customer??undefined,items:d.items,discount_value:d.discount,paid_value:d.paid,method:d.method,due:d.due,req:d.request});break
 case 'debt':result=await db.rpc('receive_debt',{b:d.b,r:d.id,val:d.amount,m:d.method,req:d.request});break
 case 'purchase':result=await db.rpc('record_purchase',{b:d.b,s:d.supplier,p:d.product,q:d.quantity,c:d.cost,paid_value:d.paid,req:d.request});break
 case 'reverse':result=await db.rpc('reverse_sale',{b:d.b,s:d.id,reason:d.reason});break
 case 'subscription':result=await db.rpc('request_subscription',{b:d.b,p:d.plan,ref:d.reference,r:d.receipt??''});break
 case 'review':result=await db.rpc('review_payment',{r:d.id,approve:d.approve,note:d.note,independently_verified:d.verified});break
 case 'bank':result=await db.rpc('configure_bank',{bank:d.bank,holder:d.holder,account:d.iban});break
 case 'profile':result=await db.from('profiles').update({display_name:d.name}).eq('id',context.userId);break
 case 'plan':result=await db.rpc('configure_plan',{p_id:d.id,p_name:d.name,p_price:d.price,p_days:d.days,p_enabled:d.enabled});break
 }
 if(result.error){ const text=result.error.code==='23505'?'Este registo já existe. Não foi duplicado.':result.error.message;throw new Error(text) }
 return {ok:true}
})
export const receiptUrl=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((d)=>z.object({path:z.string().min(1).max(500)}).parse(d)).handler(async({data,context})=>{
 const {data:result,error}=await context.supabase.storage.from('receipts').createSignedUrl(data.path,60)
 if(error||!result) throw new Error('Sem acesso ao comprovativo.')
 return result.signedUrl
})
