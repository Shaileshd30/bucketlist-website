"use client";

import Image from "next/image";
import { useEffect } from "react";
import gsap from "gsap";
export default function Home() {
    useEffect(() => {
    const elements = document.querySelectorAll(
      ".hero-tag, .hero-title, .hero-description, .hero-button, .hero-stats"
    );

    gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      }
    );
  }, []);
  
  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">

      {/* NAVIGATION */}
      <header className="hero-nav absolute top-0 left-0 z-50 w-full">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6 lg:px-10">

          <div className="relative h-10 w-32 sm:h-16 sm:w-52">

            <Image
             src="/bucketlist-logo.png"
             alt="Bucketlist Adventure"
             fill
             priority
             className="object-contain object-left"
             />
</div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white md:flex">
            <a href="#destinations" className="transition hover:text-orange-400">
              Destinations
            </a>
            <a href="#adventures" className="transition hover:text-orange-400">
              Adventures
            </a>
            <a href="#about" className="transition hover:text-orange-400">
              About
            </a>
            <a href="#contact" className="transition hover:text-orange-400">
              Contact
            </a>
          </nav>

          <details className="relative sm:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-md transition hover:border-white/50">
              <span className="text-2xl leading-none">☰</span>
            </summary>

            <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl bg-black/90 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col gap-1 text-sm font-medium text-white">
                <a href="#destinations" className="rounded-xl px-4 py-3 hover:bg-white/10">
                  Destinations
                </a>
                <a href="#adventures" className="rounded-xl px-4 py-3 hover:bg-white/10">
                  Adventures
                </a>
                <a href="#about" className="rounded-xl px-4 py-3 hover:bg-white/10">
                  About
                </a>
                <a href="#contact" className="rounded-xl px-4 py-3 hover:bg-white/10">
                  Contact
                </a>

                <a
                  href="https://wa.me/918482846287"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 rounded-xl bg-[#f28c28] px-4 py-3 text-center font-semibold text-white transition hover:bg-[#d97706]"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </details>

          <a
            href="https://wa.me/918482846287"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-[#f28c28] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d97706] sm:inline-flex"
          >
            WhatsApp Us
          </a>
        </div>
      </header>


      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden sm:items-end">

        {/* Background Image */}
        <div
          className="hero-bg absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=90')",
          }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-16 lg:px-10 lg:pb-24">

          <div className="max-w-5xl">

            <p className="hero-tag mt-6 mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-orange-400 sm:mt-0 sm:mb-5 sm:text-sm sm:tracking-[0.35em]">
              Trekking • Adventures • Experiences
            </p>

            <h1 className="hero-title max-w-4xl text-4xl font-bold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-[92px]">
  WE PLAN IT.
  <span className="block">
    YOU LIVE IT.
  </span>
</h1>

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">

              <p className="hero-description max-w-xl text-base leading-7 text-white/80 sm:text-lg">
                Discover handpicked treks, mountain journeys, and immersive experiences
                crafted for people who want to travel deeper, farther, and more meaningfully.
              </p>

              <a
                 href="#adventures"
                 className="hero-button relative z-20 inline-flex w-fit rounded-full bg-white px-7 py-4 text-sm font-bold text-[#17251d] opacity-100 transition hover:bg-orange-400 hover:text-white"
              >
                Explore Adventures
                <span className="ml-3 text-lg">↗</span>
              </a>

            </div>
          </div>

          {/* Bottom Info */}
          <div className="hero-stats mt-16 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/20 pt-6 text-sm text-white/70">

            <span>
              <strong className="text-white">10,000+</strong> Travelers
            </span>

            <span>
              <strong className="text-white">6000M+</strong> Expeditions
            </span>

            <span>
              <strong className="text-white">Everest</strong> Base Camp
            </span>

            <span>
              <strong className="text-white">Safety</strong> First
            </span>

          </div>

        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 hidden flex-col items-center gap-3 text-white/60 lg:flex">
          <span className="text-[10px] uppercase tracking-[0.3em]">
            Scroll
          </span>
          <div className="h-12 w-px bg-white/40" />
        </div>

      </section>


      {/* INTRODUCTION */}
      <section id="about" className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">

          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.3em] text-orange-500">
              The Bucketlist Way
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Adventure is not a destination.
              <br />
              <span className="text-[#718078]">
                It is a story you live.
              </span>
            </h2>
          </div>

          <div className="flex items-end">
            <p className="max-w-xl text-lg leading-8 text-[#5d6862]">
              From the rugged trails of the Sahyadris to the high-altitude landscapes of
              Ladakh and the Himalayas, Bucketlist Adventure crafts meaningful journeys that
              take you farther, connect you with the landscape, and leave you with stories
              worth keeping.
            </p>
          </div>

        </div>

      </section>


      {/* DESTINATIONS */}
      <section
        id="destinations"
        className="bg-[#17251d] px-6 py-24 text-white lg:px-10 lg:py-32"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
                Explore
              </p>

              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Where will you go
                <br />
                <span className="text-white/40">next?</span>
              </h2>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <p className="max-w-xl text-base leading-7 text-white/65">
                From weekend escapes to Himalayan expeditions, discover journeys shaped by
                terrain, story, and the kind of memories that stay with you long after the trail ends.
              </p>

              <a
                href="#adventures"
                className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-orange-400 hover:bg-orange-500 hover:text-white"
              >
                View all trips
                <span className="ml-2 text-base">↗</span>
              </a>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                name: "Sahyadri",
                region: "Western Ghats",
                description:
                  "Cloud forests, fort trails, and hidden waterfalls for quick escapes and memorable climbs.",
                image:
                  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
                duration: "1–3 days",
                vibe: "Weekend reset",
              },
              {
                name: "Himalayas",
                region: "High altitude",
                description:
                  "Epic ridgelines, remote camps, and glacier views designed for serious mountain lovers.",
                image:
                  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
                duration: "4–9 days",
                vibe: "Expedition",
              },
              {
                name: "Ladakh",
                region: "Cold desert",
                description:
                  "Moonland landscapes, monasteries, and Himalayan roads for a cinematic mountain journey.",
                image:
                  "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85",
                duration: "6–10 days",
                vibe: "Road trip",
              },
              {
                name: "Kashmir",
                region: "Valleys & lakes",
                description:
                  "Alpine lakes, meadow trails, and gentle mountain culture framed by unforgettable scenery.",
                image:
                  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=85",
                duration: "5–8 days",
                vibe: "Scenic escape",
              },
              {
                name: "Nepal",
                region: "Everest horizon",
                description:
                  "Classic trekking routes, warm hospitality, and high camp adventures built for discovery.",
                image:
                  "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=85",
                duration: "7–12 days",
                vibe: "Classic trek",
              },
            ].map((destination) => (
              <a
                href="#adventures"
                key={destination.name}
                className="group relative block min-h-[480px] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.18)] transition duration-500 hover:-translate-y-1 hover:border-orange-300/70"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${destination.image}')`,
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#07150f]/90 via-[#07150f]/25 to-transparent" />

                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                  <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
                    {destination.region}
                  </span>

                  <span className="text-[10px] uppercase tracking-[0.25em] text-orange-300">
                    {destination.vibe}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                  <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-white/60">
                    Best for {destination.duration}
                  </p>

                  <h3 className="text-3xl font-bold text-white sm:text-[2rem]">
                    {destination.name}
                  </h3>

                  <p className="mt-3 max-w-xs text-sm leading-6 text-white/75">
                    {destination.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-300">
                      {destination.duration}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#17251d] transition group-hover:bg-orange-400 group-hover:text-white">
                      Explore
                      <span aria-hidden="true">↗</span>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>


      {/* UPCOMING ADVENTURES */}
      <section
        id="adventures"
        className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32"
      >
        <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-orange-500">
              Upcoming
            </p>

            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Adventures worth
              <br />
              <span className="text-[#8a958e]">leaving home for.</span>
            </h2>
          </div>

          <a
            href="#contact"
            className="inline-flex w-fit items-center rounded-full border border-[#17251d]/15 bg-[#17251d]/5 px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
          >
            Plan a custom trip
            <span className="ml-2 text-base">↗</span>
          </a>
        </div>

        <div className="divide-y divide-black/10 border-y border-black/10">
          {[
            {
              number: "01",
              title: "Kusur Plateau",
              region: "Sahyadri",
              duration: "1 Day",
              detail: "Sunrise climb + valley views + a quick forest trail.",
            },
            {
              number: "02",
              title: "Harishchandragad",
              region: "Sahyadri",
              duration: "2 Days",
              detail: "Fort basecamp, ridge trails, and a memorable night under the stars.",
            },
            {
              number: "03",
              title: "Leh Ladakh",
              region: "Himalayas",
              duration: "9 Days",
              detail: "High passes, mountain roads, and vast desert terrain across the Indian Himalayas.",
            },
            {
              number: "04",
              title: "Spiti Valley",
              region: "Himachal",
              duration: "8 Days",
              detail: "Remote villages, dramatic passes, and timeless alpine landscapes.",
            },
          ].map((trip) => (
            <div
              key={trip.number}
              className="group flex flex-col gap-5 py-8 transition duration-300 hover:px-2 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-5 sm:gap-6">
                <span className="text-sm font-medium text-black/30">{trip.number}</span>

                <div>
                  <h3 className="text-2xl font-bold md:text-3xl">{trip.title}</h3>
                  <p className="mt-1 text-sm text-black/50">{trip.region}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                <div className="max-w-md">
                  <p className="text-sm leading-6 text-black/60">{trip.detail}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-black/50">{trip.duration}</span>

                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 text-lg transition group-hover:bg-[#17251d] group-hover:text-white">
                    ↗
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* CORPORATE CTA */}
      <section
        id="contact"
        className="relative overflow-hidden bg-[#e8e1d4] px-6 py-24 lg:px-10 lg:py-32"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="mb-5 text-sm font-bold uppercase tracking-[0.3em] text-orange-500">
                Corporate Adventures
              </p>

              <h2 className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
                Take your team
                <br />
                <span className="text-[#718078]">beyond the office.</span>
              </h2>
            </div>

            <a
              href="https://wa.me/918482846287"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center rounded-full bg-[#17251d] px-7 py-4 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              Plan a Corporate Adventure
              <span className="ml-2 text-base">↗</span>
            </a>
          </div>

          <div className="mt-10 flex flex-col gap-6 border-t border-[#17251d]/10 pt-8 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-lg leading-8 text-[#5d6862]">
              Tailored adventure experiences, team outings, and unforgettable journeys designed
              around your people, your pace, and the kind of memories your team will talk about for years.
            </p>

            <div className="grid grid-cols-2 gap-6 text-left text-sm text-[#5d6862] sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                  Team builds
                </p>
                <p className="mt-2 font-semibold text-[#17251d]">Adventure</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                  Best for
                </p>
                <p className="mt-2 font-semibold text-[#17251d]">Retreats</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                  Experience
                </p>
                <p className="mt-2 font-semibold text-[#17251d]">Custom</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="bg-[#17251d] px-6 py-28 text-center text-white lg:px-10 lg:py-40">

        <p className="mb-5 text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
          Your story starts here
        </p>

        <h2 className="mx-auto max-w-5xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
          WHERE WILL YOUR
          <br />
          NEXT CHAPTER
          <br />
          <span className="text-orange-400">BEGIN?</span>
        </h2>

        <a
          href="#adventures"
          className="mt-10 inline-flex rounded-full bg-white px-8 py-4 font-semibold text-[#17251d] transition hover:bg-orange-400 hover:text-white"
        >
          Explore Adventures ↗
        </a>

      </section>


      {/* FOOTER */}
      <footer className="bg-[#101812] px-6 py-10 text-white lg:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="text-xl font-bold tracking-[0.08em]">BUCKETLIST</div>
            <div className="mt-1 text-[10px] tracking-[0.35em] text-white/50">
              ADVENTURE
            </div>
          </div>

          <p className="text-sm text-white/45">We Plan It. You Live It.</p>

          <p className="text-sm text-white/45">
            © {new Date().getFullYear()} Bucketlist Adventure
          </p>
        </div>
      </footer>

    </main>
  );
}