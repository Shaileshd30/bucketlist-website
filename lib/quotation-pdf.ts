import {validateHotelImage} from './hotel-image-validation';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import {validPayLink} from './quotation-data';
import {mapsLink,optionMatchesBooking} from './hotel-data';
import path from 'node:path';
import type {QuotationContent,QuoteBooking,QuoteInstallment} from './quotation-data';
const green='#17251d',orange='#ed6a22',cream='#f5f3ee',muted='#65716a';
// Existing business links from the website's booking email and trip reminders.
export const quotationReviewLinks={read:'https://share.google/Q9k66ci3TGFVHkuOl',write:'https://www.google.com/search?q=bucketlist+adventure#lrd=0x3bc2bf2b17902bb1:0x4c1a5b103ad209c7,3,,,,'};
const text=(s:string)=>s.replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
const money=(n:number)=>'₹'+new Intl.NumberFormat('en-IN',{minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
const date=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)?new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z')):value;
export async function createQuotationPdf(b:QuoteBooking,q:QuotationContent,installments:QuoteInstallment[],payment:QuoteInstallment|null,logo:string):Promise<Buffer>{
 const classic=q.pdfDesign==='classic';
 const eligible=payment&&validPayLink(payment.url)&&payment.amount>payment.paid&&(!payment.expires||Date.parse(payment.expires)>Date.now())&&optionMatchesBooking(q.options,q.selectedOptionId,b.total)?payment:null;
 const whatsapp='https://wa.me/919225531257?text='+encodeURIComponent('Hello Bucketlist Adventure, please help me confirm quotation '+b.reference+'.'+(b.balance>0&&!eligible?' Please send an updated payment link.':''));
 const actionUrl=eligible?validPayLink(eligible.url):whatsapp;
 const [qr,reviewsQr]=await Promise.all([actionUrl,quotationReviewLinks.read].map(url=>QRCode.toBuffer(url,{type:'png',width:360,margin:4,errorCorrectionLevel:'M'})));
 return new Promise((resolve,reject)=>{
 const fonts=path.join(path.dirname(logo),'fonts','quotation');
 const d=new PDFDocument({font:path.join(fonts,'DejaVuSans.ttf'),size:'A4',margin:0,bufferPages:true,info:{Title:'Quotation '+b.reference,Author:'Bucketlist Adventure'}}),chunks:Buffer[]=[];
 d.registerFont('Helvetica',path.join(fonts,'DejaVuSans.ttf'));d.registerFont('Helvetica-Bold',path.join(fonts,'DejaVuSans-Bold.ttf'));
 d.on('data',(x:Buffer)=>chunks.push(x));d.on('error',reject);d.on('end',()=>resolve(Buffer.concat(chunks)));
 const width=507,x=44;let y=80;
 const accent=classic?orange:green;
 const page=()=>{d.addPage();d.rect(0,0,595,842).fill(cream);if(classic)d.rect(0,0,595,7).fill(orange);else d.rect(0,0,8,842).fill(green);d.fillColor(green).font('Helvetica-Bold').fontSize(10).text('BUCKETLIST ADVENTURE',x,30);d.fillColor(muted).font('Helvetica').fontSize(8).text(text(b.reference)+'  /  TRAVEL QUOTATION',x,47);y=84;};
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
 const section=(label:string,value:string)=>{if(!value.trim())return;d.font('Helvetica').fontSize(11);const totalHeight=value.split('\n').filter(l=>l.trim()).reduce((sum,line)=>sum+d.heightOfString(text(line),{width,lineGap:4})+14,38);if(totalHeight<440)ensure(totalHeight);ensure(40+Math.min(570,d.heightOfString(text(value.split('\n').find(l=>l.trim())||''),{width,lineGap:4})));if(classic){d.roundedRect(x,y-8,width,29,4).fill(green);d.fillColor('#ffffff');}else d.fillColor(orange);d.font('Helvetica-Bold').fontSize(10).text(label.toUpperCase(),x+(classic?12:0),y,{width:width-(classic?24:0),characterSpacing:0});y+=30;for(const line of value.split('\n'))if(line.trim()){if(/^day\s+\d/i.test(line.trim()))ensure(110);paragraph(line);}y+=12;};
 try{
 d.rect(0,0,595,842).fill(cream);d.rect(0,0,595,150).fill(green);if(classic)d.rect(0,145,595,7).fill(orange);d.image(logo,x,30,{fit:[138,75]});d.fillColor('#ffffff').font('Helvetica').fontSize(9).text('WE PLAN IT. YOU LIVE IT.',330,48,{width:220,align:'right'}).text('bookings@bucketlistadventure.in',330,66,{width:220,align:'right'});d.fillColor('#efb98c').font('Helvetica-Bold').fontSize(9).text(classic?'YOUR TRAVEL COLLECTION':'A JOURNEY DESIGNED AROUND YOU',x,124,{characterSpacing:0});
 y=176;
 const coverTitle=()=>{
  d.fillColor(orange).font('Helvetica-Bold').fontSize(9).text('PREPARED FOR '+text(b.customer).toUpperCase(),x,y,{width});y=d.y+18;
  d.font('Helvetica-Bold').fontSize(classic?27:32);
  const titleHeight=d.heightOfString(text(b.title),{width,lineGap:3});ensure(titleHeight+50);
  d.fillColor(green).font('Helvetica-Bold').fontSize(classic?27:32).text(text(b.title),x,y,{width,lineGap:3});y=d.y+20;
  paragraph(`${date(b.start)||'Dates to be confirmed'} to ${date(b.end)||'Dates to be confirmed'}  |  ${b.travellers} traveller(s)`,11);
 };
 if(classic)coverTitle();
 if(q.cover){const bytes=Buffer.from(q.cover.split(',')[1],'base64');const maxHeight=classic?220:270;ensure(maxHeight+24);y+=photo(bytes,x,y,width,maxHeight)+22;}
 else if(!classic){d.roundedRect(x,y,width,135,16).fill('#e4e9dc');d.fillColor(green).font('Helvetica-Bold').fontSize(32).text('A journey made\nfor you.',65,y+23,{width:450});y+=163;}
 if(!classic)coverTitle();
 ensure(115);d.roundedRect(x,y,width,105,15).fill(green);d.fillColor('#cbd9cc').font('Helvetica').fontSize(10).text('YOUR PACKAGE PRICE',64,y+18);d.fillColor('#ffffff').font('Helvetica-Bold').fontSize(27).text(money(b.total),64,y+40);d.font('Helvetica').fontSize(9).text('Quotation valid until '+date(q.validUntil),64,y+79);y+=127;
 paragraph('Quotation '+b.reference+'. This is a proposal, not a booking confirmation.',9);
 page();section('Your journey',q.intro);section('Route & overnight stays',q.route);section('Accommodation',q.hotels);if(q.options.length)section('Compare your options',q.options.filter(o=>o.included).map(o=>o.name+': '+money(o.total)+' for the group').join('\n')+'\nChoose one option. Prices are alternatives and are not added together.');
 ensure(226);const ry=y;
 d.roundedRect(x,ry,width,208,classic?5:14).fill('#e4e9dc');
 d.fillColor(orange).font('Helvetica-Bold').fontSize(9).text('GOOGLE REVIEWS',x+18,ry+16,{width:310});
 d.fillColor(green).font('Helvetica-Bold').fontSize(17).text('Good journeys. Real stories.',x+18,ry+37,{width:320});
 d.font('Helvetica').fontSize(10).text('Meet us through our travellers’ experiences. Open Google to read the latest reviews.',x+18,ry+68,{width:310,lineGap:3});
 d.roundedRect(x+18,ry+116,280,34,6).fill(accent);
 d.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff').text('Read Google Reviews',x+28,ry+125,{width:260,align:'center',link:quotationReviewLinks.read});d.link(x+18,ry+116,280,34,quotationReviewLinks.read);
 d.font('Helvetica-Bold').fontSize(10).fillColor(green).text('Write a review after your trip',x+18,ry+169,{width:310,link:quotationReviewLinks.write,underline:true});
 d.image(reviewsQr,x+width-132,ry+45,{width:112,height:112});d.link(x+width-132,ry+45,112,112,quotationReviewLinks.read);
 d.font('Helvetica').fontSize(8).fillColor(muted).text('SCAN FOR REVIEWS',x+width-142,ry+166,{width:132,align:'center'});y+=226;
 for(const option of q.options.filter(o=>o.included)){
  ensure(350);section(option.name,option.id===q.selectedOptionId?'Your Selected Package':'Package alternative');
  section('Package price',money(option.total)+' for the group'+(b.travellers>0?' | '+money(option.total/b.travellers)+' average per person':''));
  section('Accommodation & transport',[option.rooms?option.rooms+' room(s)':'',option.extraMattresses?option.extraMattresses+' extra mattress(es)':'',option.extraMeals?option.extraMeals+' extra meal(s)':''].filter(Boolean).join(' | ')+'\n'+[option.cabType,option.cabCount?option.cabCount+' vehicle(s)':'',option.luggageCabs?option.luggageCabs+' luggage vehicle(s)':''].filter(Boolean).join(' | '));
  section('Option details',option.notes);
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
    {value:[hotel.destination,hotel.category?'Category: '+hotel.category:'',hotel.nights+' night(s)',hotel.alternative?'Alternative hotel':''].filter(Boolean).join(' | '),size:9,bold:false,color:muted},
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
 page();
 section('Your days, thoughtfully planned','A day-by-day guide to your journey.');
 const days=q.itinerary.split(/\n(?=\s*day\s*\d)/i).filter(v=>v.trim());
 for(const day of days){
  const lines=day.trim().split('\n'),heading=lines.shift()||'',body=lines.join('\n');
  d.font('Helvetica-Bold').fontSize(13);
  const hh=d.heightOfString(text(heading),{width:width-32,lineGap:3});
  if(hh>100){paragraph(heading,13);for(const line of body.split('\n'))if(line.trim())paragraph(line);continue;}
  ensure(Math.min(650,hh+100));
  d.roundedRect(x,y,width,hh+28,classic?5:12).fill(classic?green:'#e4e9dc');
  d.font('Helvetica-Bold').fontSize(13).fillColor(classic?'#ffffff':green).text(text(heading),x+16,y+13,{width:width-32,lineGap:3});y+=hh+42;
  for(const line of body.split('\n'))if(line.trim())paragraph(line);
  y+=10;
 }
 section('Included in your package',q.includes);section('Not included',q.excludes);
 page();section('Your package investment',`Total package price for ${b.travellers} traveller(s): ${money(b.total)}\nAlready received: ${money(b.paid)}\nRemaining booking balance: ${money(b.balance)}`);section('Pricing & taxes',q.pricingNote);
 section('Payment schedule',installments.map(i=>`${i.label}: ${money(i.amount)} | Paid: ${money(i.paid)} | Due: ${date(i.due)||'As agreed'} | ${i.status}`).join('\n'));
 section('Booking terms',q.terms);
 page();section('Your next adventure starts here','Review your proposal, then take the next step with your travel team.');
 section('Make this journey yours',`Your package: ${money(b.total)}\nReceived: ${money(b.paid)}  |  Remaining: ${money(b.balance)}`);
 const label=eligible?'Pay '+money(eligible.amount-eligible.paid)+' & Confirm Booking':b.balance<=0?'Ask Us on WhatsApp':'Request an Updated Payment Link';
 ensure(250);const cy=y;
 d.roundedRect(x,cy,width,214,14).fill('#e4e9dc');
 d.image(qr,x+width-142,cy+22,{width:124,height:124});
 d.fillColor(green).font('Helvetica-Bold').fontSize(16).text(eligible?'Confirm your journey':'Let’s plan your next step',x+18,cy+22,{width:300});
 d.font('Helvetica').fontSize(10).text(eligible?'Secure payment via Razorpay. Scan the code or use the button below.':'Scan the code or use the button to contact your travel team on WhatsApp.',x+18,cy+60,{width:300,lineGap:4});
 d.roundedRect(x+18,cy+116,300,54,8).fill(accent);
 d.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(label,x+28,cy+130,{width:280,align:'center',link:actionUrl});d.link(x+18,cy+116,300,54,actionUrl);
 d.link(x+width-142,cy+22,124,124,actionUrl);
 d.fillColor(muted).font('Helvetica').fontSize(8).text(eligible?'SCAN TO PAY':'SCAN FOR WHATSAPP',x+width-142,cy+155,{width:124,align:'center'});
 d.fillColor(green).font('Helvetica-Bold').fontSize(10).text('Ask Us on WhatsApp',x+18,cy+186,{width:300,link:whatsapp,underline:true});y=cy+232;
 if(eligible)paragraph('Payment for '+eligible.label+'.'+(eligible.expires?' Link expires '+date(eligible.expires.slice(0,10))+'.':'')+' Payment status can change after this PDF is issued. Contact us if the link is unavailable.',9);
 else paragraph(b.balance<=0?'No payment is requested in this PDF.':'Your travel team will confirm the current amount and provide an eligible payment link.',9);
 section('Contact your travel team','Phone / WhatsApp: +91 9225531257 | Email: bookings@bucketlistadventure.in');
 paragraph('Valid until '+date(q.validUntil)+'. Services remain subject to availability and your agreed booking terms. Payment status can change after this PDF is issued.',9);
 const range=d.bufferedPageRange();for(let i=range.start;i<range.start+range.count;i++){d.switchToPage(i);d.moveTo(x,782).lineTo(551,782).strokeColor('#d6dbd2').stroke();d.font('Helvetica').fontSize(8).fillColor(muted).text('Bucketlist Adventure | We Plan It. You Live It.',x,795,{width:360}).text(`${i+1} / ${range.count}`,500,795,{width:51,align:'right'});d.text('bucketlistadventure.in',x,812,{width:400,link:'https://bucketlistadventure.in/',underline:true});}
 d.end();
 }catch(e){reject(e);d.end();}
});}
