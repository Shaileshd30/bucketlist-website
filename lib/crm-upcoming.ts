export type TripAlert={id:string;kind:string;title:string;date:string;days:number;travellers:number;customerBalance:number;vendorBalance:number|null;financeId:string|null;review:boolean};
export type UpcomingPayload={today:string;trips:TripAlert[];warnings:string[]};
export function indiaDay(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const get=(k:string)=>parts.find(p=>p.type===k)!.value;return `${get('year')}-${get('month')}-${get('day')}`;}
export function daysAway(date:string,today:string){return Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);}
export function popupDue(today:string,until:number,now=Date.now()){return Number.isFinite(until)&&until>now?false:today!==indiaDay(new Date(now));}
