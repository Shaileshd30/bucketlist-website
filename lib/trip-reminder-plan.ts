import {supabaseAdmin} from '@/lib/supabase-server';
import {dateOffset, indiaDate, reviewMessage, whatsappUrl} from './trip-reminder-content';
export type ReminderSettings={id:string;customer_enabled:boolean;vendor_enabled:boolean;review_enabled:boolean;details:string;checklist:string;tips:string};
export type ReminderJob={id:string;trip:string;recipient:string;subject:string;message:string;date:string;kind:string;whatsapp:string|null};
export type ReminderTrip={id:string;title:string;start:string;end:string;setting:ReminderSettings};
export type ManualReminder={id:string;sourceId:string;customer:string;reference:string;phone:string;message:string;whatsapp:string|null;reason:string};
type Row=Record<string,unknown>;
const str=(x:unknown)=>x==null?'':String(x);
export async function reminderRows(table:string, select:string):Promise<Row[]> {
 const result:Row[]=[];
 for(let offset=0;offset<20000;offset+=500){
  const r=await supabaseAdmin.from(table).select(select).order('id').range(offset,offset+499);
  if(r.error)throw r.error;
  const page=r.data as unknown as Row[];result.push(...page);if(page.length<500)return result;
 }
 throw Error('Reminder data exceeds the supported size.');
}
export async function reminderPlan(now=new Date()) {
 const today=indiaDate(now),warnings:string[]=[],jobs:ReminderJob[]=[],sources:ReminderTrip[]=[];
 const manualPreviews:ManualReminder[]=[],manualReasons:Record<string,string>={};
 const [settings,batches,trips,bookings,custom]=await Promise.all([
  reminderRows('trip_reminder_settings','id,customer_enabled,vendor_enabled,review_enabled,details,checklist,tips'),
  reminderRows('trip_batches','id,trip_id,departure_date,return_date,status'),
  reminderRows('trips','id,title,things_to_carry'),
  reminderRows('bookings','id,booking_id,batch_id,customer_name,email,phone,booking_status,payment_status'),
  reminderRows('custom_bookings','id,booking_reference,package_name,travel_start_date,travel_end_date,customer_name,email,phone,booking_status,payment_status')
 ]);
 let accounts:Row[]=[],contracts:Row[]=[],vendors:Row[]=[],payments:Row[]=[];
 try{[accounts,contracts,vendors,payments]=await Promise.all([
  reminderRows('crm_trip_accounts','id,account_type,reference_id'),
  reminderRows('crm_vendor_contracts','id,account_id,vendor_id,contract_amount,currency'),
  reminderRows('crm_vendors','id,name,contact_person,email,phone,active'),
  reminderRows('crm_vendor_payments','id,contract_id,amount,void_reason')
 ]);}catch(e){console.error('Reminder vendor data unavailable',e);warnings.push('Vendor data unavailable. Customer reminders can still run; check the finance migration.');}
 function add(source:ReminderTrip,recipient:string,phone:string,kind:string,date:string,identity:string,subject:string,message:string){
  if(date<today||date>dateOffset(today,30))return;
  jobs.push({id:JSON.stringify([source.id,identity,kind,date,recipient.toLowerCase()]),trip:source.title,recipient,subject,message,date,kind,whatsapp:whatsappUrl(phone,message)});
 }
 function build(kind:string,row:Row,title:string,start:string,end:string,customers:Row[],checklist:string){
  if(!start||!end||['CANCELLED','DRAFT','MANUAL_REVIEW'].includes(str(row.status||row.booking_status)))return;
  if(end<dateOffset(today,-2))return;
  const id=kind+':'+str(row.id),saved=settings.find(s=>s.id===id);
  const setting:ReminderSettings={id,customer_enabled:false,vendor_enabled:false,review_enabled:false,details:'',checklist,tips:'',...saved};
  const source={id,title,start,end,setting};sources.push(source);
  const valid=customers.filter(c=>['CONFIRMED','COMPLETED'].includes(str(c.booking_status))&&!['REFUNDED','PARTIALLY_REFUNDED','FAILED'].includes(str(c.payment_status)));
  const manualCustomers=valid.filter(c=>c.booking_status==='CONFIRMED');
  if(start<today||row.status==='COMPLETED')manualReasons[id]='Preparation messages are available before departure. This trip has already started or is completed.';
  else if(!manualCustomers.length)manualReasons[id]='No eligible confirmed bookings. Awaiting-advance, cancelled, completed, failed-payment and refunded bookings do not receive preparation messages.';
  else for(const c of manualCustomers){
   const name=str(c.customer_name),phone=str(c.phone);
   const message=`Dear ${name},\n\nWe look forward to welcoming you on ${title}, beginning ${start}. Here are the details to help you prepare.\n\nMeeting and coordinator details\n${setting.details}\n\nThings to carry\n${setting.checklist}\n\n${setting.tips?'Travel tips\n'+setting.tips+'\n\n':''}If you have any questions, please reply and we will be happy to help.\n\nWarm regards,\nTeam Bucketlist Adventure\nWe Plan It. You Live It.`;
   const link=whatsappUrl(phone,message);
   const placeholder=(value:string)=>!value.trim()||/^(n\/?a|none|nil|tbd|-)$/i.test(value.trim());
   const reasons:string[]=[];
   if(placeholder(setting.details))reasons.push('Add and save meeting details and coordinator contact.');
   if(placeholder(setting.checklist))reasons.push('Add and save a real things-to-carry checklist; NA is not a checklist.');
   if(!link)reasons.push('Add a valid customer phone number in the booking.');
   manualPreviews.push({id:JSON.stringify([id,c.id,'MANUAL_PREPARATION']),sourceId:id,customer:name,reference:str(c.booking_reference||c.booking_id||c.id),phone,message,whatsapp:reasons.length?null:link,reason:reasons.join(' ')});
  }
  if(setting.customer_enabled&&(!setting.details.trim()||!setting.checklist.trim()))warnings.push(`${title}: meeting details and things to carry are required before customer reminders can send.`);
  for(const c of valid){
   const name=str(c.customer_name),email=str(c.email).trim(),phone=str(c.phone);
   if(setting.customer_enabled&&setting.details.trim()&&setting.checklist.trim()&&c.booking_status==='CONFIRMED'&&row.status!=='COMPLETED')for(const days of [7,3,1]){
    add(source,email,phone,'CUSTOMER_'+days,dateOffset(start,-days),str(c.id),`${title} — your adventure is ${days} day${days===1?'':'s'} away`,
     `Dear ${name},\n\nWe are looking forward to welcoming you on ${title}! Your adventure begins on ${start}.\n\nMeeting and coordinator details\n${setting.details}\n\nThings to carry\n${setting.checklist}\n\n${setting.tips?'Travel tips\n'+setting.tips+'\n\n':''}Please review these details and reply if you have any questions. We are happy to help you prepare.\n\nWarm regards,\nTeam Bucketlist Adventure\nWe Plan It. You Live It.`);
   }
   if(setting.review_enabled&&c.booking_status==='COMPLETED')add(source,email,phone,'REVIEW',dateOffset(end,1),str(c.id),`Thank you for travelling with us — ${title}`,reviewMessage(name,title));
  }
  if(setting.vendor_enabled&&row.status!=='COMPLETED'){
   const account=accounts.find(a=>a.account_type===kind&&a.reference_id===row.id);
   for(const contract of contracts.filter(c=>account&&c.account_id===account.id)){
    const vendor=vendors.find(v=>v.id===contract.vendor_id);if(!vendor||vendor.active===false)continue;
    const paid=payments.filter(p=>p.contract_id===contract.id&&!p.void_reason).reduce((sum,p)=>sum+Number(p.amount),0);
    const balance=Math.max(0,Number(contract.contract_amount)-paid).toFixed(2);
    for(const days of [7,3,1])add(source,str(vendor.email).trim(),str(vendor.phone),'VENDOR_'+days,dateOffset(start,-days),str(contract.id),`Upcoming arrangements — ${title} (${start})`,
     `Dear ${str(vendor.contact_person)||str(vendor.name)},\n\nA gentle reminder that ${title} is scheduled from ${start} to ${end}. Please confirm that the agreed arrangements are ready and share your local coordinator's contact details.\n\nOur records show an outstanding vendor balance of ${str(contract.currency)} ${balance}. Please let us know if any reconciliation is required.\n\n${setting.details?'Coordination details\n'+setting.details+'\n\n':''}Thank you for helping us create a wonderful experience for our travellers.\n\nWarm regards,\nTeam Bucketlist Adventure`);
   }
  }
 }
 for(const batch of batches){const trip=trips.find(t=>t.id===batch.trip_id);build('DEPARTURE',batch,str(trip?.title||batch.trip_id),str(batch.departure_date),str(batch.return_date||batch.departure_date),bookings.filter(b=>b.batch_id===batch.id),Array.isArray(trip?.things_to_carry)?trip.things_to_carry.map(str).join('\n'):'');}
 for(const b of custom)build('CUSTOM',b,str(b.package_name),str(b.travel_start_date),str(b.travel_end_date||b.travel_start_date),[b],'');
 const upcoming=sources.filter(s=>s.start>=today&&s.start<=dateOffset(today,7));
 if(upcoming.length){const recipient=process.env.TRIP_REMINDER_ADMIN_EMAIL||'info@bucketlistadventure.in';jobs.push({id:JSON.stringify(['ADMIN',today,recipient]),trip:'Upcoming trips',recipient,subject:'Your upcoming Bucketlist trips',date:today,kind:'ADMIN',whatsapp:null,message:`Good morning,\n\nTrips starting within the next seven days:\n\n${upcoming.map(s=>`${s.start} — ${s.title}`).join('\n')}\n\nPlease check traveller details, pending balances, vendor arrangements and trip checklists in the CRM.\n\nhttps://bucketlistadventure.in/admin/crm\n\nTeam Bucketlist Adventure`});}
 return {today,sources:sources.sort((a,b)=>a.start.localeCompare(b.start)),jobs:jobs.sort((a,b)=>a.date.localeCompare(b.date)),warnings,manualPreviews,manualReasons};
}
