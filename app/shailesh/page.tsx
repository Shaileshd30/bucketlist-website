"use client";

import Image from "next/image";

const contact = {
  name: "Shailesh Deshmukh",
  designation: "Director – Strategy & Business Development",
  phoneDisplay: "+91 84828 46287",
  phone: "+918482846287",
  email: "bucketlistdestinations2@gmail.com",
  website: "https://bucketlistadventure.in/",
  address: "The Office Club, Runwal Platinum, Bavdhan, Pune, Maharashtra, India 411021",
};

const links = {
  whatsapp:
    "https://wa.me/918482846287?text=Hello%20Shailesh%2C%20I%20would%20like%20to%20know%20more%20about%20Bucketlist%20Adventure.",
  instagram: "https://www.instagram.com/bucketlistadventuure/",
  facebook: "https://m.facebook.com/bucketlistadventures2018/",
  reviews: "https://share.google/Q9k66ci3TGFVHkuOl",
  maps:
    "https://www.google.com/maps/search/?api=1&query=The%20Office%20Club%20Runwal%20Platinum%20Bavdhan%20Pune%20411021",
};

function downloadContact() {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Deshmukh;Shailesh;;;",
    "FN:Shailesh Deshmukh",
    "ORG:Bucketlist Adventure",
    "TITLE:Director - Strategy & Business Development",
    `TEL;TYPE=CELL,VOICE:${contact.phone}`,
    `TEL;TYPE=CELL,WHATSAPP:${contact.phone}`,
    `EMAIL;TYPE=INTERNET:${contact.email}`,
    `URL:${contact.website}`,
    `ADR;TYPE=WORK:;;The Office Club, Runwal Platinum;Bavdhan, Pune;Maharashtra;411021;India`,
    "NOTE:We Plan It. You Live It.",
    "END:VCARD",
  ].join("\r\n");

  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "Shailesh-Deshmukh-Bucketlist-Adventure.vcf";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function shareCard() {
  const shareData = {
    title: "Shailesh Deshmukh | Bucketlist Adventure",
    text: "Connect with Shailesh Deshmukh at Bucketlist Adventure — We Plan It. You Live It.",
    url: "https://bucketlistadventure.in/shailesh",
  };

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  await navigator.clipboard.writeText(shareData.url);
  window.alert("Card link copied!");
}

const services = [
  "Weekend Treks",
  "Himalayan Expeditions",
  "Backpacking Trips",
  "Family Holidays",
  "Corporate Outings",
  "Customized Tours",
];

function Action({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a className="quickAction" href={href} target="_blank" rel="noreferrer">
      <span aria-hidden="true">{icon}</span>
      <small>{label}</small>
    </a>
  );
}

export default function ShaileshDigitalCard() {
  return (
    <main className="pageShell">
      <article className="digitalCard">
        <section className="hero">
          <Image
            className="portrait"
            src="/images/team/shailesh.jpg"
            alt="Shailesh Deshmukh"
            fill
            priority
            sizes="(max-width: 720px) 100vw, 520px"
          />
          <div className="heroShade" />
          <Image
            className="brandLogo"
            src="/bucketlist-logo.png"
            alt="Bucketlist Adventure"
            width={176}
            height={100}
            priority
          />
          <div className="identity">
            <p>{contact.designation}</p>
            <h1>{contact.name}</h1>
            <span>We Plan It. You Live It.</span>
          </div>
        </section>

        <section className="content">
          <div className="actionGrid" aria-label="Contact actions">
            <Action href={`tel:${contact.phone}`} icon="☎" label="Call" />
            <Action href={links.whatsapp} icon="◉" label="WhatsApp" />
            <Action href={`mailto:${contact.email}`} icon="✉" label="Email" />
            <Action href={contact.website} icon="↗" label="Website" />
          </div>

          <div className="primaryActions">
            <button type="button" onClick={downloadContact}>＋ Save Contact</button>
            <button type="button" className="secondary" onClick={shareCard}>↗ Share Card</button>
          </div>

          <section className="intro">
            <p className="eyebrow">Bucketlist Adventure</p>
            <h2>Memorable journeys, thoughtfully planned.</h2>
            <p>
              Adventure tours, group departures and customized travel experiences
              designed with local insight and a safety-first approach.
            </p>
            <div className="trustRow">
              <strong>10,000+</strong><span>Happy travellers</span>
              <i />
              <strong>Safety-first</strong><span>Experiences</span>
            </div>
          </section>

          <section className="services">
            <p className="eyebrow">What we plan</p>
            <div>{services.map((service) => <span key={service}>{service}</span>)}</div>
          </section>

          <section className="details">
            <a href={`tel:${contact.phone}`}><b>Call</b><span>{contact.phoneDisplay}</span></a>
            <a href={`mailto:${contact.email}`}><b>Email</b><span>{contact.email}</span></a>
            <a href={links.maps} target="_blank" rel="noreferrer"><b>Office</b><span>{contact.address}</span></a>
          </section>

          <section className="socials">
            <a href={links.instagram} target="_blank" rel="noreferrer">Instagram</a>
            <a href={links.facebook} target="_blank" rel="noreferrer">Facebook</a>
            <a href={links.reviews} target="_blank" rel="noreferrer">Google Reviews</a>
          </section>

          <footer>Bucketlist Adventure · Pune, India</footer>
        </section>
      </article>

      <style jsx>{`
        :global(*) { box-sizing: border-box; }
        :global(body) { margin: 0; background: #eee9df; color: #17251d; }
        :global(button), :global(a) { font: inherit; }
        .pageShell { min-height: 100svh; padding: 28px 14px; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .digitalCard { width: min(100%, 520px); margin: 0 auto; overflow: hidden; border-radius: 34px; background: #fffdf8; box-shadow: 0 28px 80px rgba(23,37,29,.18); }
        .hero { position: relative; height: 510px; background: #17251d; overflow: hidden; }
        .portrait { object-fit: cover; object-position: center 28%; }
        .heroShade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(3,11,7,.08) 10%, rgba(3,11,7,.05) 45%, rgba(3,11,7,.94) 100%); }
        .brandLogo { position: absolute; top: 24px; left: 24px; width: 142px; height: auto; object-fit: contain; filter: drop-shadow(0 6px 20px rgba(0,0,0,.18)); }
        .identity { position: absolute; left: 28px; right: 28px; bottom: 28px; color: white; }
        .identity p { margin: 0 0 8px; color: #ffb36a; font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        .identity h1 { margin: 0; font-size: clamp(35px, 9vw, 48px); line-height: .98; letter-spacing: -.04em; }
        .identity span { display: block; margin-top: 13px; color: rgba(255,255,255,.82); font-size: 15px; }
        .content { padding: 0 24px 28px; }
        .actionGrid { position: relative; display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: -1px; padding: 18px 0; border-bottom: 1px solid #e7e0d5; }
        .quickAction { display: grid; justify-items: center; gap: 7px; color: #17251d; text-decoration: none; }
        .quickAction > span { display: grid; width: 49px; height: 49px; place-items: center; border-radius: 50%; background: #f28c28; color: white; font-size: 20px; font-weight: 800; box-shadow: 0 8px 18px rgba(242,140,40,.26); }
        .quickAction small { font-size: 11px; font-weight: 750; }
        .primaryActions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 18px 0 8px; }
        .primaryActions button { min-height: 50px; border: 0; border-radius: 15px; background: #17251d; color: white; font-weight: 800; cursor: pointer; }
        .primaryActions .secondary { border: 1px solid #d9d0c3; background: white; color: #17251d; }
        .intro, .services, .details { padding: 24px 0; border-bottom: 1px solid #e7e0d5; }
        .eyebrow { margin: 0 0 8px !important; color: #e97f1a !important; font-size: 11px !important; font-weight: 850; letter-spacing: .16em; text-transform: uppercase; }
        .intro h2 { margin: 0; font-size: 29px; line-height: 1.08; letter-spacing: -.035em; }
        .intro > p { color: #627068; font-size: 14px; line-height: 1.65; }
        .trustRow { display: grid; grid-template-columns: auto 1fr 1px auto 1fr; gap: 7px; align-items: center; margin-top: 18px; font-size: 11px; }
        .trustRow strong { color: #17251d; font-size: 14px; }
        .trustRow span { color: #6c776f; }
        .trustRow i { width: 1px; height: 32px; background: #ded6ca; }
        .services > div { display: flex; flex-wrap: wrap; gap: 8px; }
        .services span { border-radius: 999px; background: #ede9df; padding: 9px 12px; font-size: 12px; font-weight: 700; }
        .details { display: grid; gap: 17px; }
        .details a { display: grid; gap: 4px; color: #17251d; text-decoration: none; }
        .details b { color: #e97f1a; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
        .details span { font-size: 13px; line-height: 1.45; }
        .socials { display: flex; justify-content: space-between; gap: 10px; padding: 22px 0; }
        .socials a { color: #17251d; font-size: 12px; font-weight: 800; text-decoration: none; }
        footer { color: #7b847e; font-size: 11px; text-align: center; }
        @media (max-width: 420px) {
          .pageShell { padding: 0; }
          .digitalCard { border-radius: 0; box-shadow: none; }
          .hero { height: 465px; }
          .content { padding-inline: 18px; }
          .identity { left: 22px; right: 22px; }
          .trustRow { grid-template-columns: auto 1fr; }
          .trustRow i { display: none; }
        }
      `}</style>
    </main>
  );
}
