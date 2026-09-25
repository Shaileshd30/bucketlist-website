import {randomBytes} from 'node:crypto';
import {requireAdmin} from '@/lib/admin-auth';
import {isSameOriginRequest} from '@/lib/request-origin';
import {supabaseAdmin} from '@/lib/supabase-server';
import {editableQuotation,validateQuotation} from '@/lib/quotation-data';
import {hashProposalToken,proposalHeaders as headers} from '@/lib/customer-proposal';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
const validId=(s:string)=>/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s);
export async function GET(_request:Request,context:Context){
 const denied=await requireAdmin();if(denied)return denied;
 const {id}=await context.params;if(!validId(id))return Response.json({error:'Invalid booking.'},{status:400,headers});
 const [{data,error},quotation]=await Promise.all([
  supabaseAdmin.from('customer_proposals').select('id,revision,created_at,expires_at,viewed_at,revoked_at,accepted_at,accepted_name,accepted_option_id,quotation_updated_at').eq('custom_booking_id',id).order('revision',{ascending:false}).limit(20),
  supabaseAdmin.from('custom_booking_quotations').select('updated_at').eq('custom_booking_id',id).maybeSingle()
 ]);
 return error||quotation.error?Response.json({error:'Proposal sharing is unavailable. Check the customer-proposals migration.'},{status:503,headers}):Response.json({revisions:(data||[]).map(row=>({...row,expired:new Date(row.expires_at).getTime()<=Date.now(),superseded:row.quotation_updated_at!==quotation.data?.updated_at}))},{headers});
}
export async function POST(request:Request,context:Context){
 const denied=await requireAdmin();if(denied)return denied;
 if(!isSameOriginRequest(request))return Response.json({error:'Invalid request origin.'},{status:403,headers});
 const {id}=await context.params;if(!validId(id))return Response.json({error:'Invalid booking.'},{status:400,headers});
 try{
  const q=await supabaseAdmin.from('custom_booking_quotations').select('content,updated_at').eq('custom_booking_id',id).maybeSingle();
  if(q.error||!q.data)return Response.json({error:'Save a complete quotation first.'},{status:400,headers});
  validateQuotation(editableQuotation(q.data.content));
  const token=randomBytes(32).toString('hex');
  const {data,error}=await supabaseAdmin.rpc('issue_customer_proposal',{p_booking_id:id,p_hash:hashProposalToken(token),p_updated_at:q.data.updated_at});
  if(error)return Response.json({error:'Could not publish this proposal. Check validity, booking status and the database migration, then reload.'},{status:409,headers});
  return Response.json({...data,path:'/proposal/'+token},{headers});
 }catch{return Response.json({error:'Complete the quotation fields and save before creating a link.'},{status:400,headers});}
}
export async function DELETE(request:Request,context:Context){
 const denied=await requireAdmin();if(denied)return denied;
 if(!isSameOriginRequest(request))return Response.json({error:'Invalid request origin.'},{status:403,headers});
 const {id}=await context.params;if(!validId(id))return Response.json({error:'Invalid booking.'},{status:400,headers});
 const {error}=await supabaseAdmin.from('customer_proposals').update({revoked_at:new Date().toISOString()}).eq('custom_booking_id',id).is('revoked_at',null);
 return error?Response.json({error:'Unable to revoke links.'},{status:503,headers}):Response.json({ok:true},{headers});
}
