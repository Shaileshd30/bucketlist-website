import {requireAdmin} from '@/lib/admin-auth';
import {supabaseAdmin} from '@/lib/supabase-server';
import {indiaDay,daysAway,type TripAlert} from '@/lib/crm-upcoming';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private'};
type Row={id:string;[key:string]:unknown};
async function all(table:string,select:string,dateField?:string,start?:string,end?:string):Promise<Row[]>{const rows:Row[]=[];for(let n=0;n<10000;n+=500){let q=supabaseAdmin.from(table).select(select).order('id').range(n,n+499);if(dateField)q=q.gte(dateField,start!).lte(dateField,end!);const r=await q;if(r.error)throw r.error;const page=r.data as unknown as Row[];rows.push(...page);if(page.length<500)return rows;}throw Error('Upcoming result exceeds safe limit');}
export async function GET(){const denied=await requireAdmin();if(denied)return denied;try{
 const today=indiaDay(),end=new Date(Date.parse(today+'T00:00:00Z')+30*86400000).toISOString().slice(0,10);
 const [batches,bookings,custom,trips]=await Promise.all([
 all('trip_batches','id,trip_id,departure_date,status','departure_date',today,end),
 all('bookings','id,batch_id,travelers,total_amount,booking_status,payment_status,payments(amount,status)','departure_date',today,end),
 all('custom_bookings','id,package_name,travel_start_date,travelers,total_amount,amount_paid,booking_status,payment_status','travel_start_date',today,end),
 all('trips','id,title')]);
 let accounts:Row[]=[],contracts:Row[]=[],payments:Row[]=[];const warnings:string[]=[];let financeLoaded=true;
 try{[accounts,contracts,payments]=await Promise.all([all('crm_trip_accounts','id,account_type,reference_id'),all('crm_vendor_contracts','id,account_id,contract_amount,planning_fx_rate'),all('crm_vendor_payments','id,contract_id,amount,void_reason')]);}catch(e){financeLoaded=false;warnings.push('Vendor balances could not load. Check Vendors & DMCs; they are shown as unavailable, not zero.');console.error('CRM upcoming finance unavailable',e);}
 const eligible=(b:Row)=>['CONFIRMED','COMPLETED'].includes(String(b.booking_status))&&!['REFUNDED','PARTIALLY_REFUNDED'].includes(String(b.payment_status));
 const review=(b:Row)=>b.booking_status==='MANUAL_REVIEW'||['REFUNDED','PARTIALLY_REFUNDED'].includes(String(b.payment_status));
 function finance(kind:string,id:string){if(!financeLoaded)return {financeId:null,vendorBalance:null};const a=accounts.find(a=>a.account_type===kind&&a.reference_id===id);if(!a)return {financeId:null,vendorBalance:null};const cs=contracts.filter(c=>c.account_id===a.id);const balance=cs.reduce((s,c)=>{const paid=payments.filter(p=>p.contract_id===c.id&&!p.void_reason).reduce((s,p)=>s+Number(p.amount),0);return s+Math.round(Math.max(0,Number(c.contract_amount)-paid)*Number(c.planning_fx_rate)*100)/100;},0);return {financeId:a.id,vendorBalance:balance};}
 const result:TripAlert[]=batches.filter(b=>!['CANCELLED','COMPLETED','DRAFT'].includes(String(b.status))).map(b=>{const linked=bookings.filter(k=>k.batch_id===b.id);const valid=linked.filter(eligible);return {id:b.id,kind:'DEPARTURE',title:String(trips.find(t=>t.id===b.trip_id)?.title||b.trip_id),date:String(b.departure_date),days:daysAway(String(b.departure_date),today),travellers:valid.reduce((s,b)=>s+Number(b.travelers),0),customerBalance:valid.reduce((s,b)=>{const paid=(b.payments as {amount:number;status:string}[]||[]).filter(p=>p.status==='CAPTURED').reduce((s,p)=>s+Number(p.amount),0);return s+Math.max(0,Number(b.total_amount)-paid);},0),review:linked.some(review),...finance('DEPARTURE',b.id)};});
 result.push(...custom.filter(eligible).map(b=>({id:b.id,kind:'CUSTOM',title:String(b.package_name),date:String(b.travel_start_date),days:daysAway(String(b.travel_start_date),today),travellers:Number(b.travelers),customerBalance:Math.max(0,Number(b.total_amount)-Number(b.amount_paid)),review:review(b),...finance('CUSTOM',b.id)})));
 return Response.json({today,trips:result.sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title)),warnings},{headers});
 }catch(e){console.error('CRM upcoming load failed',e);return Response.json({error:'Unable to load upcoming trips. Check the server log for CRM upcoming load failed.'},{status:500,headers});}}
