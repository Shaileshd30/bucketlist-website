'use client';
import {useEffect,useState} from 'react';

type Props={bookingId:string;customer:string;phone?:string;title:string;reference?:string;disabled?:boolean};
export default function QuotationShare({bookingId,customer,phone='',title,reference='quotation',disabled=false}:Props){
 const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [recipient,setRecipient]=useState(phone);
 useEffect(()=>{setRecipient(phone);},[phone]);
 useEffect(()=>{setFile(null);setNotice('');},[bookingId,disabled]);
 const message='Hello '+customer+',\n\nPlease find your personalised quotation for '+title+'. Please review the itinerary, accommodation and payment terms.\n\nBucketlist Adventure\nWe Plan It. You Live It.';
 let digits=recipient.replace(/[^0-9]/g,'');
 if(digits.startsWith('00'))digits=digits.slice(2);
 if(digits.length===11&&digits.startsWith('0'))digits=digits.slice(1);
 if(digits.length===10)digits='91'+digits;
 const validPhone=/^[1-9][0-9]{7,14}$/.test(digits);
 const whatsapp=validPhone?'https://wa.me/'+digits+'?text='+encodeURIComponent(message):'';
 async function prepare(){
  if(busy||disabled)return;setBusy(true);setNotice('');
  try{
   const r=await fetch('/api/custom-bookings/'+encodeURIComponent(bookingId)+'/quotation?format=pdf',{cache:'no-store'});
   if(!r.ok){const j=await r.json();throw Error(j.error||'Unable to prepare PDF.');}
   if(!r.headers.get('content-type')?.includes('application/pdf'))throw Error('Your session may have expired. Sign in and try again.');
   const blob=await r.blob();
   const name=reference.replace(/[^A-Za-z0-9_-]/g,'-')+'-quotation.pdf';
   setFile(new File([blob],name,{type:'application/pdf'}));
   setNotice('PDF ready. Check the customer number, then send via WhatsApp.');
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to prepare PDF.');}finally{setBusy(false);}
 }
 function download(){
  if(!file)return;
  const url=URL.createObjectURL(file),a=document.createElement('a');
  a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 async function share(){
  if(!file||disabled)return;
  // Called on a separate click so native sharing retains user activation.
  if(navigator.share&&navigator.canShare?.({files:[file]})){
   try{await navigator.share({files:[file],title:'Bucketlist Adventure quotation',text:message});setNotice('Share menu closed. Check WhatsApp to confirm delivery.');}
   catch(e){if(e instanceof Error&&e.name==='AbortError')return;setNotice('Device sharing is unavailable. Download the PDF and open WhatsApp below.');}
  }else{
   if(!validPhone){setNotice('Enter the customer WhatsApp number with country code.');return;}
   download();window.open(whatsapp,'_blank','noopener,noreferrer');
   setNotice('Attach the downloaded PDF in the WhatsApp chat, then press Send. If the chat did not open, use Open WhatsApp below.');
  }
 }
 return <div style={{display:'grid',gap:10,marginTop:14,maxWidth:'100%'}}>
  <button type="button" disabled={disabled||busy} onClick={()=>void prepare()}>{busy?'Preparing PDF…':file?'Refresh sharing PDF':'Prepare WhatsApp quotation'}</button>
  {file&&!disabled&&<>
   <label>Customer WhatsApp number<input type="tel" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="+91…" style={{display:'block',maxWidth:'100%'}}/></label>
   <button type="button" onClick={()=>void share()}>Send via WhatsApp</button>
   <button type="button" onClick={download}>Download PDF to attach</button>
   {whatsapp&&<a href={whatsapp} target="_blank" rel="noopener noreferrer">Open WhatsApp with message</a>}
   <small>On the device share menu, choose WhatsApp and the recipient. On desktop, attach the downloaded PDF yourself. Nothing is sent until you confirm in WhatsApp.</small>
  </>}
  {notice&&<p role="status">{notice}</p>}
 </div>;
}
