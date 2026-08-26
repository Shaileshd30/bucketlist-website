import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = "https://bucketlistadventure.in";

export const metadata: Metadata = {
  title: "About Us | Our Story & Adventure Philosophy",

  description:
    "Discover the story of Bucketlist Adventure, founded by Ruturaj and Pranita in 2017. We create thoughtfully planned treks, expeditions and travel experiences across India and beyond.",

  alternates: {
    canonical: `${BASE_URL}/about`,
  },

  openGraph: {
    title: "About Bucketlist Adventure",
    description:
      "Founded in 2017, Bucketlist Adventure creates thoughtfully planned trekking, expedition and travel experiences.",
    url: `${BASE_URL}/about`,
    siteName: "Bucketlist Adventure",
    locale: "en_IN",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },
};

const values = [
  {
    number: "01",
    title: "Thoughtful Planning",
    text: "A memorable adventure begins long before reaching the trail. Routes, logistics, timing and the overall experience deserve careful planning.",
  },
  {
    number: "02",
    title: "Safety First",
    text: "Adventure involves uncertainty. Preparation, responsible decisions and respect for changing conditions remain central to how we approach every journey.",
  },
  {
    number: "03",
    title: "Meaningful Experiences",
    text: "Travel should be more than checking a destination off a list. We want every journey to leave you with stories, friendships and experiences worth remembering.",
  },
  {
    number: "04",
    title: "Responsible Travel",
    text: "The mountains and communities that make travel possible deserve respect. We encourage responsible behaviour and greater awareness while exploring.",
  },
];

const experiences = [
  "Weekend Treks",
  "Himalayan Treks",
  "Expeditions",
  "Road Trips",
  "Backpacking",
  "Camping",
  "Corporate Outings",
  "Customized Trips",
];

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",

    "@graph": [
      {
        "@type": "BreadcrumbList",
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
            name: "About",
            item: `${BASE_URL}/about`,
          },
        ],
      },

      {
        "@type": "Organization",
        name: "Bucketlist Adventure",
        url: BASE_URL,
        foundingDate: "2017",
        founder: [
          {
            "@type": "Person",
            name: "Ruturaj",
          },
          {
            "@type": "Person",
            name: "Pranita",
          },
        ],
        description:
          "Bucketlist Adventure is an adventure travel company creating thoughtfully planned treks, expeditions and travel experiences.",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#17251d] px-6 py-20 text-white sm:py-24 lg:px-10 lg:py-32">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full border border-white/5" />

        <div className="absolute -right-16 -top-16 h-[300px] w-[300px] rounded-full border border-white/5" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex text-sm font-semibold text-orange-300 transition hover:text-white"
          >
            ← Back to home
          </Link>

          <p className="mt-14 text-xs font-bold uppercase tracking-[0.3em] text-orange-300">
            Our Story • Since 2017
          </p>

          <h1 className="mt-5 max-w-5xl text-5xl font-bold leading-[0.92] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
            We plan it.
            <span className="block text-white/35">
              You live it.
            </span>
          </h1>

          <p className="mt-8 max-w-3xl text-base leading-8 text-white/65 sm:text-lg">
            Bucketlist Adventure was founded in 2017 by Ruturaj and
            Pranita with a simple idea — make meaningful adventures
            easier for people to experience.
          </p>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              How it started
            </p>

            <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">
              From an idea
              <span className="block text-[#8a958e]">
                to an adventure community.
              </span>
            </h2>
          </div>

          <div className="space-y-6 text-base leading-8 text-[#5d6862]">
            <p>
              Bucketlist Adventure began in 2017 when Ruturaj and
              Pranita set out to create travel experiences where people
              could spend less time worrying about the planning and more
              time actually experiencing the journey.
            </p>

            <p>
              What began with adventure and exploration at its heart has
              grown into experiences ranging from weekend treks and
              mountain trails to Himalayan journeys, road trips,
              expeditions, group adventures and customized travel.
            </p>

            <p>
              But the idea behind Bucketlist Adventure remains simple:
              thoughtful planning should make travel feel easier without
              taking away the excitement, uncertainty and discovery that
              make an adventure memorable.
            </p>

            <p className="font-semibold text-[#17251d]">
              That philosophy eventually became the words that define
              us — We Plan It. You Live It.
            </p>
          </div>
        </div>
      </section>

      {/* 2017 STATEMENT */}
      <section className="px-6 pb-20 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.06)]">
          <div className="grid lg:grid-cols-[0.7fr_1.3fr]">
            <div className="flex min-h-[300px] flex-col justify-between bg-orange-500 p-8 text-white sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">
                Founded
              </p>

              <p className="text-7xl font-bold tracking-[-0.06em] sm:text-8xl">
                2017
              </p>
            </div>

            <div className="flex items-center p-8 sm:p-10 lg:p-14">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                  Ruturaj & Pranita
                </p>

                <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Built around a shared love for experiences worth
                  remembering.
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-8 text-[#5d6862]">
                  From its beginning, Bucketlist Adventure has been
                  about helping people move beyond routine and experience
                  something different — a trail, a mountain, a journey
                  or simply a weekend that becomes a story.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE BELIEVE */}
      <section className="bg-white px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              What guides us
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Adventure with intention.
            </h2>

            <p className="mt-5 text-base leading-8 text-[#5d6862]">
              The destination matters, but how you experience it matters
              just as much.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {values.map((value) => (
              <article
                key={value.number}
                className="rounded-[28px] border border-black/10 bg-[#f5f3ee] p-7 sm:p-8"
              >
                <span className="text-xs font-bold tracking-[0.22em] text-orange-500">
                  {value.number}
                </span>

                <h3 className="mt-8 text-2xl font-bold tracking-tight">
                  {value.title}
                </h3>

                <p className="mt-4 max-w-xl text-sm leading-7 text-[#5d6862]">
                  {value.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCES */}
      <section className="px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                What we do
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                Different journeys.
                <span className="block text-[#8a958e]">
                  The same spirit.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-8 text-[#5d6862]">
                From a one-day escape to a longer mountain journey, our
                experiences are built around getting people outside,
                exploring and making their bucket lists real.
              </p>

              <Link
                href="/trips"
                className="mt-8 inline-flex rounded-full bg-[#17251d] px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                Explore Our Trips ↗
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {experiences.map((experience, index) => (
                <div
                  key={experience}
                  className={`flex min-h-[120px] items-end rounded-[24px] border border-black/10 p-5 sm:min-h-[145px] sm:p-6 ${
                    index === 1 || index === 4
                      ? "bg-[#17251d] text-white"
                      : "bg-white"
                  }`}
                >
                  <p className="text-base font-bold sm:text-lg">
                    {experience}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY BUCKETLIST */}
      <section className="bg-[#17251d] px-6 py-20 text-white lg:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                The Bucketlist way
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                You bring the curiosity.
                <span className="block text-white/35">
                  We take care of the planning.
                </span>
              </h2>
            </div>

            <div className="space-y-5 text-base leading-8 text-white/65">
              <p>
                Great travel should feel exciting, not overwhelming.
                That is why our role begins before the journey itself —
                understanding the experience, planning the logistics and
                bringing the pieces together.
              </p>

              <p>
                Once the journey begins, the goal is different: be
                present, meet people, experience the landscape and come
                home with stories that could never have been created
                from behind a screen.
              </p>
            </div>
          </div>

          <div className="mt-16 border-t border-white/10 pt-12">
            <p className="max-w-5xl text-4xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Not every journey needs to change your life.
              <span className="text-white/30">
                {" "}But it should give you something worth remembering.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* EXPLORE */}
      <section className="px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/treks-near-pune"
              className="group rounded-[30px] border border-black/10 bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl sm:p-10"
            >
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                Weekend adventures
              </p>

              <h3 className="mt-4 text-3xl font-bold">
                Treks Near Pune
              </h3>

              <p className="mt-4 text-sm leading-7 text-[#5d6862]">
                Explore forts, waterfalls and Sahyadri trails close to
                the city.
              </p>

              <span className="mt-8 inline-block font-bold transition group-hover:text-orange-500">
                Explore Pune Treks ↗
              </span>
            </Link>

            <Link
              href="/himalayan-treks-india"
              className="group rounded-[30px] bg-[#17251d] p-8 text-white transition hover:-translate-y-1 hover:shadow-xl sm:p-10"
            >
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-300">
                Into the mountains
              </p>

              <h3 className="mt-4 text-3xl font-bold">
                Himalayan Adventures
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/60">
                Discover Himalayan treks, expeditions and high-altitude
                journeys.
              </p>

              <span className="mt-8 inline-block font-bold transition group-hover:text-orange-300">
                Explore Himalayas ↗
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 pb-20 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-orange-500 p-8 text-white sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">
                Start exploring
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                What&apos;s on your bucket list?
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/80">
                Find an upcoming adventure or tell us what kind of
                journey you&apos;re looking for.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/trips"
                className="rounded-full bg-[#17251d] px-6 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#17251d]"
              >
                Explore Trips
              </Link>

              <a
                href="https://wa.me/919225531257?text=Hi%20Bucketlist%20Adventure%2C%20I%20would%20like%20to%20know%20more%20about%20your%20trips."
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/30 px-6 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-orange-600"
              >
                Talk to Us ↗
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}