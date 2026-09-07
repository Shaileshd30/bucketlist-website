"use client";

import Image from "next/image";

const contact = {
  name: "Ruturaj Agawane",
  designation: "Founder",
  phoneDisplay: "+91 92255 31257",
  phone: "+919225531257",
  email: "ruturaj@bucketlistadventure.in",
  website: "https://bucketlistadventure.in/",
  address: "The Office Club, Runwal Platinum, Bavdhan, Pune, Maharashtra, India 411021",
};

const links = {
  whatsapp:
    "https://wa.me/919225531257?text=Hello%20Ruturaj%2C%20I%20would%20like%20to%20know%20more%20about%20Bucketlist%20Adventure.",
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

type ActionIconName =
  | "phone"
  | "whatsapp"
  | "email"
  | "website";

function ActionIcon({
  name,
}: {
  name: ActionIconName;
}) {
  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92Z" />
      </svg>
    );
  }

  if (name === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.38 8.38 0 0 1 12.5 3h.5a8.48 8.48 0 0 1 8 8v.5Z" />
        <path d="M9 8.5c.7 2.5 2 3.8 4.5 4.5" />
      </svg>
    );
  }

  if (name === "email") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function Action({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ActionIconName;
  label: string;
}) {
  return (
    <a
      className="quickAction"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <span aria-hidden="true">
        <ActionIcon name={icon} />
      </span>
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
            className="brandLogo"
            src="/bucketlist-logo.png"
            alt="Bucketlist Adventure"
            width={320}
            height={182}
            priority
          />
          <div className="avatarRing">
            <Image
              className="avatar"
              src="/images/team/ruturaj.jpg"
              alt="Ruturaj Agawane"
              fill
              priority
              sizes="120px"
            />
          </div>
          <div className="identity">
            <p>{contact.designation}</p>
            <h1>{contact.name}</h1>
            <span>We Plan It. You Live It.</span>
          </div>
        </section>

        <section className="content">
          <div className="actionGrid" aria-label="Contact actions">
            <Action href={`tel:${contact.phone}`} icon="phone" label="Call" />
            <Action href={links.whatsapp} icon="whatsapp" label="WhatsApp" />
            <Action href={`mailto:${contact.email}`} icon="email" label="Email" />
            <Action href={contact.website} icon="website" label="Website" />
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
        :global(.quickAction) { display: grid; justify-items: center; gap: 9px; color: #17251d; text-decoration: none; }
        :global(.quickAction > span) { display: grid; width: 49px; height: 49px; place-items: center; border-radius: 50%; background: #f28c28; color: white; box-shadow: 0 8px 18px rgba(242,140,40,.26); }
        :global(.quickAction svg) { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
        :global(.quickAction small) { font-size: 11px; font-weight: 750; }
        .pageShell { min-height: 100svh; padding: 28px 14px; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .digitalCard { width: min(100%, 520px); margin: 0 auto; overflow: hidden; border-radius: 34px; background: #fffdf8; box-shadow: 0 28px 80px rgba(23,37,29,.18); }
        .hero { position: relative; height: 510px; background: radial-gradient(circle at 72% 15%, #31513f 0, #17251d 46%, #0c1711 100%); overflow: hidden; }
        .hero::after { content: ""; position: absolute; width: 340px; height: 340px; right: -150px; top: -120px; border: 1px solid rgba(242,140,40,.22); border-radius: 50%; box-shadow: 0 0 0 55px rgba(242,140,40,.035), 0 0 0 110px rgba(242,140,40,.025); }
        .brandLogo { position: absolute; top: 70px; left: 50%; width: min(66%, 310px); height: auto; object-fit: contain; transform: translateX(-50%); filter: drop-shadow(0 12px 28px rgba(0,0,0,.22)); }
        .avatarRing { position: absolute; right: 24px; bottom: 24px; z-index: 2; width: 120px; height: 120px; overflow: hidden; border: 4px solid #f28c28; border-radius: 50%; background: #fff; box-shadow: 0 12px 30px rgba(0,0,0,.32); }
        :global(.avatar) { object-fit: cover; object-position: center 38%; transform: scale(2.15); }
        .identity { position: absolute; left: 28px; right: 28px; bottom: 28px; z-index: 2; color: white; }
        .identity p { margin: 0 0 8px; color: #ffb36a; font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        .identity h1 { max-width: calc(100% - 140px); margin: 0; font-size: clamp(32px, 8vw, 42px); line-height: 1; letter-spacing: -.04em; }
        .identity span { display: block; margin-top: 13px; color: rgba(255,255,255,.82); font-size: 15px; }
        .content { padding: 0 24px 28px; }
        .actionGrid { position: relative; display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: -1px; padding: 18px 0; border-bottom: 1px solid #e7e0d5; }
        .quickAction { display: grid; justify-items: center; gap: 9px; color: #17251d; text-decoration: none; }
        .quickAction > span { display: grid; width: 49px; height: 49px; place-items: center; border-radius: 50%; background: #f28c28; color: white; box-shadow: 0 8px 18px rgba(242,140,40,.26); }
        .quickAction svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
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
