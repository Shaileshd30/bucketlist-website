export const reviewUrl = 'https://www.google.com/search?q=bucketlist+adventure#lrd=0x3bc2bf2b17902bb1:0x4c1a5b103ad209c7,3,,,,';
export const instagramUrl = 'https://www.instagram.com/bucketlistadventuure/';
export function indiaDate(now = new Date()) {
 const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const get = (key:string) => parts.find(p => p.type === key)!.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
export function dateOffset(date:string, days:number) {
 return new Date(Date.parse(date+'T00:00:00Z') + days*86400000).toISOString().slice(0,10);
}
export function emailValid(value:string) { return /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value); }
export function whatsappUrl(phone:string, message:string) {
 let number=phone.replace(/\D/g,''); if(number.length===10) number='91'+number;
 return /^[1-9]\d{7,14}$/.test(number) ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
export function reviewMessage(name:string, title:string) {
 return `Dear ${name},\n\nThank you for choosing Bucketlist Adventure for ${title}. It was a pleasure to be part of your journey, and we hope you returned with wonderful memories and stories to cherish.\n\nEvery journey we plan means a great deal to our team. If you have a moment, we would be grateful if you could share an honest review of your experience. Your words help fellow travellers choose their next adventure and help us understand what we can do even better.\n\nShare your experience on Google:\n${reviewUrl}\n\nWe would also love to see the journey through your eyes! Follow us on Instagram and, if you share your photos or videos, please tag @bucketlistadventuure so we can celebrate those memories with you.\n${instagramUrl}\n\nThank you for placing your trust in us. We look forward to welcoming you on another adventure.\n\nWarm regards,\nTeam Bucketlist Adventure\nWe Plan It. You Live It.`;
}
export function renderReminder(subject:string, message:string) {
 const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const body=esc(message).replace(esc(reviewUrl),`<a href="${esc(reviewUrl)}" style="color:#d94b0b;font-weight:bold">Share your experience on Google</a>`).replace(esc(instagramUrl),`<a href="${instagramUrl}" style="color:#d94b0b">Follow Bucketlist Adventure on Instagram</a>`).replace(/\n/g,'<br>');
 return `<!doctype html><html><body style="margin:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#17251d"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px;background:white;border-radius:18px" cellpadding="0" cellspacing="0"><tr><td style="padding:28px;background:#17251d;border-radius:18px 18px 0 0"><img src="cid:booking-logo@bucketlistadventure.in" width="150" alt="Bucketlist Adventure" style="display:block;max-width:150px;height:auto"><p style="color:#fff;font-size:13px">We Plan It. You Live It.</p></td></tr><tr><td style="padding:30px"><h1 style="font-size:24px;line-height:1.3">${esc(subject)}</h1><div style="font-size:15px;line-height:1.8">${body}</div></td></tr><tr><td style="padding:22px 30px;background:#f5f3ee;font-size:12px;line-height:1.8">Bucketlist Adventure · Pune<br><a href="mailto:bookings@bucketlistadventure.in">bookings@bucketlistadventure.in</a> · <a href="https://bucketlistadventure.in">bucketlistadventure.in</a></td></tr></table></td></tr></table></body></html>`;
}
