import {validateHotelImage} from '@/lib/hotel-image-validation';
import {requireAdmin} from '@/lib/admin-auth';
import {supabaseAdmin} from '@/lib/supabase-server';
import {isSameOriginRequest} from '@/lib/request-origin';
import {emptyHotel,validateHotel} from '@/lib/hotel-data';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private'};
export async function GET(request:Request){const denied=await requireAdmin();if(denied)return denied;try{
 const url=new URL(request.url),id=url.searchParams.get('id');
 if(id){const [v,p]=await Promise.all([supabaseAdmin.from('crm_vendors').select('id,name,destination,active').eq('id',id).eq('vendor_type','HOTEL').single(),supabaseAdmin.from('crm_hotel_profiles').select('profile').eq('vendor_id',id).maybeSingle()]);if(v.error||p.error)throw Error('Unable to load hotel.');return Response.json({...emptyHotel,...p.data?.profile,...v.data,destination:v.data.destination||''},{headers});}
 const page=Math.max(0,Math.min(500,Number(url.searchParams.get('page'))||0));
 const search=(url.searchParams.get('search')||'').replace(/[^\p{L}\p{N} -]/gu,'').slice(0,100);
 let query=supabaseAdmin.from('crm_vendors').select('id,name,destination,active').eq('vendor_type','HOTEL').order('name').order('id');if(search)query=query.or(`name.ilike.%${search}%,destination.ilike.%${search}%`);
 const r=await query.range(page*100,page*100+100);if(r.error)throw r.error;return Response.json({hotels:r.data.slice(0,100),hasMore:r.data.length>100},{headers});
 }catch(e){console.error('Hotel load failed',e);return Response.json({error:'Unable to load hotels. Check the hotel migration.'},{status:500,headers});}}
export async function POST(request:Request){const denied=await requireAdmin();if(denied)return denied;if(!request.headers.get('origin')||!isSameOriginRequest(request))return Response.json({error:'Invalid origin.'},{status:403,headers});try{
 const raw=await request.text();if(raw.length>1100000)throw Error('Hotel photos are too large.');const hotel=validateHotel(JSON.parse(raw));hotel.photos.forEach(validateHotelImage);
 const r=await supabaseAdmin.rpc('save_crm_hotel',{p_id:hotel.id||null,p_profile:hotel,p_active:hotel.active});if(r.error){console.error('Hotel save failed',r.error);throw Error('Unable to save hotel. Check migration and vendor.');}return Response.json({...hotel,id:r.data},{headers});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Unable to save.'},{status:400,headers});}}
