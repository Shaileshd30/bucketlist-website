import {validateHotelImage} from '@/lib/hotel-image-validation';
import {optionMatchesBooking} from '@/lib/hotel-data';
import path from 'node:path';
import {requireAdmin} from '@/lib/admin-auth';
import {isSameOriginRequest} from '@/lib/request-origin';
import {supabaseAdmin} from '@/lib/supabase-server';
import {availablePayment,editableQuotation,validateQuotation,type QuoteBooking,type QuoteInstallment} from '@/lib/quotation-data';
import {createQuotationPdf} from '@/lib/quotation-pdf';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store, private'};
type Context={params:Promise<{id:string}>};
const validId=(s:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
export async function GET(request:Request,context:Context){const denied=await requireAdmin();if(denied)return denied;const {id}=await context.params;if(!validId(id))return Response.json({error:'Invalid booking.'},{status:400,headers});try{
 const [br,qr,ir]=await Promise.all([supabaseAdmin.from('custom_bookings').select('id,booking_reference,package_name,customer_name,phone,travelers,travel_start_date,travel_end_date,total_amount,amount_paid,balance_amount,booking_status').eq('id',id).maybeSingle(),supabaseAdmin.from('custom_booking_quotations').select('content,updated_at').eq('custom_booking_id',id).maybeSingle(),supabaseAdmin.from('custom_booking_installments').select('id,label,amount,paid_amount,due_date,status,razorpay_payment_link_url,payment_link_expires_at').eq('custom_booking_id',id).order('installment_number')]);
 if(br.error)throw br.error;if(qr.error)throw qr.error;if(ir.error)throw ir.error;if(!br.data)return Response.json({error:'Booking not found.'},{status:404,headers});const b=br.data;
 const booking:QuoteBooking={reference:b.booking_reference,title:b.package_name,customer:b.customer_name,phone:b.phone||'',travellers:Number(b.travelers),start:b.travel_start_date||'',end:b.travel_end_date||'',total:Number(b.total_amount),paid:Number(b.amount_paid),balance:Number(b.balance_amount)};
 const installments:QuoteInstallment[]=(ir.data||[]).map(i=>({id:i.id,label:i.label,amount:Number(i.amount),paid:Number(i.paid_amount),due:i.due_date||'',status:i.status,url:i.razorpay_payment_link_url||'',expires:i.payment_link_expires_at||''}));
 const content=editableQuotation(qr.data?.content);let warning='';try{validateQuotation(content);}catch(e){warning=e instanceof Error?e.message:'Review quotation fields.';}const payment=!warning&&optionMatchesBooking(content.options,content.selectedOptionId,booking.total)?availablePayment(installments,b.booking_status,content.validUntil):null;
 if(new URL(request.url).searchParams.get('format')==='pdf'){
 if(!qr.data)return Response.json({error:'Save the quotation first.'},{status:400,headers});
 if(warning)return Response.json({error:warning+' Open Edit quotation, correct it and save.'},{status:400,headers});
 const pdf=await createQuotationPdf(booking,content,installments,payment,path.join(process.cwd(),'public','bucketlist-logo.png'));
 return new Response(new Uint8Array(pdf),{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${booking.reference.replace(/[^A-Za-z0-9_-]/g,'-')}-quotation.pdf"`,'X-Content-Type-Options':'nosniff'}});}
 return Response.json({booking,content,installments,payment:payment?{label:payment.label,remaining:payment.amount-payment.paid}:null,saved:Boolean(qr.data),warning:qr.data?warning:'',updatedAt:qr.data?.updated_at||null},{headers});
 }catch(e){console.error('Custom quotation GET failed',e);return Response.json({error:'Unable to load quotation. Check the quotation migration and server logs.'},{status:500,headers});}}
export async function POST(request:Request,context:Context){const denied=await requireAdmin();if(denied)return denied;if(!isSameOriginRequest(request))return Response.json({error:'Invalid request origin.'},{status:403,headers});const {id}=await context.params;if(!validId(id))return Response.json({error:'Invalid booking.'},{status:400,headers});try{const raw=await request.text();if(raw.length>11000000)throw Error('Quotation is too large. Reduce the number or size of hotel photos.');const content=validateQuotation(JSON.parse(raw));content.options.forEach(o=>o.stays.forEach(h=>h.photos.forEach(validateHotelImage)));if(content.cover){const bytes=Buffer.from(content.cover.split(',')[1],'base64');const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));if(bytes.length>1572864||!(jpeg||png))throw Error('Use JPEG or PNG up to 1.5 MB.');}
 const existing=await supabaseAdmin.from('custom_booking_quotations').select('custom_booking_id').eq('custom_booking_id',id).maybeSingle();if(existing.error)throw existing.error;
 const values={content,updated_at:new Date().toISOString()};
 const r=existing.data
  ?await supabaseAdmin.from('custom_booking_quotations').update(values).eq('custom_booking_id',id).select('custom_booking_id').single()
  :await supabaseAdmin.from('custom_booking_quotations').insert({custom_booking_id:id,...values}).select('custom_booking_id').single();if(r.error){console.error('Custom quotation save failed',r.error);return Response.json({error:'Unable to save. Check the booking and quotation migration.'},{status:500,headers});}return Response.json({ok:true},{headers});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid quotation.'},{status:400,headers});}}
