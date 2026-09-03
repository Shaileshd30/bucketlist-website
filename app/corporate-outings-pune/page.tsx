import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = "https://bucketlistadventure.in";
const PAGE_URL = `${BASE_URL}/corporate-outings-pune`;

export const metadata: Metadata = {
  title: "Corporate Outings in Pune | Team Building & Offsites",
  description:
    "Plan corporate outings in Pune with team building activities, adventure experiences, one-day outings and customized corporate offsites by Bucketlist Adventure.",
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title:
      "Corporate Outings in Pune | Team Building & Offsites | Bucketlist Adventure",
    description:
      "Customized corporate outings, outdoor team building activities, adventure experiences and corporate offsites in and around Pune.",
    url: PAGE_URL,
    siteName: "Bucketlist Adventure",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Corporate Outings in Pune | Team Building & Offsites | Bucketlist Adventure",
    description:
      "Plan one-day corporate outings, team building activities and customized corporate offsites in Pune.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const WHATSAPP_URL =
  "https://wa.me/918482846287?text=Hi%20Bucketlist%20Adventure%2C%20I%20am%20planning%20a%20corporate%20outing%20in%20Pune.%20Please%20share%20the%20options.";

const experiences = [
  {
    number: "01",
    title: "One-Day Corporate Outings",
    text: "A practical escape from the office with activities, meals, travel coordination and a complete day plan built around your team.",
  },
  {
    number: "02",
    title: "Team Building Activities",
    text: "Outdoor challenges, collaborative games and engaging experiences designed to encourage communication, participation and teamwork.",
  },
  {
    number: "03",
    title: "Adventure & Trek Outings",
    text: "Take the team beyond the usual resort day with guided treks, nature trails and adventure-led experiences around the Sahyadris.",
  },
  {
    number: "04",
    title: "Corporate Offsites",
    text: "Overnight programs combining work, downtime and shared experiences, with planning support for stays, meals, activities and logistics.",
  },
  {
    number: "05",
    title: "Leadership & Team Experiences",
    text: "Purposeful outdoor formats for teams that want a more immersive shared experience beyond conventional indoor sessions.",
  },
  {
    number: "06",
    title: "Customized Group Programs",
    text: "Tell us your group size, objective, budget and preferred date. We build the outing around your requirements instead of forcing a fixed package.",
  },
];

const planningSteps = [
  {
    number: "01",
    title: "Tell us about your team",
    text: "Share your preferred date, approximate group size, budget, duration and what you want the outing to achieve.",
  },
  {
    number: "02",
    title: "We curate the experience",
    text: "We shortlist suitable destinations, activities and a practical plan based on your group profile and requirements.",
  },
  {
    number: "03",
    title: "We coordinate the details",
    text: "Depending on the program, we can coordinate transport, meals, activity flow, outdoor experiences and on-ground logistics.",
  },
  {
    number: "04",
    title: "Your team lives it",
    text: "Your employees arrive with the plan already organized, leaving the team free to participate, connect and enjoy the experience.",
  },
];

const destinationIdeas = [
  {
    title: "Mulshi & Lakeside Escapes",
    text: "A strong choice for relaxed one-day outings, nature-led programs and teams looking to get away from the city without an overly long journey.",
  },
  {
    title: "Lonavala & Nearby Hills",
    text: "Popular for corporate offsites, monsoon landscapes, outdoor activities and easy access from both Pune and Mumbai.",
  },
  {
    title: "Tamhini & Sahyadri Outdoors",
    text: "Ideal when the team wants forests, trails, waterfalls and a more adventure-oriented experience, especially during the green season.",
  },
  {
    title: "Fort & Trek Experiences",
    text: "For active teams, a guided trek or fort experience can turn the outing into a shared challenge rather than a conventional resort visit.",
  },
];

const faqs = [
  {
    question: "What types of corporate outings do you organize in Pune?",
    answer:
      "Bucketlist Adventure can plan one-day corporate outings, outdoor team building programs, adventure and trekking experiences, overnight offsites and customized group programs. The exact format is planned around your team size, objective, budget and preferred date.",
  },
  {
    question: "Can you arrange team building activities in Pune?",
    answer:
      "Yes. Team building activities can be incorporated into a corporate outing based on the venue, available space, group size and the kind of participation you want. We can plan activity-led programs as part of the overall outing.",
  },
  {
    question: "Do you offer budget-friendly team building activities?",
    answer:
      "Yes. The budget depends on group size, destination, transport, meals, venue and activities. If you share an approximate per-person or overall budget, we can suggest a practical program instead of adding unnecessary elements.",
  },
  {
    question: "Can you organize a one-day corporate outing near Pune?",
    answer:
      "Yes. One-day outings are suitable for teams that want an experience without an overnight stay. Depending on the destination, a program can include transport, breakfast or meals, team activities, an outdoor experience and return travel.",
  },
  {
    question: "Can you plan an outing for a large corporate group?",
    answer:
      "Yes. Corporate programs can be planned for different group sizes, subject to the capacity and suitability of the selected venue or destination. Share the approximate headcount early so the logistics and activity format can be planned appropriately.",
  },
  {
    question: "Do you provide transport for corporate outings from Pune?",
    answer:
      "Transport can be included depending on the program. Pickup planning, vehicle requirements and timing are finalized according to the group size, destination and itinerary.",
  },
  {
    question: "Can the corporate outing be customized?",
    answer:
      "Yes. Customized planning is one of the main advantages of working with Bucketlist Adventure. The destination, activities, meals, travel, duration and overall flow can be designed around your team's requirements.",
  },
];

function createStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Corporate Outings in Pune",
            item: PAGE_URL,
          },
        ],
      },
      {
        "@type": "Service",
        "@id": `${PAGE_URL}#service`,
        name: "Corporate Outings & Team Building in Pune",
        serviceType: "Corporate Outings and Team Building Activities",
        provider: {
          "@type": "Organization",
          name: "Bucketlist Adventure",
          url: BASE_URL,
        },
        areaServed: {
          "@type": "City",
          name: "Pune",
        },
        url: PAGE_URL,
        description:
          "Customized corporate outings, team building activities, adventure experiences and corporate offsites in and around Pune.",
      },
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

export default function CorporateOutingsPunePage() {
  const structuredData = createStructuredData();

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#17251d] px-6 py-20 text-white sm:py-24 lg:px-10 lg:py-28">
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border border-white/5" />
        <div className="absolute -right-12 -top-12 h-[260px] w-[260px] rounded-full border border-white/5" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex text-sm font-semibold text-orange-300 transition hover:text-white"
          >
            ← Back to Bucketlist Adventure
          </Link>

          <p className="mt-12 text-xs font-bold uppercase tracking-[0.3em] text-orange-300">
            Pune • Team Building • Corporate Experiences
          </p>

          <h1 className="mt-5 max-w-5xl text-4xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-5xl lg:text-7xl">
            Corporate outings in Pune
            <span className="block text-white/40">
              your team will actually remember.
            </span>
          </h1>

          <p className="mt-7 max-w-3xl text-base leading-8 text-white/65 sm:text-lg">
            From one-day corporate outings and outdoor team building activities
            to adventure experiences and overnight offsites, we plan the
            details so your team can focus on connecting, participating and
            enjoying the day.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-400"
            >
              Plan Your Corporate Outing ↗
            </a>

            <a
              href="#experiences"
              className="inline-flex rounded-full border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#17251d]"
            >
              Explore Experiences ↓
            </a>
          </div>

          <div className="mt-14 grid grid-cols-2 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] sm:grid-cols-4">
            {[
              ["Planning", "End-to-End"],
              ["Programs", "Customized"],
              ["Base", "Pune"],
              ["Approach", "Safety First"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-b border-r border-white/10 p-5 last:border-r-0 sm:border-b-0"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {label}
                </p>
                <p className="mt-2 text-lg font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="px-6 py-16 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              Beyond the office
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              More than just
              <span className="block">a day away from work.</span>
            </h2>
          </div>

          <div className="space-y-5 text-[15px] leading-8 text-[#5d6862] sm:text-base">
            <p>
              A good corporate outing should give people a reason to interact
              beyond their usual roles. Pune makes that possible with quick
              access to hills, lakes, resorts, Sahyadri landscapes and outdoor
              experiences suited to different kinds of teams.
            </p>

            <p>
              Bucketlist Adventure plans corporate outings in Pune around the
              people attending — not around a one-size-fits-all package. Whether
              you want a relaxed team day, budget-friendly team building
              activities, an adventure outing or an overnight corporate
              offsite, the program can be shaped around your objective.
            </p>

            <p>
              We Plan It. You Live It. Share your requirements and we&apos;ll
              help turn them into a practical experience with the right
              destination, flow and logistics.
            </p>
          </div>
        </div>
      </section>

      {/* EXPERIENCES */}
      <section
        id="experiences"
        className="scroll-mt-10 bg-white px-6 py-20 lg:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              Corporate experiences
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Build the outing around
              <span className="block">what your team needs.</span>
            </h2>
            <p className="mt-5 text-base leading-8 text-[#5d6862]">
              From a simple one-day break to an adventure-led offsite, we can
              shape the format around your people, time and budget.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {experiences.map((experience) => (
              <InfoCard
                key={experience.number}
                number={experience.number}
                title={experience.title}
                text={experience.text}
              />
            ))}
          </div>
        </div>
      </section>

      {/* WHY BUCKETLIST */}
      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid overflow-hidden rounded-[32px] border border-black/10 bg-white lg:grid-cols-2">
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                Why Bucketlist Adventure
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                One team.
                <span className="block">One coordinated experience.</span>
              </h2>

              <p className="mt-5 text-sm leading-7 text-[#5d6862]">
                Instead of coordinating multiple pieces separately, work with
                one planning team for the overall experience. The exact
                inclusions depend on your chosen program, but the goal remains
                simple: make the outing easier for the organizer and better for
                the participants.
              </p>
            </div>

            <div className="bg-[#17251d] p-8 text-white sm:p-10 lg:p-12">
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  ["Destination Planning", "Options matched to your team and schedule."],
                  ["Transport Coordination", "Travel planning based on group logistics."],
                  ["Meals & Program Flow", "A practical itinerary for the complete day."],
                  ["Outdoor Experiences", "Adventure and nature-led options where suitable."],
                  ["Group Coordination", "Planning that considers the needs of larger teams."],
                  ["Customized Approach", "Built around your objective instead of a fixed template."],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-white px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                You bring the team.
                <span className="block">We build the plan.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-[#5d6862]">
                A simple planning process keeps the outing aligned with your
                requirements from the first conversation.
              </p>
            </div>

            <div className="space-y-4">
              {planningSteps.map((step) => (
                <article
                  key={step.number}
                  className="grid gap-4 rounded-[24px] border border-black/10 bg-[#f5f3ee] p-6 sm:grid-cols-[70px_1fr] sm:p-7"
                >
                  <span className="text-sm font-bold tracking-[0.2em] text-orange-500">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#5d6862]">
                      {step.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              Around Pune
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Choose the setting
              <span className="block">that fits your team.</span>
            </h2>
            <p className="mt-5 text-base leading-8 text-[#5d6862]">
              The right destination depends on travel time, season, activities,
              group size and whether you want a relaxed outing or a more active
              outdoor experience.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {destinationIdeas.map((destination) => (
              <article
                key={destination.title}
                className="rounded-[26px] border border-black/10 bg-white p-7 sm:p-8"
              >
                <h3 className="text-2xl font-bold tracking-tight">
                  {destination.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#5d6862]">
                  {destination.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SAMPLE DAY */}
      <section className="bg-[#17251d] px-6 py-20 text-white lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                Example format
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                A one-day corporate
                <span className="block text-white/35">outing can look like this.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
                This is only an example. Actual timings and activities are
                customized according to your destination and requirements.
              </p>
            </div>

            <div className="space-y-3">
              {[
                ["Morning", "Departure from Pune & breakfast"],
                ["Late Morning", "Welcome, briefing & energizer activities"],
                ["Midday", "Team building challenges / outdoor experience"],
                ["Afternoon", "Lunch, leisure & group engagement"],
                ["Evening", "Wrap-up and return journey to Pune"],
              ].map(([time, activity]) => (
                <div
                  key={time}
                  className="grid gap-2 rounded-[22px] border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-[140px_1fr] sm:items-center"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                    {time}
                  </span>
                  <span className="text-sm leading-6 text-white/75">
                    {activity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BUDGET */}
      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid overflow-hidden rounded-[32px] border border-black/10 bg-white lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                Planning to a budget
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Budget-friendly doesn&apos;t have to mean basic.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#5d6862]">
                A corporate outing budget is influenced by group size,
                destination, transport, meals, venue, activities and whether
                the program is one-day or overnight. Give us your approximate
                budget and priorities, and we can focus the plan on the
                elements that matter most to your team.
              </p>
            </div>

            <div className="flex flex-col justify-center bg-[#efece5] p-8 sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#17251d]/45">
                Helpful details to share
              </p>
              <div className="mt-5 space-y-3 text-sm font-semibold">
                {[
                  "Preferred date",
                  "Approximate group size",
                  "Budget range",
                  "One-day or overnight",
                  "Team building / adventure preference",
                  "Transport requirement",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                Corporate outings from Pune
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently asked questions.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-[#5d6862]">
                Useful answers for HR teams, administrators and organizers
                planning a corporate outing or team building program.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-[22px] border border-black/10 bg-white px-5 py-5"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-5 font-semibold">
                    <span>{faq.question}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5f3ee] text-lg transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 border-t border-black/10 pt-4 text-sm leading-7 text-[#5d6862]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 pb-20 lg:px-10">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#17251d] p-8 text-white sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                Start planning
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Tell us about your team.
                <span className="block text-white/35">
                  We&apos;ll plan the experience.
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">
                Send us your preferred date, group size, approximate budget and
                the kind of outing you have in mind. We&apos;ll help you work
                out the next step.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-400"
              >
                Enquire on WhatsApp ↗
              </a>

              <Link
                href="/contact"
                className="rounded-full border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold transition hover:bg-white hover:text-[#17251d]"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[26px] border border-black/10 bg-[#f5f3ee] p-7">
      <span className="text-xs font-bold tracking-[0.2em] text-orange-500">
        {number}
      </span>
      <h3 className="mt-6 text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#5d6862]">{text}</p>
    </article>
  );
}
