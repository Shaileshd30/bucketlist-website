import {requireAdmin} from '@/lib/admin-auth';
import {isSameOriginRequest} from '@/lib/request-origin';
import {supabaseAdmin} from '@/lib/supabase-server';
import {reminderPlan} from '@/lib/trip-reminder-plan';
import {sendReminderTest} from '@/lib/trip-reminder-worker';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private'};
export async function GET(){
 const denied=await requireAdmin();if(denied)return denied;
 try{
  const plan=await reminderPlan();
  const history=await supabaseAdmin.from('trip_reminder_deliveries').select('id,recipient,subject,status,created_at,finished_at').order('created_at',{ascending:false}).limit(100);
  if(history.error)throw history.error;
  return Response.json({...plan,history:history.data,enabled:process.env.TRIP_REMINDERS_ENABLED==='true'},{headers});
 }catch(e){console.error('Reminder workspace failed',e);return Response.json({error:'Unable to load reminders. Run the reminder migration and check server logs.'},{status:500,headers});}
}
export async function POST(request:Request){
 const denied=await requireAdmin();if(denied)return denied;
 if(!request.headers.get('origin')||!isSameOriginRequest(request))return Response.json({error:'Invalid request origin.'},{status:403,headers});
 try{
  const body=await request.json();
  if(body.action==='test')return Response.json(await sendReminderTest(),{headers});
  if(body.action!=='save')return Response.json({error:'Invalid action.'},{status:400,headers});
  const plan=await reminderPlan();
  if(!plan.sources.some(s=>s.id===body.id))return Response.json({error:'Trip not found.'},{status:404,headers});
  for(const key of ['details','checklist','tips'])if(typeof body[key]!=='string'||body[key].length>6000)return Response.json({error:'Each text field must be at most 6,000 characters.'},{status:400,headers});
  for(const key of ['customer_enabled','vendor_enabled','review_enabled'])if(typeof body[key]!=='boolean')return Response.json({error:'Invalid reminder setting.'},{status:400,headers});
  if(body.customer_enabled&&(!body.details.trim()||!body.checklist.trim()))return Response.json({error:'Add meeting/coordinator details and things to carry before enabling customer reminders.'},{status:400,headers});
  const r=await supabaseAdmin.from('trip_reminder_settings').upsert({id:body.id,details:body.details.trim(),checklist:body.checklist.trim(),tips:body.tips.trim(),customer_enabled:body.customer_enabled,vendor_enabled:body.vendor_enabled,review_enabled:body.review_enabled,updated_at:new Date().toISOString()});
  if(r.error)throw r.error;
  return Response.json({message:'Reminder settings saved.'},{headers});
 }catch(e){console.error('Reminder action failed',e);return Response.json({error:'Action failed. Check the server log for email settings or database errors.'},{status:500,headers});}
}
