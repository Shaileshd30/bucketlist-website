export type Hotel={id:string;name:string;destination:string;category:string;roomType:string;mealPlan:string;mapsUrl:string;photos:string[];active:boolean};
export type Stay=Hotel & {nights:number;alternative:boolean};
export type PackageOption={id:string;name:string;total:number;included:boolean;notes:string;rooms:number;extraMattresses:number;extraMeals:number;cabType:string;cabCount:number;luggageCabs:number;stays:Stay[]};
export const emptyHotel:Hotel={id:'',name:'',destination:'',category:'',roomType:'',mealPlan:'',mapsUrl:'',photos:[],active:true};
export function mapsLink(s:string){if(!s)return '';try{const u=new URL(s);if(u.protocol!=='https:'||u.username||u.password)return '';return (['maps.app.goo.gl','maps.google.com'].includes(u.hostname)||(['www.google.com','google.com','www.google.co.in','google.co.in','goo.gl'].includes(u.hostname)&&u.pathname.startsWith('/maps')))?u.href:'';}catch{return '';}}
export function validateHotel(v:unknown):Hotel {
 if(!v||typeof v!=='object')throw Error('Invalid hotel.');const r=v as Record<string,unknown>,h={...emptyHotel};
 for(const k of ['id','name','destination','category','roomType','mealPlan','mapsUrl'] as const){if(typeof r[k]!=='string'||r[k].length>(k==='mapsUrl'?2000:180))throw Error('Check hotel '+k);h[k]=r[k].trim();}
 if(h.name.length<2||!h.destination)throw Error('Hotel name and destination are required.');
 if(h.mapsUrl&&!mapsLink(h.mapsUrl))throw Error('Use a Google Maps HTTPS link.');
 if(!Array.isArray(r.photos)||r.photos.length>3||r.photos.some(p=>typeof p!=='string'||p.length>350000||!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(p)))throw Error('Use up to three small JPG/PNG photos.');
 h.photos=r.photos as string[];h.active=r.active!==false;return h;
}
export function validateOptions(v:unknown):PackageOption[]{
 if(v===undefined)return [];if(!Array.isArray(v)||v.length>6)throw Error('Use up to six package options.');
 const ids=new Set<string>();let count=0;
 return v.map((p:PackageOption)=>{if(!p||typeof p.id!=='string'||!/^[\w-]{1,80}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120)throw Error('Check package name and ID.');ids.add(p.id);
 if(typeof p.total!=='number'||!Number.isFinite(p.total)||p.total<=0||p.total>100000000)throw Error('Enter a positive package total.');
 if(typeof p.notes!=='string'||p.notes.length>4000||typeof p.cabType!=='string'||p.cabType.length>180||typeof p.included!=='boolean')throw Error('Check package details.');
 for(const k of ['rooms','extraMattresses','extraMeals','cabCount','luggageCabs'] as const)if(!Number.isInteger(p[k])||p[k]<0||p[k]>999)throw Error('Check room and transport counts.');
 if(!Array.isArray(p.stays)||p.stays.length>12||(count+=p.stays.length)>36)throw Error('Maximum 12 hotels per option and 36 overall.');
 return {...p,total:Math.round(p.total*100)/100,stays:p.stays.map(s=>{const hotel=validateHotel(s);if(!Number.isInteger(s.nights)||s.nights<1||s.nights>365||typeof s.alternative!=='boolean')throw Error('Check hotel nights.');return {...hotel,nights:s.nights,alternative:s.alternative};})};});
}
export function optionMatchesBooking(options:PackageOption[],selected:string,total:number){return !options.length||options.some(p=>p.id===selected&&p.included&&Math.round(p.total*100)===Math.round(total*100));}
