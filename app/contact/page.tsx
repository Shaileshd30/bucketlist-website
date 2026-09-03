import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Bucketlist Adventure for trekking, Himalayan expeditions, weekend adventures, customized tours and travel enquiries.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">
      {/* HERO */}
      <section className="bg-[#17251d] px-6 py-20 text-white sm:py-24 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="text-sm font-semibold text-orange-300 transition hover:text-white"
          >
            ← Back to Bucketlist Adventure
          </Link>

          <p className="mt-12 text-xs font-bold uppercase tracking-[0.3em] text-orange-300">
            Get In Touch
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-7xl">
            Your next adventure
            <span className="block text-white/40">starts with a conversation.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/60">
            Planning a trek, expedition, group journey or customized holiday?
            Talk to the Bucketlist Adventure team and we&apos;ll help you plan
            the experience.
          </p>
        </div>
      </section>

      {/* CONTACT DETAILS */}
      <section className="px-6 py-16 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* BUSINESS DETAILS */}
            <div className="rounded-[32px] border border-black/10 bg-white p-7 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                Visit Us
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Bucketlist Adventure
              </h2>

              <p className="mt-2 text-sm font-semibold text-[#7b8580]">
                Bucketlist Destinations
              </p>

              <div className="mt-8 space-y-2 text-[16px] leading-7 text-[#5d6862]">
                <p>U7/C7, Runwal Platinum</p>
                <p>NDA Pashan Road, Bavdhan</p>
                <p>Pune, Maharashtra – 411021</p>
                <p>India</p>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Runwal+Platinum+NDA+Pashan+Road+Bavdhan+Pune+411021"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex rounded-full bg-[#17251d] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                View on Google Maps ↗
              </a>
            </div>

            {/* CONTACT */}
            <div className="rounded-[32px] bg-[#17251d] p-7 text-white sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-300">
                Talk To Us
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                We&apos;re here to help.
              </h2>

              <div className="mt-10 space-y-4">
                <ContactItem
  label="Phone"
  value="+91 84828 46287"
  href="tel:+918482846287"
/>

<ContactItem
  label="WhatsApp"
  value="+91 84828 46287"
  href="https://wa.me/918482846287"
  external
/>

                <ContactItem
                  label="Email"
                  value="bucketlistdestinations2@gmail.com"
                  href="mailto:bucketlistdestinations2@gmail.com"
                />
              </div>

              <a
                href="https://wa.me/919225531257?text=Hi%20Bucketlist%20Adventure%2C%20I%20would%20like%20to%20plan%20a%20trip."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex rounded-full bg-orange-500 px-7 py-4 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Plan Your Adventure ↗
              </a>
            </div>
          </div>

          {/* SUPPORT */}
          <div className="mt-6 rounded-[32px] border border-black/10 bg-white p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                  Customer Support
                </p>

                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                  Booking or payment query?
                </h2>
              </div>

              <div className="text-[15px] leading-7 text-[#5d6862]">
                <p>
                  For questions regarding bookings, payments, cancellations,
                  refunds or trip arrangements, contact Bucketlist Adventure
                  using the phone, WhatsApp or email details provided above.
                </p>

                <p className="mt-4">
                  When contacting us regarding an existing booking, please
                  include your name and relevant trip details so our team can
                  assist you efficiently.
                </p>
              </div>
            </div>
          </div>

          {/* LEGAL LINKS */}
          <div className="mt-6 rounded-[32px] border border-black/10 bg-[#ece9e1] p-7 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
              Policies
            </p>

            <h2 className="mt-4 text-2xl font-bold tracking-tight">
              Booking with Bucketlist Adventure
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5d6862]">
              Please review our policies before confirming your booking or
              making a payment.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/terms-and-conditions"
                className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold transition hover:border-[#17251d]"
              >
                Terms & Conditions ↗
              </Link>

              <Link
                href="/cancellation-policy"
                className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold transition hover:border-[#17251d]"
              >
                Cancellation & Refund Policy ↗
              </Link>

              <Link
                href="/privacy-policy"
                className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold transition hover:border-[#17251d]"
              >
                Privacy Policy ↗
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactItem({
  label,
  value,
  href,
  external = false,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block rounded-[22px] border border-white/10 p-5 transition hover:bg-white/5"
    >
      <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-orange-300">
        {label}
      </span>

      <span className="mt-2 block break-words text-base font-semibold sm:text-lg">
        {value} ↗
      </span>
    </a>
  );
}