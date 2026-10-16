import { z } from 'zod'
export const money = (value: number) => `${new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} Kz`
export const dateLabel = (value: string) => new Intl.DateTimeFormat('pt-AO', {timeZone:'Africa/Luanda',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value))
export const todayLuanda = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Luanda',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
export const meta = (title: string, description: string) => ({meta:[{title:`${title} · KumbuFlow`},{name:'description',content:description},{property:'og:title',content:`${title} · KumbuFlow`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]})
const id=z.string().uuid(), name=z.string().trim().min(1).max(100), amount=z.number().finite().min(0).max(999999999), path=z.string().max(500).nullable()
export const actionSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('onboard'),name:z.string().trim().min(2).max(100),sector:name,phone:z.string().max(30)}),
 z.object({kind:z.literal('product'),b:id,name:name,sku:z.string().max(60),category:name,cost:amount,price:amount,stock:amount,min_stock:amount}),
 z.object({kind:z.literal('contact'),b:id,type:z.enum(['customer','supplier']),name:name,phone:z.string().max(30),email:z.union([z.string().email().max(255),z.literal('')])}),
 z.object({kind:z.literal('expense'),b:id,category:name,amount:amount.positive(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),notes:z.string().max(1000),receipt:path}),
 z.object({kind:z.literal('sale'),b:id,customer:id.nullable(),items:z.array(z.object({product_id:id,quantity:z.number().positive().max(999999)})).min(1).max(100),discount:amount,paid:amount,method:z.enum(['Dinheiro','Transferência','TPA','Crédito']),due:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),request:id}),
 z.object({kind:z.literal('debt'),b:id,id:id,amount:amount.positive(),method:name,request:id}),
 z.object({kind:z.literal('purchase'),b:id,supplier:id,product:id,quantity:z.number().positive().max(999999),cost:amount,paid:amount,request:id}),
 z.object({kind:z.literal('reverse'),b:id,id:id,reason:z.string().trim().min(5).max(500)}),
 z.object({kind:z.literal('subscription'),b:id,plan:name,reference:z.string().trim().min(3).max(100),receipt:path}),
 z.object({kind:z.literal('review'),id:id,approve:z.boolean(),note:z.string().trim().min(5).max(500),verified:z.boolean()}),
 z.object({kind:z.literal('bank'),bank:z.string().max(100),holder:z.string().max(150),iban:z.string().max(100)}),
 z.object({kind:z.literal('profile'),name:name}),
 z.object({kind:z.literal('productEdit'),b:id,id:id,name:name,sku:z.string().max(60),category:name,cost:amount,price:amount,min_stock:amount,stock:amount}),
 z.object({kind:z.literal('productRemove'),b:id,id:id}),
 z.object({kind:z.literal('contactEdit'),b:id,id:id,type:z.enum(['customer','supplier']),name:name,phone:z.string().max(30),email:z.union([z.string().email().max(255),z.literal('')])}),
 z.object({kind:z.literal('contactRemove'),b:id,id:id,type:z.enum(['customer','supplier'])}),
 z.object({kind:z.literal('expenseEdit'),b:id,id:id,category:name,amount:amount.positive(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),notes:z.string().max(1000)}),
 z.object({kind:z.literal('expenseRemove'),b:id,id:id}),
 z.object({kind:z.literal('readNotifications'),b:id}),
 z.object({kind:z.literal('plan'),id:name,name:name,price:amount.positive(),days:z.number().int().min(1).max(365),enabled:z.boolean()}),
])
export type Action = z.infer<typeof actionSchema>
export const calculateSummary=(sales:{total:number;paid:number;status:string}[],expenses:{amount:number}[],items:{quantity:number;unit_cost:number}[],receivables:{amount:number;paid:number;cancelled:boolean}[],payments:{amount:number}[],purchases:{paid:number}[])=>{
 const confirmed=sales.filter(s=>s.status==='confirmed');const revenue=confirmed.reduce((a,s)=>a+Number(s.total),0);const income=confirmed.reduce((a,s)=>a+Number(s.paid),0)+payments.reduce((a,p)=>a+Number(p.amount),0);const expense=expenses.reduce((a,e)=>a+Number(e.amount),0);const cost=items.reduce((a,i)=>a+Number(i.quantity)*Number(i.unit_cost),0);return {revenue,income,expense,profit:revenue-cost-expense,cash:income-expense-purchases.reduce((a,p)=>a+Number(p.paid),0),debt:receivables.filter(r=>!r.cancelled).reduce((a,r)=>a+Number(r.amount)-Number(r.paid),0)}
}
