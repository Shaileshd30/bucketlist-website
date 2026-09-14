import {validateHotelImage} from './hotel-image-validation';
import PDFDocument from 'pdfkit';
import {mapsLink,optionMatchesBooking} from './hotel-data';
import path from 'node:path';
import type {QuotationContent,QuoteBooking,QuoteInstallment} from './quotation-data';
const green='#17251d',orange='#ed6a22',cream='#f5f3ee',muted='#65716a';
const text=(s:string)=>s.replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
const money=(n:number)=>'₹'+new Intl.NumberFormat('en-IN',{minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
const date=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)?new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z')):value;
export function createQuotationPdf(b:QuoteBooking,q:QuotationContent,installments:QuoteInstallment[],payment:QuoteInstallment|null,logo:string):Promise<Buffer>{return new Promise((resolve,reject)=>{
 const fonts=path.join(path.dirname(logo),'fonts','quotation');
 const d=new PDFDocument({font:path.join(fonts,'DejaVuSans.ttf'),size:'A4',margin:0,bufferPages:true,info:{Title:'Quotation '+b.reference,Author:'Bucketlist Adventure'}}),chunks:Buffer[]=[];
 d.registerFont('Helvetica',path.join(fonts,'DejaVuSans.ttf'));d.registerFont('Helvetica-Bold',path.join(fonts,'DejaVuSans-Bold.ttf'));
 d.on('data',(x:Buffer)=>chunks.push(x));d.on('error',reject);d.on('end',()=>resolve(Buffer.concat(chunks)));
 const width=507,x=44;let y=80;
 const page=()=>{d.addPage();d.rect(0,0,595,842).fill(cream);d.rect(0,0,8,842).fill(orange);d.fillColor(green).font('Helvetica-Bold').fontSize(10).text('BUCKETLIST ADVENTURE',x,30);d.fillColor(muted).font('Helvetica').fontSize(8).text(text(b.reference)+'  /  TRAVEL QUOTATION',x,47);y=84;};
 const ensure=(h:number)=>{if(y+h>748)page();};
 // PDFKit exposes decoded image dimensions; account for EXIF rotation before fitting.
 const dimensions=(bytes:Buffer,maxWidth:number,maxHeight:number)=>{
  const image=(d as unknown as {openImage:(source:Buffer)=>{width:number;height:number;orientation?:number}}).openImage(bytes);
  const rotated=(image.orientation||1)>4;
  const iw=rotated?image.height:image.width,ih=rotated?image.width:image.height;
  if(!Number.isFinite(iw)||!Number.isFinite(ih)||iw<=0||ih<=0)throw Error('Invalid photo dimensions.');
  const scale=Math.min(maxWidth/iw,maxHeight/ih);
  return {w:iw*scale,h:ih*scale};
 };
 const photo=(bytes:Buffer,px:number,py:number,maxWidth:number,maxHeight:number)=>{
  const size=dimensions(bytes,maxWidth,maxHeight);
  d.image(bytes,px+(maxWidth-size.w)/2,py,{fit:[size.w,size.h],align:'center',valign:'center'});
  return size.h;
 };
 const paragraph=(value:string,size=11)=>{d.font('Helvetica').fontSize(size);const words=text(value).split(/\s+/).filter(Boolean);let chunk='';for(const word of words){const candidate=chunk?chunk+' '+word:word;if(d.heightOfString(candidate,{width,lineGap:4})>570){const h=d.heightOfString(chunk,{width,lineGap:4});ensure(h+14);d.fillColor(green).font('Helvetica').fontSize(size).text(chunk,x,y,{width,lineGap:4});y+=h+14;chunk=word;}else chunk=candidate;}if(chunk){const h=d.heightOfString(chunk,{width,lineGap:4});ensure(h+14);d.fillColor(green).font('Helvetica').fontSize(size).text(chunk,x,y,{width,lineGap:4});y+=h+14;}};
 const section=(label:string,value:string)=>{if(!value.trim())return;d.font('Helvetica').fontSize(11);const totalHeight=value.split('\n').filter(l=>l.trim()).reduce((sum,line)=>sum+d.heightOfString(text(line),{width,lineGap:4})+14,38);if(totalHeight<440)ensure(totalHeight);ensure(40+Math.min(570,d.heightOfString(text(value.split('\n').find(l=>l.trim())||''),{width,lineGap:4})));d.fillColor(orange).font('Helvetica-Bold').fontSize(10).text(label.toUpperCase(),x,y,{characterSpacing:0});y+=26;for(const line of value.split('\n'))if(line.trim()){if(/^day\s+\d/i.test(line.trim()))ensure(110);paragraph(line);}y+=12;};
 try{
 d.rect(0,0,595,842).fill(cream);d.rect(0,0,595,150).fill(green);d.image(logo,x,30,{fit:[138,75]});d.fillColor('#ffffff').font('Helvetica').fontSize(9).text('WE PLAN IT. YOU LIVE IT.',330,48,{width:220,align:'right'}).text('bookings@bucketlistadventure.in',330,66,{width:220,align:'right'});d.fillColor('#efb98c').font('Helvetica-Bold').fontSize(9).text('YOUR PERSONALISED TRAVEL QUOTATION',x,124,{characterSpacing:0});
 if(q.cover){const bytes=Buffer.from(q.cover.split(',')[1],'base64');y=172+photo(bytes,x,172,width,270)+22;}else{d.roundedRect(x,175,width,135,16).fill('#e4e9dc');d.fillColor(green).font('Helvetica-Bold').fontSize(32).text('A journey made\nfor you.',65,198,{width:450});y=338;}
 d.fillColor(orange).font('Helvetica-Bold').fontSize(9).text('PREPARED FOR '+text(b.customer).toUpperCase(),x,y,{width});y=d.y+18;
 d.fillColor(green).font('Helvetica-Bold').fontSize(27).text(text(b.title),x,y,{width,lineGap:3});y=d.y+20;
 paragraph(`${date(b.start)||'Dates to be confirmed'} to ${date(b.end)||'Dates to be confirmed'}  |  ${b.travellers} traveller(s)`,11);
 ensure(115);d.roundedRect(x,y,width,105,15).fill(green);d.fillColor('#cbd9cc').font('Helvetica').fontSize(10).text(q.options.length?'CURRENT BOOKING TOTAL - OPTIONS INSIDE':'TOTAL PACKAGE PRICE - ALL TRAVELLERS',64,y+18);d.fillColor('#ffffff').font('Helvetica-Bold').fontSize(27).text(money(b.total),64,y+40);d.font('Helvetica').fontSize(9).text('Quotation valid until '+date(q.validUntil),64,y+79);y+=127;
 paragraph('Quotation '+b.reference+'. This is a proposal, not a booking confirmation.',9);
 page();section('Your journey',q.intro);section('Route & overnight stays',q.route);section('Accommodation',q.hotels);if(q.options.length)section('Compare your options',q.options.filter(o=>o.included).map(o=>o.name+': '+money(o.total)+' for the group').join('\n')+'\nChoose one option. Prices are alternatives and are not added together.');
 for(const option of q.options.filter(o=>o.included)){
  ensure(350);section(option.name,option.id===q.selectedOptionId?'Accepted package option':'Package alternative');
  section('Package price',money(option.total)+' for the group'+(b.travellers>0?' | '+money(option.total/b.travellers)+' average per person':''));
  section('Accommodation & transport',[option.rooms?option.rooms+' room(s)':'',option.extraMattresses?option.extraMattresses+' extra mattress(es)':'',option.extraMeals?option.extraMeals+' extra meal(s)':''].filter(Boolean).join(' | ')+'\n'+[option.cabType,option.cabCount?option.cabCount+' vehicle(s)':'',option.luggageCabs?option.luggageCabs+' luggage vehicle(s)':''].filter(Boolean).join(' | '));
  section('Option details',option.notes);
  section('Hotel overview',option.stays.map(h=>[h.destination,h.nights+'N',h.name+(h.alternative?' (alternative, not additional nights)':''),h.roomType,h.mealPlan].filter(Boolean).join(' | ')).join('\n'));
  for(const hotel of option.stays){
   const images=hotel.photos.map(value=>validateHotelImage(value));
   const firstMax=images.length>1?130:150;
   const firstHeight=images.length?dimensions(images[0],width,firstMax).h:0;
   const sideWidth=(width-12)/2;
   const extraHeight=images.length>1?Math.max(...images.slice(1).map(bytes=>dimensions(bytes,images.length===2?width:sideWidth,100).h)):0;
   const map=mapsLink(hotel.mapsUrl);
   const rows=[
    {value:option.name.toUpperCase()+' / PROPOSED ACCOMMODATION',size:8,bold:true,color:orange},
    {value:hotel.name,size:15,bold:true,color:green},
    {value:[hotel.destination,hotel.category?'Rating / category: '+hotel.category:'',hotel.nights+' night(s)',hotel.alternative?'Alternative hotel':''].filter(Boolean).join(' | '),size:9,bold:false,color:muted},
    {value:[hotel.roomType||'Room category to be confirmed',hotel.mealPlan||'Meal plan to be confirmed'].join(' | '),size:10,bold:false,color:green},
    {value:'Subject to availability at confirmation.',size:8,bold:false,color:muted}
   ];
   const heights=rows.map(row=>{d.font(row.bold?'Helvetica-Bold':'Helvetica').fontSize(row.size);return d.heightOfString(text(row.value),{width,lineGap:2});});
   const cardHeight=heights.reduce((sum,h)=>sum+h+7,0)+(map?24:0)+firstHeight+(extraHeight?extraHeight+10:0)+36;
   ensure(Math.min(660,cardHeight));
   if(y>90){d.moveTo(x,y).lineTo(x+width,y).strokeColor('#d6dbd2').stroke();y+=14;}
   rows.forEach((row,n)=>{
    ensure(heights[n]+7);d.font(row.bold?'Helvetica-Bold':'Helvetica').fontSize(row.size).fillColor(row.color).text(text(row.value),x,y,{width,lineGap:2});y+=heights[n]+7;
   });
   if(map){ensure(24);d.font('Helvetica-Bold').fontSize(10).fillColor(orange).text('View on Google Maps',x,y,{link:map,underline:true});y+=24;}
   if(images.length){
    ensure(firstHeight+10);photo(images[0],x,y,width,firstMax);y+=firstHeight+10;
    if(images.length>1){
     ensure(extraHeight+10);
     images.slice(1).forEach((bytes,n)=>photo(bytes,x+n*(sideWidth+12),y,images.length===2?width:sideWidth,100));
     y+=extraHeight+10;
    }
   }
   y+=12;
  }
 }
 page();section('Day-by-day itinerary',q.itinerary);section('Included in your package',q.includes);section('Not included',q.excludes);
 ensure(240);section('Your package investment',`Total package price for ${b.travellers} traveller(s): ${money(b.total)}\nAlready received: ${money(b.paid)}\nRemaining booking balance: ${money(b.balance)}`);section('Pricing & taxes',q.pricingNote);
 section('Payment schedule',installments.map(i=>`${i.label}: ${money(i.amount)} | Paid: ${money(i.paid)} | Due: ${date(i.due)||'As agreed'} | ${i.status}`).join('\n'));
 if(payment&&optionMatchesBooking(q.options,q.selectedOptionId,b.total)){ensure(106);d.roundedRect(x,y,width,51,10).fill(orange);d.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text('PAY '+money(payment.amount-payment.paid)+' & BOOK',x,y+18,{width,align:'center',link:payment.url});d.link(x,y,width,51,payment.url);y+=65;paragraph('Secure Razorpay payment for '+payment.label+(payment.expires?'. Link expires '+payment.expires.slice(0,10):'. No link expiry is recorded')+'. If unavailable, contact us for an updated quotation and payment link.',9);}else section('How to confirm','Contact Bucketlist Adventure for an active payment link. No payable link is included in this quotation.');
 section('Booking terms',q.terms);section('Contact your travel team','Phone / WhatsApp: +91 9225531257\nEmail: bookings@bucketlistadventure.in\nUse the clickable links at the foot of each page to contact or follow us.');section('Quotation validity','Valid until '+date(q.validUntil)+'. Services remain subject to availability and your agreed booking terms. Payment status can change after this PDF is issued.');
 const range=d.bufferedPageRange();for(let i=range.start;i<range.start+range.count;i++){d.switchToPage(i);d.moveTo(x,782).lineTo(551,782).strokeColor('#d6dbd2').stroke();d.font('Helvetica').fontSize(8).fillColor(muted).text('Bucketlist Adventure | We Plan It. You Live It.',x,795,{width:360}).text(`${i+1} / ${range.count}`,500,795,{width:51,align:'right'});const contacts=[['Call','tel:+919225531257'],['WhatsApp','https://wa.me/919225531257'],['Email','mailto:bookings@bucketlistadventure.in'],['Website','https://bucketlistadventure.in/'],['Instagram','https://www.instagram.com/bucketlistadventuure/'],['Facebook','https://www.facebook.com/bucketlistadventures2018']];contacts.forEach(([label,url],n)=>d.text(label,x+n*80,812,{width:78,link:url,underline:true}));}
 d.end();
 }catch(e){reject(e);d.end();}
});}
