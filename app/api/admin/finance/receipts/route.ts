import {requireAdmin} from '@/lib/admin-auth';
import {isSameOriginRequest} from '@/lib/request-origin';
import {supabaseAdmin} from '@/lib/supabase-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private'},bucket='crm-finance-receipts';
function table(k:unknown){if(k==='payment')return 'crm_vendor_payments';if(k==='expense')return 'crm_trip_expenses';throw Error('Invalid type');}
function uuid(v:unknown){if(typeof v!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v))throw Error('Invalid record');return v;}
export async function POST(request:Request){const denied=await requireAdmin();if(denied)return denied;if(!isSameOriginRequest(request))return Response.json({error:'Invalid request origin.'},{status:403,headers});try{
 const f=await request.formData(),kind=f.get('kind'),id=uuid(f.get('id')),name=table(kind),file=f.get('file');if(!(file instanceof File)||!file.size||file.size>5242880)throw Error('Choose PDF, JPG or PNG up to 5 MB.');
 const bytes=Buffer.from(await file.arrayBuffer()),ext=bytes.subarray(0,5).toString()==='%PDF-'?'pdf':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpg':null;if(!ext)throw Error('Choose PDF, JPG or PNG.');
 const row=await supabaseAdmin.from(name).select('id').eq('id',id).single();if(row.error)throw row.error;
 const path=`${kind}/${id}/${crypto.randomUUID()}.${ext}`,uploaded=await supabaseAdmin.storage.from(bucket).upload(path,bytes,{contentType:ext==='pdf'?'application/pdf':ext==='png'?'image/png':'image/jpeg'});if(uploaded.error)throw uploaded.error;
 const update=await supabaseAdmin.from(name).update({receipt_url:path}).eq('id',id).select('id').single();if(update.error){await supabaseAdmin.storage.from(bucket).remove([path]);throw update.error;}return Response.json({ok:true},{headers});
 }catch(e){console.error('Finance receipt upload failed',e);return Response.json({error:'Unable to attach receipt. Use PDF, JPG or PNG up to 5 MB and check the migration.'},{status:400,headers});}}
export async function GET(request:Request){const denied=await requireAdmin();if(denied)return denied;try{const q=new URL(request.url).searchParams,kind=q.get('kind'),id=uuid(q.get('id'));const row=await supabaseAdmin.from(table(kind)).select('receipt_url').eq('id',id).single(),path=row.data?.receipt_url;if(row.error||typeof path!=='string'||!path.startsWith(`${kind}/${id}/`))return Response.json({error:'Receipt not found.'},{status:404,headers});const file=await supabaseAdmin.storage.from(bucket).download(path);if(file.error)throw file.error;return new Response(await file.data.arrayBuffer(),{headers:{...headers,'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="receipt-${id}.${path.split('.').pop()}"`,'X-Content-Type-Options':'nosniff'}});}catch(e){console.error('Finance receipt download failed',e);return Response.json({error:'Unable to download receipt.'},{status:500,headers});}}
