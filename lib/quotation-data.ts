export type QuotationContent={intro:string;route:string;hotels:string;itinerary:string;includes:string;excludes:string;terms:string;pricingNote:string;validUntil:string;cover:string};
export const emptyQuotation:QuotationContent={intro:'A journey thoughtfully planned around you. We look forward to helping you create wonderful memories.',route:'',hotels:'',itinerary:'',includes:'',excludes:'',terms:'Subject to availability at the time of confirmation. Please review the itinerary, inclusions and payment schedule before booking.',pricingNote:'',validUntil:'',cover:''};
export type QuoteBooking={reference:string;title:string;customer:string;travellers:number;start:string;end:string;total:number;paid:number;balance:number};
export type QuoteInstallment={id:string;label:string;amount:number;paid:number;due:string;status:string;url:string;expires:string};
export function validPayLink(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&['rzp.io','rzp.in','razorpay.com','www.razorpay.com','pages.razorpay.com','pay.razorpay.com'].includes(u.hostname)?u.href:'';}catch{return '';}}
export function availablePayment(rows:QuoteInstallment[],bookingStatus:string,validUntil:string,now=Date.now()){
 if(['CANCELLED','COMPLETED','MANUAL_REVIEW'].includes(bookingStatus)||!validUntil||now>Date.parse(validUntil+'T23:59:59+05:30'))return null;
 const next=rows.find(i=>!['PAID','CANCELLED'].includes(i.status)&&i.amount>i.paid);
 if(!next||(next.expires&&(!Number.isFinite(Date.parse(next.expires))||Date.parse(next.expires)<=now)))return null;
 const url=validPayLink(next.url);return url?{...next,url}:null;
}
export function validateQuotation(input:unknown):QuotationContent{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid quotation.');const d=input as Record<string,unknown>,result={...emptyQuotation};
 for(const k of Object.keys(result) as (keyof QuotationContent)[]){if(typeof d[k]!=='string')throw Error('Complete the quotation fields.');const v=d[k] as string;const limit=k==='cover'?2100000:k==='itinerary'?30000:10000;if(v.length>limit)throw Error('Quotation field too long: '+k);result[k]=v.trim();}
 if(!/^\d{4}-\d{2}-\d{2}$/.test(result.validUntil)||!Number.isFinite(Date.parse(result.validUntil))||new Date(result.validUntil).toISOString().slice(0,10)!==result.validUntil)throw Error('Enter a valid quotation expiry date.');
 if(result.cover&&!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(result.cover))throw Error('Use a JPEG or PNG cover photo.');
 if(!result.itinerary||!result.includes||!result.excludes||!result.pricingNote)throw Error('Complete itinerary, inclusions, exclusions and the tax/pricing note.');
 return result;
}
