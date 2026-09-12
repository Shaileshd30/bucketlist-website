import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {supabaseAdmin} from '@/lib/supabase-server';
import {createBookingEmailTransport} from '@/lib/booking-email-transport';
import {reminderPlan} from './trip-reminder-plan';
import {emailValid, renderReminder, reviewMessage} from './trip-reminder-content';
async function mailResources(){
 const smtp=createBookingEmailTransport();
 const logo=await readFile(path.join(process.cwd(),'public','bucketlist-logo.png'));
 return {smtp,attachments:[{filename:'bucketlist-logo.png',content:logo,cid:'booking-logo@bucketlistadventure.in',contentType:'image/png'}]};
}
export async function sendReminderTest(){
 const {smtp,attachments}=await mailResources();
 try{
  const subject='TEST — Thank you for travelling with Bucketlist Adventure';
  const message='This is a test of your post-trip email template.\n\n'+reviewMessage('Shailesh','Your Sample Adventure');
  const result=await smtp.transport.sendMail({from:smtp.from,replyTo:smtp.replyTo,to:'info@bucketlistadventure.in',subject,text:message,html:renderReminder(subject,message),attachments});
  if(!result.accepted?.length)throw Error('Test was not accepted by the mail server.');
  return {message:'Test accepted by the mail server for info@bucketlistadventure.in. Check the inbox and spam folder.'};
 }finally{smtp.transport.close();}
}
export async function processTripReminders(){
 if(process.env.TRIP_REMINDERS_ENABLED!=='true')return {status:'DISABLED'};
 if(process.env.NODE_ENV!=='production'||process.env.BOOKING_EMAIL_TEST_RECIPIENT)throw Error('Automatic reminders require production mode without an email test override.');
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
 if(hour<9||hour>=20)return {status:'OUTSIDE_SENDING_HOURS'};
 const {smtp,attachments}=await mailResources();
 let sent=0;
 try{
  const plan=await reminderPlan();
  // A unique insert claims each message across all concurrent scheduler runs.
  // Only today's reminders are sent; missed historic reminders are not replayed.
  for(const job of plan.jobs.filter(j=>j.date===plan.today&&emailValid(j.recipient))){
   if(sent>=1)break;
   const claim=await supabaseAdmin.from('trip_reminder_deliveries').insert({id:job.id,recipient:job.recipient,subject:job.subject,status:'PROCESSING'});
   if(claim.error?.code==='23505')continue;
   if(claim.error)throw claim.error;
   try{
    const result=await smtp.transport.sendMail({from:smtp.from,replyTo:smtp.replyTo,to:job.recipient,subject:job.subject,text:job.message,html:renderReminder(job.subject,job.message),attachments});
    if(!result.accepted?.length)throw Error('SMTP did not accept the message.');
    const saved=await supabaseAdmin.from('trip_reminder_deliveries').update({status:'SENT',finished_at:new Date().toISOString()}).eq('id',job.id);
    if(saved.error)throw saved.error;
    sent++;
   }catch(error){
    console.error('Trip reminder delivery requires review',error instanceof Error?error.message:'Database error');
    await supabaseAdmin.from('trip_reminder_deliveries').update({status:'UNCERTAIN',finished_at:new Date().toISOString()}).eq('id',job.id);
    return {status:'UNCERTAIN',sent};
   }
  }
  return {status:sent?'SENT':'EMPTY',sent,warnings:plan.warnings};
 }finally{smtp.transport.close();}
}
