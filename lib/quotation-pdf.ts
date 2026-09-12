import PDFDocument from 'pdfkit';
import path from 'node:path';
import type {QuotationContent,QuoteBooking,QuoteInstallment} from './quotation-data';
const green='#17251d',orange='#ed6a22',cream='#f5f3ee',muted='#65716a';
const text=(s:string)=>s.replace(/₹/g,'INR ').replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^\x09\x0a\x0d\x20-\xff]/g,'');
const money=(n:number)=>'INR '+new Intl.NumberFormat('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
export function createQuotationPdf(b:QuoteBooking,q:QuotationContent,installments:QuoteInstallment[],payment:QuoteInstallment|null,logo:string):Promise<Buffer>{return new Promise((resolve,reject)=>{
 const fonts=path.join(path.dirname(logo),'fonts','quotation');
 const d=new PDFDocument({font:path.join(fonts,'DejaVuSans.ttf'),size:'A4',margin:0,bufferPages:true,info:{Title:'Quotation '+b.reference,Author:'Bucketlist Adventure'}}),chunks:Buffer[]=[];
 d.registerFont('Helvetica',path.join(fonts,'DejaVuSans.ttf'));d.registerFont('Helvetica-Bold',path.join(fonts,'DejaVuSans-Bold.ttf'));
 d.on('data',(x:Buffer)=>chunks.push(x));d.on('error',reject);d.on('end',()=>resolve(Buffer.concat(chunks)));
 const width=507,x=44;let y=80;
 const page=()=>{d.addPage();d.rect(0,0,595,842).fill(cream);d.rect(0,0,8,842).fill(orange);d.fillColor(green).font('Helvetica-Bold').fontSize(10).text('BUCKETLIST ADVENTURE',x,30);d.fillColor(muted).font('Helvetica').fontSize(8).text(text(b.reference)+'  /  TRAVEL QUOTATION',x,47);y=84;};
 const ensure=(h:number)=>{if(y+h>748)page();};
 const paragraph=(value:string,size=11)=>{d.font('Helvetica').fontSize(size);const words=text(value).split(/\s+/).filter(Boolean);let chunk='';for(const word of words){const candidate=chunk?chunk+' '+word:word;if(d.heightOfString(candidate,{width,lineGap:4})>570){const h=d.heightOfString(chunk,{width,lineGap:4});ensure(h+14);d.fillColor(green).font('Helvetica').fontSize(size).text(chunk,x,y,{width,lineGap:4});y+=h+14;chunk=word;}else chunk=candidate;}if(chunk){const h=d.heightOfString(chunk,{width,lineGap:4});ensure(h+14);d.fillColor(green).font('Helvetica').fontSize(size).text(chunk,x,y,{width,lineGap:4});y+=h+14;}};
 const section=(label:string,value:string)=>{if(!value.trim())return;ensure(70);d.fillColor(orange).font('Helvetica-Bold').fontSize(10).text(label.toUpperCase(),x,y,{characterSpacing:0});y+=26;for(const line of value.split('\n'))if(line.trim()){if(/^day\s+\d/i.test(line.trim()))ensure(110);paragraph(line);}y+=12;};
 try{
 d.rect(0,0,595,842).fill(cream);d.rect(0,0,595,150).fill(green);d.image(logo,x,30,{fit:[138,75]});d.fillColor('#ffffff').font('Helvetica').fontSize(9).text('WE PLAN IT. YOU LIVE IT.',330,48,{width:220,align:'right'}).text('bookings@bucketlistadventure.in',330,66,{width:220,align:'right'});d.fillColor('#efb98c').font('Helvetica-Bold').fontSize(9).text('YOUR PERSONALISED TRAVEL QUOTATION',x,124,{characterSpacing:0});
 if(q.cover){d.save().rect(x,172,width,222).clip();d.image(Buffer.from(q.cover.split(',')[1],'base64'),x,172,{cover:[width,222],align:'center',valign:'center'});d.restore();y=416;}else{d.roundedRect(x,175,width,135,16).fill('#e4e9dc');d.fillColor(green).font('Helvetica-Bold').fontSize(32).text('A journey made\nfor you.',65,198,{width:450});y=338;}
 d.fillColor(orange).font('Helvetica-Bold').fontSize(9).text('PREPARED FOR '+text(b.customer).toUpperCase(),x,y,{width});y=d.y+18;
 d.fillColor(green).font('Helvetica-Bold').fontSize(27).text(text(b.title),x,y,{width,lineGap:3});y=d.y+20;
 paragraph(`${b.start||'Dates to be confirmed'} to ${b.end||'Dates to be confirmed'}  |  ${b.travellers} traveller(s)`,11);
 ensure(115);d.roundedRect(x,y,width,105,15).fill(green);d.fillColor('#cbd9cc').font('Helvetica').fontSize(10).text('TOTAL PACKAGE PRICE - ALL TRAVELLERS',64,y+18);d.fillColor('#ffffff').font('Helvetica-Bold').fontSize(27).text(money(b.total),64,y+40);d.font('Helvetica').fontSize(9).text('Quotation valid until '+q.validUntil,64,y+79);y+=127;
 paragraph('Quotation '+b.reference+'. This is a proposal, not a booking confirmation.',9);
 page();section('Your journey',q.intro);section('Route & overnight stays',q.route);section('Accommodation',q.hotels);section('Day-by-day itinerary',q.itinerary);section('Included in your package',q.includes);section('Not included',q.excludes);
 page();section('Your package investment',`Total package price for ${b.travellers} traveller(s): ${money(b.total)}\nAlready received: ${money(b.paid)}\nRemaining booking balance: ${money(b.balance)}`);section('Pricing & taxes',q.pricingNote);
 section('Payment schedule',installments.map(i=>`${i.label}: ${money(i.amount)} | Paid: ${money(i.paid)} | Due: ${i.due||'As agreed'} | ${i.status}`).join('\n'));
 if(payment){ensure(106);d.roundedRect(x,y,width,51,10).fill(orange);d.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text('PAY '+money(payment.amount-payment.paid)+' & BOOK',x,y+18,{width,align:'center',link:payment.url});d.link(x,y,width,51,payment.url);y+=65;paragraph('Secure Razorpay payment for '+payment.label+(payment.expires?'. Link expires '+payment.expires.slice(0,10):'. No link expiry is recorded')+'. If unavailable, contact us for an updated quotation and payment link.',9);}else section('How to confirm','Contact Bucketlist Adventure for an active payment link. No payable link is included in this quotation.');
 section('Booking terms',q.terms);section('Quotation validity','Valid until '+q.validUntil+'. Services remain subject to availability and your agreed booking terms. Payment status can change after this PDF is issued.');
 const range=d.bufferedPageRange();for(let i=range.start;i<range.start+range.count;i++){d.switchToPage(i);d.moveTo(x,782).lineTo(551,782).strokeColor('#d6dbd2').stroke();d.font('Helvetica').fontSize(8).fillColor(muted).text('Bucketlist Adventure | We Plan It. You Live It.',x,795,{width:360}).text(`${i+1} / ${range.count}`,500,795,{width:51,align:'right'});d.text('bookings@bucketlistadventure.in | bucketlistadventure.in',x,808,{width:460});}
 d.end();
 }catch(e){reject(e);d.end();}
});}
