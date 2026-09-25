import {supabaseAdmin} from '@/lib/supabase-server';
import {consumeApiRateLimit} from '@/lib/api-rate-limit';
import {isSameOriginRequest} from '@/lib/request-origin';
import {hashProposalToken,proposalHeaders as headers,publicProposalContent,proposalPayment} from '@/lib/customer-proposal';
import type {QuoteInstallment} from '@/lib/quotation-data';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{token:string}>};
async function respond(request:Request,context:Context,accept:boolean){
 try{
  const {token}=await context.params,hash=hashProposalToken(token);
  if(!hash)return Response.json({error:'This proposal link is unavailable.'},{status:404,headers});
  if(accept&&(!request.headers.get('origin')||!isSameOriginRequest(request)))return Response.json({error:'Open the proposal in your browser and try again.'},{status:403,headers});
  const limit=await consumeApiRateLimit(request,accept?'proposal-accept':'proposal-read',accept?12:60,60);
  if(!limit.allowed)return Response.json({error:'Please wait a moment and try again.'},{status:429,headers:{...headers,'Retry-After':String(limit.retryAfterSeconds)}});
  let name='',option='';
  if(accept){
   const raw=await request.text();if(raw.length>2000)return Response.json({error:'Request too large.'},{status:413,headers});
   const body=JSON.parse(raw);
   if(body.agreed!==true||typeof body.name!=='string'||typeof body.option!=='string'||body.name.trim().length<2||body.name.length>120||body.option.length>80)return Response.json({error:'Enter your name, choose a package and agree to the proposal terms.'},{status:400,headers});
   name=body.name.trim();option=body.option;
  }
  const {data,error}=await supabaseAdmin.rpc('access_customer_proposal',{p_hash:hash,p_action:accept?'accept':'read',p_name:name,p_option:option});
  if(error)throw new Error('Proposal unavailable');
  if(!data||data.error)return Response.json({error:data?.error||'This proposal link is unavailable.'},{status:accept?409:410,headers});
  let payment=null;
  if(data.acceptedAt){
   const rows=await supabaseAdmin.from('custom_booking_installments').select('id,label,amount,paid_amount,due_date,status,razorpay_payment_link_url,payment_link_expires_at').eq('custom_booking_id',data.bookingId).order('installment_number');
   if(!rows.error){
    const installments:QuoteInstallment[]=(rows.data||[]).map(i=>({id:i.id,label:i.label,amount:Number(i.amount),paid:Number(i.paid_amount),due:i.due_date||'',status:i.status,url:i.razorpay_payment_link_url||'',expires:i.payment_link_expires_at||''}));
    const eligible=proposalPayment(data.content,data.acceptedAt,data.acceptedOptionId,Number(data.booking.total),installments,data.bookingStatus);
    if(eligible)payment={url:eligible.url,amount:eligible.amount-eligible.paid,label:eligible.label};
   }
  }
  return Response.json({booking:data.booking,content:publicProposalContent(data.content),revision:data.revision,expiresAt:data.expiresAt,acceptedAt:data.acceptedAt,acceptedOptionId:data.acceptedOptionId,acceptedName:data.acceptedName,payment},{headers});
 }catch{return Response.json({error:'Unable to load this proposal right now. Please try again or contact your travel team.'},{status:503,headers});}
}
export const GET=(request:Request,context:Context)=>respond(request,context,false);
export const POST=(request:Request,context:Context)=>respond(request,context,true);
