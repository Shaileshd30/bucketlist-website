export type TripImport = {title:string;dates:string;year:string;pax:number;days:number;unitPrice:number;total:number;itinerary:string;includes:string;excludes:string;route:string;warnings:string[]};
/** Deliberately extracts labelled facts, without inventing hotels, taxes or dates. */
export function parseTripMessage(raw:string):TripImport {
 if(raw.length>40000)throw Error('Paste up to 40,000 characters.');
 const clean=raw.replace(/\r/g,'').replace(/[*_`]/g,'').trim();
 const lines=clean.split('\n').map(s=>s.trim());
 const first=lines.find(Boolean)||'';
 const pax=Number(clean.match(/\b(\d+)\s*(?:pax|persons?|travell?ers?|guests?)\b/i)?.[1]||0);
 const days=Number(first.match(/\b(\d+)\s*days?\b/i)?.[1]||0);
 const priceMatches=[...clean.matchAll(/(?:price|cost|amount)\s*:\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)([^\n]*)/gi)];
 const price=priceMatches.length===1?Number(priceMatches[0][1].replace(/,/g,'')):0;
 const perPerson=priceMatches.length===1&&/per\s*(?:person|pax)|\/\s*(?:person|pax)/i.test(priceMatches[0][2]);
 const explicitlyTotal=priceMatches.length===1&&/\btotal\b|whole package|all travellers/i.test(priceMatches[0][2]);
 const total=perPerson&&pax?Math.round(price*pax*100)/100:explicitlyTotal?price:0;
 let mode='',itinerary='',includes='',excludes='';
 for(const line of lines){
  const heading=line.match(/^(?:[^\p{L}\p{N}]*)?(includes?|inclusions?|excludes?|exclusions?)\s*:\s*(.*)$/iu);
  if(heading){mode=/^in/i.test(heading[1])?'includes':'excludes';if(mode==='includes')includes+=heading[2]+'\n';else excludes+=heading[2]+'\n';continue;}
  if(/^(?:[^\p{L}\p{N}]*)?(?:price|cost|amount)\s*:/iu.test(line)){mode='';continue;}
  if(/^day\s+\d+\b/i.test(line))mode='itinerary';
  if(mode==='itinerary')itinerary+=line+'\n';else if(mode==='includes')includes+=line+'\n';else if(mode==='excludes')excludes+=line+'\n';
 }
 const stays=[...itinerary.matchAll(/(?:overnight(?:\s+stay)?(?:\s+in)?\s*:?\s*)([^.\n]+)/gi)].map(m=>m[1].trim());
 const warnings=['Review extracted details before applying. Booking dates, traveller count and payable amount must be updated in Custom Bookings.'];
 const year=first.match(/\b20\d{2}\b/)?.[0]||'';
 if(!year)warnings.push('Travel year is missing. No year has been assumed.');
 if(!excludes.trim())warnings.push('Exclusions are missing; enter them before saving.');
 if(!total)warnings.push('Total price could not be determined unambiguously. Enter it manually.');
 warnings.push('Taxes, named hotels and room categories are not inferred from general inclusions.');
 return {title:first.replace(/^[^\p{L}\p{N}]+/u,'').split(/\s[-–—]\s/)[0].trim(),dates:first,year,pax,days,unitPrice:perPerson?price:0,total,itinerary:itinerary.trim(),includes:includes.trim(),excludes:excludes.trim(),route:stays.join(' → '),warnings};
}
