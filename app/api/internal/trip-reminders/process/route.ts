import {timingSafeEqual} from 'node:crypto';
import {processTripReminders} from '@/lib/trip-reminder-worker';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const secret=process.env.BOOKING_EMAIL_CRON_SECRET;
 if(!secret||secret.length<32)return Response.json({error:'Scheduler is not configured.'},{status:503});
 const actual=Buffer.from(request.headers.get('authorization')||''),expected=Buffer.from('Bearer '+secret);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return Response.json({error:'Unauthorized'},{status:401});
 try{const result=await processTripReminders();return Response.json(result,{status:result.status==='UNCERTAIN'?503:200,headers:{'Cache-Control':'no-store'}});}
 catch(e){console.error('Trip reminder scheduler failed',e);return Response.json({error:'Unable to process reminders. Check server logs.'},{status:500});}
}
