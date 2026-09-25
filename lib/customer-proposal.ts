import {createHash} from 'node:crypto';
import {editableQuotation,availablePayment,type QuoteInstallment} from './quotation-data';
import {optionMatchesBooking} from './hotel-data';

export const proposalHeaders={'Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer'};
export function hashProposalToken(token:string){return /^[a-f0-9]{64}$/.test(token)?createHash('sha256').update(token).digest('hex'):'';}
export function publicProposalContent(input:unknown){
 const q=editableQuotation(input);
 return {...q,options:q.options.filter(o=>o.included),selectedOptionId:q.options.some(o=>o.included&&o.id===q.selectedOptionId)?q.selectedOptionId:''};
}
export function proposalPayment(content:unknown,acceptedAt:string|null,selected:string|null,total:number,rows:QuoteInstallment[],status:string){
 const q=editableQuotation(content);
 if(!acceptedAt||!optionMatchesBooking(q.options,q.selectedOptionId,total)||(q.options.length&&selected!==q.selectedOptionId))return null;
 return availablePayment(rows,status,q.validUntil);
}
