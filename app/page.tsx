"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  defaultTrips,
  travelCategories,
  type TripData,
} from "./data/trips";

type GoogleReviewData = {
  rating: number;
  text: string;
  relativeTime: string;

  author: {
    name: string;
    profileUrl: string;
    photoUrl: string;
  };

  googleMapsUri: string;
};

type GoogleReviewsResponse = {
  place: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    googleMapsUri: string;
  };

  reviews: GoogleReviewData[];
};

export default function Home() {
  const [trips, setTrips] =
    useState<TripData[]>(defaultTrips);

  const [featuredTrip, setFeaturedTrip] =
    useState<TripData>(defaultTrips[0]);

  const [googleReviews, setGoogleReviews] =
    useState<GoogleReviewsResponse | null>(null);

  const [googleReviewsLoading, setGoogleReviewsLoading] =
    useState(true);

  const [heroVideoReady, setHeroVideoReady] =
    useState(false);

  const [heroVideoFailed, setHeroVideoFailed] =
    useState(false);

  const heroVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const getLowestActivePrice = (
    tripList: TripData[]
  ) => {
    const prices = tripList
      .flatMap((trip) => trip.batches || [])
      .filter(
        (batch) =>
          batch.visibility === "PUBLIC" &&
          batch.status === "OPEN" &&
          batch.bookingEnabled &&
          Number(batch.price) > 0
      )
      .map((batch) => Number(batch.price));

    if (prices.length === 0) {
      return null;
    }

    return Math.min(...prices);
  };

  const getLowestCategoryPrice = (
    category: NonNullable<TripData["travelCategory"]>
  ) => {
    return getLowestActivePrice(
      trips.filter(
        (trip) =>
          trip.travelCategory === category
      )
    );
  };

  const lowestAdventurePrice =
    getLowestActivePrice(trips);

  const featuredLowestPrice =
    getLowestActivePrice([featuredTrip]);

  const formatPrice = (
    price: number
  ) =>
    `₹${price.toLocaleString("en-IN")}`;

  /*
   * Load live trips from the API.
   */
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const response = await fetch(
          "/api/trips?summary=1",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          setFeaturedTrip(
            defaultTrips.find(
              (trip) => trip.featured
            ) ?? defaultTrips[0]
          );
          return;
        }

        const data = await response.json();

        if (
          Array.isArray(data) &&
          data.length > 0
        ) {
          const liveTrips =
            data as TripData[];

          setTrips(liveTrips);

          const featured =
            liveTrips.find(
              (trip) => trip.featured
            ) ??
            liveTrips[0] ??
            defaultTrips[0];

          setFeaturedTrip(featured);
        }
      } catch (error) {
        console.error(
          "Unable to load trips:",
          error
        );

        setFeaturedTrip(
          defaultTrips.find(
            (trip) => trip.featured
          ) ?? defaultTrips[0]
        );
      }
    };

    loadFeatured();
  }, []);

  /*
   * Load live Google Maps reviews.
   */
  useEffect(() => {
    const loadGoogleReviews = async () => {
      try {
        const response = await fetch(
          "/api/google-reviews",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (
          data?.ok &&
          data?.place &&
          Array.isArray(
            data.reviews
          )
        ) {
          setGoogleReviews(
            data as GoogleReviewsResponse
          );
        }
      } catch (error) {
        console.error(
          "Unable to load Google Reviews:",
          error
        );
      } finally {
        setGoogleReviewsLoading(
          false
        );
      }
    };

    loadGoogleReviews();
  }, []);

  /*
   * Hero entrance animation.
   */
  useEffect(() => {
    const elements =
      document.querySelectorAll(
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

  /*
   * Scroll-scrub masked typography.
   * The imagery moves inside oversized words while the section stays pinned.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector<HTMLElement>(".scrollcraft-mask-section");
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scenes = gsap.utils.toArray<HTMLElement>(".scrollcraft-scene");

    if (reduceMotion) {
      scenes.forEach((scene, index) => {
        gsap.set(scene, {
          opacity: index === 0 ? 1 : 0,
          visibility: index === 0 ? "visible" : "hidden",
        });
      });
      return;
    }

    const ctx = gsap.context(() => {
      scenes.forEach((scene, index) => {
        gsap.set(scene, {
          opacity: index === 0 ? 1 : 0,
          visibility: index === 0 ? "visible" : "hidden",
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => (window.innerWidth < 640 ? "+=220%" : "+=320%"),
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      scenes.forEach((scene, index) => {
        const media = scene.querySelector<HTMLElement>(".scrollcraft-media");
        const word = scene.querySelector<HTMLElement>(".scrollcraft-word");
        const copy = scene.querySelector<HTMLElement>(".scrollcraft-copy");

        if (index > 0) {
          tl.set(scene, { visibility: "visible" }, index)
            .to(scene, { opacity: 1, duration: 0.18, ease: "none" }, index);
        }

        if (media) {
          tl.fromTo(
            media,
            { scale: 1.16, xPercent: -3, yPercent: -3 },
            { scale: 1.02, xPercent: 3, yPercent: 3, duration: 0.78, ease: "none" },
            index
          );
        }

        if (word) {
          tl.fromTo(
            word,
            { scale: 0.94 },
            { scale: 1, duration: 0.72, ease: "none" },
            index
          );
        }

        if (copy) {
          tl.fromTo(
            copy,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.25, ease: "none" },
            index + 0.08
          ).to(
            copy,
            { y: -20, opacity: 0, duration: 0.18, ease: "none" },
            index + 0.68
          );
        }

        if (index < scenes.length - 1) {
          tl.to(
            scene,
            { opacity: 0, duration: 0.18, ease: "none" },
            index + 0.78
          );
        }
      });
    }, section);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  /*
   * Keep the cinematic hero reliable across Chrome, mobile emulation
   * and production browsers. The media can be downloaded successfully
   * while the visual state still remains on the poster if "loadedData"
   * is not the event that fires first. We therefore also react to
   * metadata/canplay/playing and explicitly ask the muted video to play.
   */
  useEffect(() => {
    const video = heroVideoRef.current;

    if (!video || heroVideoFailed) {
      return;
    }

    video.muted = true;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        // Keep the poster visible if autoplay is blocked.
      }
    };

    tryPlay();
  }, [heroVideoFailed]);

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">

      {/* PREMIUM CINEMATIC VIDEO HERO */}
<section
  className="relative min-h-[100svh] overflow-hidden bg-[#0b1510] text-white"
  style={{
    position: "relative",
    minHeight: "100svh",
    overflow: "hidden",
    backgroundColor: "#0b1510",
    color: "white",
  }}
>

  {/*
   * Stable hero fallback.
   *
   * This image is visible immediately while the video is loading and remains
   * visible if the browser cannot play the video. Critical positioning is also
   * duplicated with inline styles so a delayed stylesheet cannot make the
   * media expand into the page.
   */}
  <div
    aria-hidden="true"
    className="absolute inset-0"
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
    }}
  >
    <Image
      src="/images/about/about-expedition.jpg"
      alt=""
      fill
      priority
      fetchPriority="high"
      className="object-cover object-center"
      sizes="100vw"
    />
  </div>

  {/* Background video */}
  {!heroVideoFailed && (
    <video
      ref={heroVideoRef}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
        heroVideoReady ? "opacity-100" : "opacity-0"
      }`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: heroVideoReady ? 1 : 0,
      }}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/images/about/about-expedition.jpg"
      onLoadedMetadata={() => setHeroVideoReady(true)}
      onLoadedData={() => setHeroVideoReady(true)}
      onCanPlay={() => setHeroVideoReady(true)}
      onPlaying={() => setHeroVideoReady(true)}
      onError={() => {
        setHeroVideoReady(false);
        setHeroVideoFailed(true);
      }}
    >
      <source src="/videos/hero-adventure.mp4" type="video/mp4" />
    </video>
  )}

  {/* Cinematic overlays */}
  <div className="absolute inset-0 bg-black/10" />
  <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent sm:from-black/45" />
  <div className="absolute inset-0 bg-gradient-to-t from-[#07120d]/75 via-transparent to-black/10" />

  {/* NAVIGATION */}
  <header className="absolute inset-x-0 top-0 z-30">
    <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-7">

      {/* Logo */}
      <a
        href="/"
        className="relative block h-12 w-40 sm:h-14 sm:w-44 lg:h-16 lg:w-52"
        
      >
        <Image
          src="/bucketlist-logo.png"
          alt="Bucketlist Adventure"
          fill
          priority
          className="object-contain object-left"
          sizes="(max-width: 640px) 160px, (max-width: 1024px) 176px, 208px"
        />
      </a>

      {/* Desktop nav */}
      <nav className="hidden items-center gap-8 rounded-full border border-white/15 bg-black/10 px-7 py-3 text-sm font-medium text-white/90 backdrop-blur-md lg:flex">
        <a
          href="/about"
          className="transition hover:text-orange-400"
        >
          About
        </a>

        <a
          href="#destinations"
          className="transition hover:text-orange-400"
        >
          Destinations
        </a>

        <a
          href="#adventures"
          className="transition hover:text-orange-400"
        >
          Adventures
        </a>

        <a
          href="#contact"
          className="transition hover:text-orange-400"
        >
          Contact
        </a>
      </nav>

      <div className="flex items-center gap-3">

        {/* Desktop / tablet CTA */}
        <a
          href="https://wa.me/918482846287"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white hover:text-[#17251d] sm:inline-flex"
        >
          Plan a Trip
          <span className="ml-2">↗</span>
        </a>

        {/* Mobile menu */}
        <details className="group relative lg:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/20 bg-black/25 text-lg text-white backdrop-blur-md">
            ☰
          </summary>

          <div className="absolute right-0 top-14 w-[260px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0b1510]/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col text-sm font-semibold text-white">

              <a
                href="/about"
                className="rounded-xl px-4 py-3 transition hover:bg-white/10"
              >
                About
              </a>

              <a
                href="#destinations"
                className="rounded-xl px-4 py-3 transition hover:bg-white/10"
              >
                Destinations
              </a>

              <a
                href="#adventures"
                className="rounded-xl px-4 py-3 transition hover:bg-white/10"
              >
                Adventures
              </a>

              <a
                href="#contact"
                className="rounded-xl px-4 py-3 transition hover:bg-white/10"
              >
                Contact
              </a>

              <div className="my-2 border-t border-white/10" />

              <a
                href="https://wa.me/918482846287"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-orange-500 px-4 py-3 text-center font-bold text-white"
              >
                Plan a Trip ↗
              </a>

            </div>
          </div>
        </details>

      </div>
    </div>
  </header>

  {/* HERO CONTENT */}
  <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-[1400px] items-end px-5 pb-5 pt-24 sm:px-6 sm:pb-8 sm:pt-32 lg:px-10 lg:pb-12">

    <div className="w-full">

      <div className="max-w-5xl">

        <p className="hero-tag mb-4 text-[10px] font-bold uppercase tracking-[0.26em] text-orange-300 sm:mb-5 sm:text-sm sm:tracking-[0.36em]">
          Treks • Expeditions • Journeys
        </p>

        <h1 className="hero-title max-w-5xl text-[46px] font-bold leading-[0.9] tracking-[-0.055em] text-white min-[390px]:text-[52px] sm:text-7xl lg:text-[96px] xl:text-[108px]">
          We plan it.
          <span className="block text-white/70">
            You live it.
          </span>
        </h1>

        <p className="hero-description mt-4 max-w-2xl text-[13px] leading-[1.65] text-white/75 sm:mt-7 sm:text-lg sm:leading-8">
          Thoughtfully designed treks, expeditions and journeys across India and beyond —
          built around extraordinary places and unforgettable experiences.
        </p>

        {/* Hero buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">

          <a
            href="/trips"
            className="hero-button inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-4 text-sm font-bold text-[#17251d] transition duration-300 hover:bg-orange-400 hover:text-white sm:w-auto sm:px-7"
          >
            Explore Adventures
            <span className="ml-3 text-lg">↗</span>
          </a>

          <a
            href="https://wa.me/918482846287"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:bg-white hover:text-[#17251d] sm:w-auto sm:px-7"
          >
            Plan a Custom Trip
          </a>

        </div>
      </div>

      {/* MOBILE / DESKTOP TRUST BAR */}
      <div className="hero-stats mt-6 grid grid-cols-2 overflow-hidden rounded-[22px] border border-white/15 bg-black/25 backdrop-blur-xl sm:mt-10 sm:grid-cols-4 lg:mt-12">

        <div className="p-4 sm:p-5">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/45 sm:text-[10px] sm:tracking-[0.22em]">
            Adventures from
          </p>

          <p className="mt-2 text-lg font-bold sm:text-2xl">
            {lowestAdventurePrice
              ? formatPrice(lowestAdventurePrice)
              : "Explore"}
          </p>
        </div>

        <div className="border-l border-white/10 p-4 sm:p-5">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/45 sm:text-[10px] sm:tracking-[0.22em]">
            Travellers
          </p>

          <p className="mt-2 text-lg font-bold sm:text-2xl">
            10,000+
          </p>
        </div>

        <div className="border-t border-white/10 p-4 sm:border-l sm:border-t-0 sm:p-5">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/45 sm:text-[10px] sm:tracking-[0.22em]">
            High altitude
          </p>

          <p className="mt-2 text-lg font-bold sm:text-2xl">
            6000M+
          </p>
        </div>

        <div className="border-l border-t border-white/10 p-4 sm:border-t-0 sm:p-5">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/45 sm:text-[10px] sm:tracking-[0.22em]">
            Our approach
          </p>

          <p className="mt-2 text-lg font-bold sm:text-2xl">
            Safety First
          </p>
        </div>

      </div>

    </div>
  </div>

  {/* Desktop discover line */}
  <div className="absolute bottom-10 right-10 z-20 hidden items-center gap-4 text-white/55 xl:flex">
    <span className="text-[9px] font-bold uppercase tracking-[0.3em]">
      Discover
    </span>

    <span className="block h-px w-16 bg-white/40" />
  </div>

</section>

      {/* ABOUT / OUR STORY */}
<section
  id="about"
  className="relative overflow-hidden bg-[#f5f3ee] px-6 py-20 sm:py-24 lg:px-10 lg:py-36"
>
  <div className="mx-auto max-w-[1400px]">

    {/* Top editorial story */}
    <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">

      {/* LEFT CONTENT */}
      <div>
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-orange-500">
          The Bucketlist Way
        </p>

        <h2 className="max-w-3xl text-4xl font-bold leading-[0.96] tracking-[-0.045em] text-[#17251d] sm:text-5xl lg:text-7xl">
          Adventure,
          <span className="block text-[#8a958e]">
            thoughtfully planned.
          </span>
        </h2>

        <h3 className="mt-8 max-w-2xl text-2xl font-semibold leading-tight text-[#17251d] sm:text-3xl">
          Memories,
          <span className="text-orange-500">
            {" "}entirely yours.
          </span>
        </h3>

        <p className="mt-7 max-w-xl text-lg leading-8 text-[#5d6862]">
          Bucketlist Adventure creates thoughtfully designed treks,
          expeditions and journeys for travellers who want more than
          just another holiday.
        </p>

        <p className="mt-5 max-w-xl text-base leading-7 text-[#718078]">
          From weekend escapes in the Sahyadris to high-altitude
          Himalayan expeditions and immersive journeys across India
          and beyond, every experience is built around careful planning,
          authentic places, responsible travel and a safety-first approach.
        </p>

        <p className="mt-5 max-w-xl text-base leading-7 text-[#718078]">
          We take care of the routes, logistics, stays, transport and
          on-ground coordination — so you can be fully present for what
          really matters: the journey itself.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="#adventures"
            className="inline-flex items-center rounded-full bg-[#17251d] px-6 py-4 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            Explore our journeys
            <span className="ml-3">↗</span>
          </a>

          <a
            href="#contact"
            className="inline-flex items-center rounded-full border border-[#17251d]/15 bg-white px-6 py-4 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
          >
            Talk to our team
          </a>
        </div>
      </div>

      {/* RIGHT IMAGE STORY */}
      <div className="relative pb-16 sm:pb-20">

        {/* Main expedition image */}
        <div className="relative min-h-[500px] overflow-hidden rounded-[34px] shadow-[0_35px_100px_rgba(0,0,0,0.12)] sm:min-h-[620px]">

          <Image
            src="/images/about/about-expedition.jpg"
            loading="lazy"
            alt="Bucketlist Adventure Himalayan expedition group"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#07120d]/65 via-transparent to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
              Real journeys. Real people.
            </p>

            <p className="mt-3 max-w-xl text-2xl font-bold leading-tight text-white sm:text-3xl">
              Built around the places,
              people and moments that stay with you.
            </p>
          </div>
        </div>

        {/* Overlapping cultural image */}
        <div className="absolute -bottom-1 right-0 w-[58%] overflow-hidden rounded-[26px] border-[6px] border-[#f5f3ee] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:w-[48%]">

          <div className="relative aspect-[4/3]">
            <Image
              src="/images/about/about-culture.jpg"
            loading="lazy"
              alt="Bucketlist Adventure cultural travel experience"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 58vw, 28vw"
            />
          </div>

          <div className="bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">
              Beyond the trail
            </p>

            <p className="mt-1 text-sm font-semibold text-[#17251d]">
              Local culture. Deeper connections.
            </p>
          </div>
        </div>

      </div>
    </div>

    {/* Brand pillars */}
    <div className="mt-20 border-t border-black/10 pt-10 sm:mt-24 lg:mt-28">
      <div className="grid gap-px overflow-hidden rounded-[26px] border border-black/10 bg-black/10 sm:grid-cols-2 xl:grid-cols-4">

        <div className="bg-white p-6 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500">
            01
          </p>

          <h3 className="mt-4 text-xl font-bold text-[#17251d]">
            Curated Experiences
          </h3>

          <p className="mt-3 text-sm leading-6 text-[#718078]">
            Routes and journeys chosen for the experience,
            not simply to fill an itinerary.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500">
            02
          </p>

          <h3 className="mt-4 text-xl font-bold text-[#17251d]">
            Safety First
          </h3>

          <p className="mt-3 text-sm leading-6 text-[#718078]">
            Thoughtful planning, responsible operations
            and experienced on-ground leadership.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500">
            03
          </p>

          <h3 className="mt-4 text-xl font-bold text-[#17251d]">
            Smaller Groups
          </h3>

          <p className="mt-3 text-sm leading-6 text-[#718078]">
            More personal journeys, better coordination
            and stronger shared experiences.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500">
            04
          </p>

          <h3 className="mt-4 text-xl font-bold text-[#17251d]">
            Local Connections
          </h3>

          <p className="mt-3 text-sm leading-6 text-[#718078]">
            Travel that brings you closer to the landscape,
            communities and culture of a place.
          </p>
        </div>

      </div>
    </div>

  </div>
</section>



      {/* FEATURED DEPARTURE */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 sm:py-20 lg:px-10 lg:py-28">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-orange-500">
              Featured trip
            </p>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Ready for a bold weekend escape?
            </h2>
          </div>

          <a
            href={`/trips/${featuredTrip.slug}`}
            className="inline-flex w-fit items-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            View trip details
            <span className="ml-2 text-base">↗</span>
          </a>
        </div>

        <div className="grid gap-8 overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[260px] overflow-hidden bg-[#e8e4dc] sm:min-h-[340px]">
            {featuredTrip.image && (
              <img
                src={featuredTrip.image}
                alt={featuredTrip.title}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            )}
          </div>

          <div className="flex flex-col justify-center p-8 lg:p-10">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
              {featuredTrip.destination || featuredTrip.startPoint}
            </p>
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {featuredTrip.title}
            </h3>
            <p className="mt-3 text-lg text-[#5d6862]">{featuredTrip.subtitle}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-[#17251d]">
              <div className="rounded-2xl bg-[#f7f5f2] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">Price</p>
                <p className="mt-2 font-semibold">
  {featuredLowestPrice
    ? `From ${formatPrice(featuredLowestPrice)}`
    : featuredTrip.price ||
      "Price on request"}
</p>
              </div>
              <div className="rounded-2xl bg-[#f7f5f2] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">Duration</p>
                <p className="mt-2 font-semibold">{featuredTrip.duration}</p>
              </div>
            </div>

            <p className="mt-6 text-base leading-7 text-[#5d6862]">
              {featuredTrip.summary}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`/trips/${featuredTrip.slug}`}
                className="inline-flex items-center justify-center rounded-full bg-[#17251d] px-6 py-4 text-sm font-semibold text-white transition hover:bg-orange-500"
              >
                {featuredTrip.cta}
              </a>
              <a
                href="/trips"
                className="inline-flex items-center justify-center rounded-full border border-[#17251d]/15 bg-white px-6 py-4 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
              >
                Explore all trips
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TREKS NEAR PUNE - SEO LANDING PAGE LINK */}
      <section className="relative overflow-hidden bg-white px-6 py-16 sm:py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">

            {/* CONTENT */}
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-orange-500">
                Weekend Adventures
              </p>

              <h2 className="max-w-3xl text-4xl font-bold leading-[0.98] tracking-[-0.04em] text-[#17251d] sm:text-5xl lg:text-6xl">
                Discover the best
                <span className="block text-[#8a958e]">
                  treks near Pune.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-[#5d6862] sm:text-lg sm:leading-8">
                Escape the city and explore Sahyadri forts, waterfalls,
                forest trails and scenic mountain routes with thoughtfully
                planned weekend treks from Pune.
              </p>

              <p className="mt-4 max-w-xl text-base leading-7 text-[#718078]">
                Whether you are looking for an easy one-day trek, a monsoon
                adventure or a challenging fort trail, discover curated
                experiences with transport, trek leaders and on-ground
                coordination taken care of.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="/treks-near-pune"
                  className="inline-flex items-center justify-center rounded-full bg-[#17251d] px-6 py-4 text-sm font-semibold text-white transition hover:bg-orange-500"
                >
                  Explore Treks Near Pune
                  <span className="ml-3">↗</span>
                </a>

                <a
                  href="/trips"
                  className="inline-flex items-center justify-center rounded-full border border-[#17251d]/15 bg-white px-6 py-4 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
                >
                  View All Adventures
                </a>
              </div>
            </div>

            {/* VISUAL CARD */}
            <a
              href="/treks-near-pune"
              className="group relative min-h-[400px] overflow-hidden rounded-[32px] bg-[#17251d] shadow-[0_28px_80px_rgba(0,0,0,0.12)] sm:min-h-[500px]"
            >
              <img
                src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="absolute inset-0 object-cover object-center transition duration-700 group-hover:scale-105"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#07150f]/90 via-[#07150f]/20 to-transparent" />

              <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
                <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                  Pune • Sahyadris
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-300">
                  Explore locally
                </p>

                <h3 className="mt-3 max-w-lg text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Mountains closer than you think.
                </h3>

                <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-5">
                  <span className="text-sm font-semibold text-white">
                    Find your next trek
                  </span>

                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg text-[#17251d] transition group-hover:bg-orange-400 group-hover:text-white">
                    ↗
                  </span>
                </div>
              </div>
            </a>

          </div>
        </div>
      </section>


      {/* SCROLLCRAFT MASKED TRAVEL STORY */}
      <section
        id="destinations"
        className="scrollcraft-mask-section relative h-[100svh] overflow-hidden bg-black text-white"
      >
        {[
          {
            word: "ALIVE",
            eyebrow: "Treks & Adventures",
            title: "Go where the road ends.",
            description:
              "Sahyadri trails, Himalayan treks and expeditions created for travellers who want to earn the view.",
            category: "Treks & Adventures",
            image:
              "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&fm=jpg&q=88&w=2200",
            position: "center 45%",
          },
          {
            word: "INDIA",
            eyebrow: "Domestic Tours",
            title: "Take the long road.",
            description:
              "Ladakh, Spiti, Kashmir, Kerala, Andaman, Mysuru and immersive journeys across India.",
            category: "Domestic Tours",
            image:
              "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&fm=jpg&q=88&w=2200",
            position: "center 52%",
          },
          {
            word: "BEYOND",
            eyebrow: "International Tours",
            title: "Make the world your next story.",
            description:
              "Curated journeys beyond borders, built around iconic places, local culture and seamless planning.",
            category: "International Tours",
            image:
              "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&fm=jpg&q=88&w=2200",
            position: "center 50%",
          },
        ].map((scene, index) => (
          <div
            key={scene.word}
            className="scrollcraft-scene absolute inset-0"
            style={{ zIndex: index + 1 }}
          >
            {/* Mobile-first composition: word sits high enough to leave room for copy + CTA. */}
            <div
              className="scrollcraft-word absolute inset-x-0 top-[18svh] h-[31svh] sm:inset-0 sm:h-auto"
              style={{
                WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'%3E%3Ctext x='800' y='535' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='310' font-weight='900' letter-spacing='-18' fill='white'%3E${scene.word}%3C/text%3E%3C/svg%3E")`,
                WebkitMaskSize: "121% auto",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'%3E%3Ctext x='800' y='535' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='310' font-weight='900' letter-spacing='-18' fill='white'%3E${scene.word}%3C/text%3E%3C/svg%3E")`,
                maskSize: "121% auto",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            >
              <img
                src={scene.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="scrollcraft-media absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: scene.position }}
              />
            </div>

            {/* Mobile outline uses the same visual zone as the mask. Desktop keeps the large treatment. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-[18svh] flex h-[31svh] items-center justify-center overflow-hidden px-2 text-center font-black uppercase leading-none tracking-[-0.055em] text-transparent sm:inset-0 sm:h-auto sm:px-4"
              style={{
                fontSize: "clamp(3.5rem, 20vw, 18.6rem)",
                WebkitTextStroke: "1px rgba(255,255,255,0.10)",
              }}
            >
              {scene.word}
            </div>

            <div className="scrollcraft-copy absolute inset-x-0 bottom-[max(4.25rem,env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[1400px] flex-col gap-4 px-5 sm:bottom-10 sm:gap-5 sm:px-10 lg:bottom-12 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[9px] font-bold uppercase tracking-[0.27em] text-orange-400 sm:text-xs sm:tracking-[0.32em]">
                  {String(index + 1).padStart(2, "0")} · {scene.eyebrow}
                </p>
                <h2 className="mt-2 text-[1.7rem] font-bold leading-[1.02] tracking-[-0.04em] sm:mt-3 sm:text-4xl lg:text-5xl">
                  {scene.title}
                </h2>
                <p className="mt-2 max-w-xl text-[11px] leading-[1.55] text-white/68 sm:mt-3 sm:text-sm sm:leading-7">
                  {scene.description}
                </p>
              </div>

              <a
                href={`/trips?category=${encodeURIComponent(scene.category)}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white px-5 py-3 text-[11px] font-bold text-[#17251d] transition hover:bg-orange-400 hover:text-white sm:w-fit sm:px-6 sm:py-3.5 sm:text-sm"
              >
                Explore {scene.eyebrow}
                <span className="ml-3">↗</span>
              </a>
            </div>

            <div className="pointer-events-none absolute left-5 top-5 z-20 text-[8px] font-bold uppercase tracking-[0.28em] text-white/35 sm:left-10 sm:top-10 sm:text-[9px] sm:tracking-[0.32em]">
              Scroll to explore
            </div>

            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-white/10" />
          </div>
        ))}
      </section>


      {/* UPCOMING ADVENTURES */}
<section
  id="adventures"
  className="mx-auto max-w-[1400px] px-6 py-16 sm:py-20 lg:px-10 lg:py-32"
>
  <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-orange-500">
        Upcoming adventures
      </p>

      <h2 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Your next story
        <span className="block text-[#8a958e]">
          starts on the trail.
        </span>
      </h2>
    </div>

    <a
      href="/trips"
      className="inline-flex w-fit items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
    >
      View all adventures
      <span className="ml-2">↗</span>
    </a>
  </div>

  {(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getUpcomingBatches = (trip: TripData) =>
      (trip.batches || [])
        .filter(
          (batch) =>
            batch.visibility === "PUBLIC" &&
            batch.status === "OPEN" &&
            batch.bookingEnabled &&
            new Date(batch.departureDate).getTime() >=
              today.getTime()
        )
        .sort(
          (a, b) =>
            new Date(a.departureDate).getTime() -
            new Date(b.departureDate).getTime()
        );

    const upcomingTrips = trips
      .filter(
        (trip) =>
          trip.upcoming === true &&
          getUpcomingBatches(trip).length > 0
      )
      .sort((a, b) => {
        const aBatch =
          getUpcomingBatches(a)[0];

        const bBatch =
          getUpcomingBatches(b)[0];

        if (!aBatch && !bBatch) return 0;
        if (!aBatch) return 1;
        if (!bBatch) return -1;

        return (
          new Date(
            aBatch.departureDate
          ).getTime() -
          new Date(
            bBatch.departureDate
          ).getTime()
        );
      });

    if (upcomingTrips.length === 0) {
      return (
        <div className="rounded-[28px] border border-black/10 bg-white p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          <p className="text-lg font-semibold text-[#17251d]">
            New adventures are being planned.
          </p>

          <p className="mt-2 text-sm text-[#718078]">
            Check back soon or contact us for a custom trip.
          </p>

          <a
            href="https://wa.me/918482846287"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-full bg-[#17251d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            Plan a custom trip
          </a>
        </div>
      );
    }

    return upcomingTrips.length === 1 ? (
  (() => {
    const trip = upcomingTrips[0];

    const upcomingBatches =
      getUpcomingBatches(trip);

    const nextBatch =
      upcomingBatches[0] || null;

    const availableSeats =
      nextBatch
        ? Math.max(
            0,
            Number(nextBatch.totalSeats || 0) -
              Number(nextBatch.bookedSeats || 0)
          )
        : null;

    const displayPrice =
      nextBatch
        ? formatPrice(Number(nextBatch.price))
        : trip.price || "Price on request";

    const displayDate =
      nextBatch
        ? new Date(
            nextBatch.departureDate
          ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Dates coming soon";

    const displayDuration =
      trip.duration ||
      (trip.durationDays
        ? `${trip.durationDays} ${
            trip.durationDays === 1
              ? "Day"
              : "Days"
          }`
        : "Flexible");

    return (
      <a
        href={`/trips/${trip.slug}`}
        className="group grid overflow-hidden rounded-[34px] border border-black/10 bg-white shadow-[0_28px_80px_rgba(0,0,0,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(0,0,0,0.13)] lg:grid-cols-[1.15fr_0.85fr]"
      >
        {/* IMAGE */}
        <div className="relative min-h-[420px] overflow-hidden lg:min-h-[520px]">
          {trip.image && (
            <img
              src={trip.image}
              alt={trip.title}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/10" />

          <div className="absolute left-6 top-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-black/25 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              {trip.travelCategory || trip.category}
            </span>

            {trip.difficulty && (
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                {trip.difficulty}
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-6 p-7 sm:p-9">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
              Featured departure
            </p>

            <h3 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {trip.title}
            </h3>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
              {trip.startPoint && (
                <span>{trip.startPoint}</span>
              )}

              <span>{displayDuration}</span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col justify-between p-7 sm:p-9 lg:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-orange-500">
              Next adventure
            </p>

            <p className="mt-5 text-lg leading-8 text-[#5d6862]">
              {trip.summary}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] bg-[#f7f5f2] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/45">
                  Departure
                </p>

                <p className="mt-2 text-lg font-bold text-[#17251d]">
                  {displayDate}
                </p>
              </div>

              <div className="rounded-[22px] bg-[#f7f5f2] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/45">
                  From
                </p>

                <p className="mt-2 text-lg font-bold text-[#17251d]">
                  {displayPrice}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[22px] border border-black/10 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/45">
                Availability
              </p>

              <p className="mt-2 text-lg font-bold text-[#17251d]">
                {availableSeats !== null
                  ? availableSeats > 0
                    ? `${availableSeats} ${
                        availableSeats === 1
                          ? "seat"
                          : "seats"
                      } left`
                    : "Sold out"
                  : "Enquire for availability"}
              </p>
            </div>

            {upcomingBatches.length > 1 && (
              <p className="mt-5 text-sm font-medium text-[#718078]">
                + {upcomingBatches.length - 1} more{" "}
                {upcomingBatches.length - 1 === 1
                  ? "departure"
                  : "departures"}{" "}
                available
              </p>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-black/10 pt-6">
            <span className="text-sm font-semibold text-[#17251d]">
              View adventure
            </span>

            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#17251d] text-lg text-white transition group-hover:bg-orange-500">
              ↗
            </span>
          </div>
        </div>
      </a>
    );
  })()
) : (
  <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
    {upcomingTrips.map((trip) => {
      const upcomingBatches =
        getUpcomingBatches(trip);

      const nextBatch =
        upcomingBatches[0] || null;

      const availableSeats =
        nextBatch
          ? Math.max(
              0,
              Number(nextBatch.totalSeats || 0) -
                Number(nextBatch.bookedSeats || 0)
            )
          : null;

      const displayPrice =
        nextBatch
          ? formatPrice(Number(nextBatch.price))
          : trip.price || "Price on request";

      const displayDate =
        nextBatch
          ? new Date(
              nextBatch.departureDate
            ).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Dates coming soon";

      const displayDuration =
        trip.duration ||
        (trip.durationDays
          ? `${trip.durationDays} ${
              trip.durationDays === 1
                ? "Day"
                : "Days"
            }`
          : "Flexible");

      return (
        <a
          key={trip.slug}
          href={`/trips/${trip.slug}`}
          className="group overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(0,0,0,0.12)]"
        >
          <div className="relative h-64 overflow-hidden sm:h-72">
            {trip.image && (
              <img
                src={trip.image}
                alt={trip.title}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                {trip.travelCategory || trip.category}
              </span>

              {trip.difficulty && (
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                  {trip.difficulty}
                </span>
              )}
            </div>

            <div className="absolute bottom-5 left-5 right-5">
              <h3 className="text-2xl font-bold text-white sm:text-3xl">
                {trip.title}
              </h3>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
                {trip.startPoint && (
                  <span>{trip.startPoint}</span>
                )}

                <span>{displayDuration}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="line-clamp-2 text-sm leading-6 text-[#5d6862]">
              {trip.summary}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#f7f5f2] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/50">
                  Next departure
                </p>

                <p className="mt-2 text-sm font-semibold text-[#17251d]">
                  {displayDate}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f5f2] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/50">
                  From
                </p>

                <p className="mt-2 text-sm font-semibold text-[#17251d]">
                  {displayPrice}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#17251d]/45">
                  Availability
                </p>

                <p className="mt-1 text-sm font-semibold text-[#17251d]">
                  {availableSeats !== null
                    ? `${availableSeats} seats left`
                    : "Enquire for availability"}
                </p>
              </div>

              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#17251d] text-lg text-white transition group-hover:bg-orange-500">
                ↗
              </span>
            </div>
          </div>
        </a>
      );
    })}
  </div>
    );
  })()}
</section>

        {/* LIVE GOOGLE REVIEWS / TRAVELLER STORIES */}
<section className="relative overflow-hidden bg-white px-6 py-20 sm:py-24 lg:px-10 lg:py-36">
  <div className="mx-auto max-w-[1400px]">

    <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-16">

      {/* LEFT SIDE */}
      <div className="lg:sticky lg:top-28">

        <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-orange-500">
          Traveller Stories
        </p>

        <h2 className="max-w-2xl text-4xl font-bold leading-[0.95] tracking-[-0.045em] text-[#17251d] sm:text-5xl lg:text-7xl">
          Trusted by
          <span className="block text-[#8a958e]">
            people who went.
          </span>
        </h2>

        <p className="mt-7 max-w-xl text-lg leading-8 text-[#5d6862]">
          Real journeys are best told by the people who
          lived them. Here is what travellers are saying
          about their experiences with Bucketlist Adventure.
        </p>

        {/* GOOGLE RATING CARD */}
        <div className="mt-9 overflow-hidden rounded-[30px] bg-[#17251d] p-7 text-white shadow-[0_28px_80px_rgba(0,0,0,0.12)] sm:p-8">

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
              Google Maps
            </p>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              Live rating
            </span>
          </div>

          <div className="mt-6 flex items-end gap-5">

            <p className="text-6xl font-bold tracking-tight">
              {googleReviews?.place.rating
                ? googleReviews.place.rating.toFixed(1)
                : "—"}
            </p>

            <div className="pb-1">
              <p className="text-xl tracking-[0.12em] text-orange-300">
                ★★★★★
              </p>

              <p className="mt-2 text-sm text-white/60">
                {googleReviews?.place.reviewCount
                  ? `${googleReviews.place.reviewCount.toLocaleString(
                      "en-IN"
                    )} Google reviews`
                  : "Google traveller reviews"}
              </p>
            </div>

          </div>

          {googleReviews?.place.googleMapsUri && (
            <a
              href={googleReviews.place.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[#17251d]"
            >
              Read all Google Reviews
              <span className="ml-2">
                ↗
              </span>
            </a>
          )}

          <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-white/35">
            Reviews and ratings provided by Google Maps
          </p>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div>

        {googleReviewsLoading && (
          <div className="rounded-[28px] border border-black/10 bg-[#f7f5f2] p-10 text-center">
            <p className="text-sm text-[#718078]">
              Loading traveller stories...
            </p>
          </div>
        )}

        {!googleReviewsLoading &&
          googleReviews?.reviews?.length === 0 && (
            <div className="rounded-[28px] border border-black/10 bg-[#f7f5f2] p-10 text-center">
              <p className="text-sm text-[#718078]">
                Traveller reviews are temporarily unavailable.
              </p>
            </div>
          )}

        {googleReviews?.reviews &&
          googleReviews.reviews.length > 0 && (

          <div className="grid gap-5 md:grid-cols-2">

            {googleReviews.reviews
              .slice(0, 4)
              .map((review, index) => {

                const shortReview =
  review.text.length > 320
    ? `${review.text.slice(0, 320).trim()}…`
    : review.text;

                return (
                  <article
                    key={`${review.author.name}-${index}`}
                    className="group flex min-h-[330px] flex-col justify-between rounded-[28px] border border-black/10 bg-[#f7f5f2] p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:p-7"
                  >

                    <div>

                      <div className="flex items-start justify-between gap-5">

                        <p className="text-base tracking-[0.1em] text-orange-500">
                          {"★".repeat(
                            Math.max(
                              1,
                              Math.min(
                                5,
                                Math.round(review.rating)
                              )
                            )
                          )}
                        </p>

                        <span className="shrink-0 text-xs text-[#8a958e]">
                          {review.relativeTime}
                        </span>

                      </div>

                      <p className="mt-6 text-base leading-7 text-[#4f5c55]">
  “{shortReview}”
</p>

{review.text.length > 320 &&
  review.googleMapsUri && (
    <a
      href={review.googleMapsUri}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex text-xs font-semibold text-orange-500 transition hover:text-[#17251d]"
    >
      Read full review ↗
    </a>
  )}

                    </div>

                    <div className="mt-8 border-t border-black/10 pt-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17251d] text-sm font-bold uppercase text-white">
  {review.author.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("")}
</div>

                        <div className="min-w-0">

                          {review.author.profileUrl ? (
                            <a
                              href={review.author.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate font-bold text-[#17251d] transition hover:text-orange-500"
                            >
                              {review.author.name}
                            </a>
                          ) : (
                            <p className="truncate font-bold text-[#17251d]">
                              {review.author.name}
                            </p>
                          )}

                          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#8a958e]">
                            Google Maps Review
                          </p>

                        </div>

                      </div>

                      {review.googleMapsUri && (
                        <a
                          href={review.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex items-center text-xs font-semibold text-[#718078] transition hover:text-orange-500"
                        >
                          View original review
                          <span className="ml-2">
                            ↗
                          </span>
                        </a>
                      )}

                    </div>

                  </article>
                );
              })}

          </div>
        )}

        {/* BOTTOM GOOGLE CTA */}
        {googleReviews?.place.googleMapsUri && (
          <div className="mt-7 flex flex-col gap-4 rounded-[26px] border border-black/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="font-bold text-[#17251d]">
                Been on an adventure with us?
              </p>

              <p className="mt-1 text-sm text-[#718078]">
                Share your experience with future travellers.
              </p>
            </div>

            <a
              href={googleReviews.place.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              Review us on Google
              <span className="ml-2">
                ↗
              </span>
            </a>

          </div>
        )}

      </div>

    </div>

  </div>
</section>

       {/* MEET THE TEAM */}
<section className="relative overflow-hidden bg-[#f5f3ee] px-6 py-20 sm:py-24 lg:px-10 lg:py-36">
  <div className="mx-auto max-w-[1400px]">

    {/* Heading */}
    <div className="mb-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
      <div>
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-orange-500">
          Meet the Team
        </p>

        <h2 className="max-w-4xl text-4xl font-bold leading-[0.95] tracking-[-0.045em] text-[#17251d] sm:text-5xl lg:text-7xl">
          The people behind
          <span className="block text-[#8a958e]">
            every great journey.
          </span>
        </h2>
      </div>

      <div className="lg:pb-2">
        <p className="max-w-xl text-lg leading-8 text-[#5d6862]">
          Leadership shaped by real mountain experience, thoughtful planning
          and a shared commitment to creating journeys that are safe,
          memorable and deeply rewarding.
        </p>
      </div>
    </div>

    {/* Leadership cards */}
    <div className="grid gap-8 lg:grid-cols-2">

      {/* RUTURAJ */}
      <article className="group overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.07)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(0,0,0,0.12)]">

        <div className="relative aspect-[4/4.5] overflow-hidden bg-[#17251d]">
          <Image
            src="/images/team/ruturaj.jpg"
            loading="lazy"
            alt="Ruturaj Agawane - Founder of Bucketlist Adventure"
            fill
            className="object-cover object-center transition duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#07120d]/90 via-transparent to-black/5" />

          <div className="absolute left-6 top-6">
            <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
              Leadership
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-orange-300">
              Founder
            </p>

            <h3 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ruturaj Agawane
            </h3>
          </div>
        </div>

        <div className="p-7 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
            Mountain Credentials
          </p>

          <p className="mt-3 text-base leading-7 text-[#5d6862]">
            BMC Certified Mountaineer • Mt. Yunam • Mt. UT Kangri
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Vision", "Leadership", "Experience Design"].map((item) => (
              <span
                key={item}
                className="rounded-full bg-[#f5f3ee] px-4 py-2 text-xs font-semibold text-[#17251d]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* SHAILESH */}
      <article className="group overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.07)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(0,0,0,0.12)]">

        <div className="relative aspect-[4/4.5] overflow-hidden bg-[#17251d]">
          <Image
            src="/images/team/shailesh.jpg"
            loading="lazy"
            alt="Shailesh Deshmukh - Director Strategy and Business Development"
            fill
            className="object-cover object-center transition duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#07120d]/90 via-transparent to-black/5" />

          <div className="absolute left-6 top-6">
            <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
              Leadership
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
              Director – Strategy & Business Development
            </p>

            <h3 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Shailesh Deshmukh
            </h3>
          </div>
        </div>

        <div className="p-7 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
            Mountain Credentials
          </p>

          <p className="mt-3 text-base leading-7 text-[#5d6862]">
            • Mt. Yunam • Mt. UT Kangri
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Strategy", "Partnerships", "Business Growth"].map((item) => (
              <span
                key={item}
                className="rounded-full bg-[#f5f3ee] px-4 py-2 text-xs font-semibold text-[#17251d]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </article>

    </div>
    {/* LEGACY — PRANITA DAPHAL */}
<div className="mt-12 overflow-hidden rounded-[32px] border border-black/10 bg-[#ebe7df] shadow-[0_24px_70px_rgba(0,0,0,0.06)]">
  <div className="grid lg:grid-cols-[0.85fr_1.15fr]">

    {/* Photo */}
    <div className="relative min-h-[420px] overflow-hidden sm:min-h-[520px] lg:min-h-[580px]">
      <Image
        src="/images/team/pranita.jpg"
            loading="lazy"
        alt="Pranita Daphal - Co-Founder of Bucketlist Adventure"
        fill
        className="object-cover object-center"
        sizes="(max-width: 1024px) 100vw, 42vw"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>

    {/* Tribute */}
    <div className="flex items-center px-7 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
      <div className="max-w-2xl">

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          In Loving Memory
        </p>

        <h3 className="mt-5 text-4xl font-bold tracking-[-0.035em] text-[#17251d] sm:text-5xl lg:text-6xl">
          Pranita Daphal
        </h3>

        <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em] text-[#17251d]/55">
          Co-Founder • Bucketlist Adventure
        </p>

        <div className="my-8 h-px w-20 bg-orange-400" />

        <p className="text-xl font-medium leading-9 text-[#37463e] sm:text-2xl sm:leading-10">
          “Some journeys leave footprints that never fade.”
        </p>

        <p className="mt-7 text-base leading-8 text-[#5d6862] sm:text-lg">
          A cherished part of the foundation on which Bucketlist Adventure
          was built. Her contribution, passion and spirit remain forever
          woven into our journey.
        </p>

        <p className="mt-5 text-base leading-8 text-[#5d6862] sm:text-lg">
          As we continue exploring new trails and creating new memories,
          we carry forward the values and dreams that helped shape
          Bucketlist Adventure from the beginning.
        </p>

        <div className="mt-9 flex items-center gap-4">
          <div className="h-px w-10 bg-[#17251d]/25" />

          <p className="text-sm font-semibold italic text-[#17251d]/65">
            Forever a part of our story.
          </p>
        </div>

      </div>
    </div>

  </div>
</div>

    {/* Bottom leadership statement */}
    <div className="mt-10 flex flex-col gap-5 rounded-[28px] bg-[#17251d] px-7 py-7 text-white sm:px-9 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-orange-300">
          One philosophy
        </p>

        <p className="mt-2 max-w-3xl text-xl font-semibold leading-8 sm:text-2xl">
          Plan every detail carefully. Let the traveller live the experience fully.
        </p>
      </div>

      <p className="shrink-0 text-sm font-semibold text-white/60">
        We Plan It. You Live It.
      </p>
    </div>

  </div>
</section>

      {/* CHOOSE YOUR ADVENTURE */}
<section className="relative overflow-hidden bg-[#101812] px-6 py-20 text-white sm:py-24 lg:px-10 lg:py-36">
  <div className="mx-auto max-w-[1400px]">

    {/* SECTION HEADER */}
    <div className="mb-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
      <div>
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-orange-400">
          Find Your Adventure
        </p>

        <h2 className="max-w-4xl text-4xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-5xl lg:text-7xl">
          Choose how you
          <span className="block text-white/35">
            want to explore.
          </span>
        </h2>
      </div>

      <div className="lg:pb-2">
        <p className="max-w-xl text-lg leading-8 text-white/60">
          From a quick weekend escape to a high-altitude expedition,
          discover experiences designed around your pace, your people
          and the kind of memories you want to bring home.
        </p>

        <a
          href="/trips"
          className="mt-6 inline-flex items-center text-sm font-semibold text-orange-300 transition hover:text-white"
        >
          Explore all adventures
          <span className="ml-2">↗</span>
        </a>
      </div>
    </div>

    {/* EDITORIAL ADVENTURE GRID */}
    <div className="grid gap-5 lg:grid-cols-12">

      {/* HIMALAYAN EXPEDITIONS — LARGE FEATURE */}
      <a
        href="/trips"
        className="group relative min-h-[520px] overflow-hidden rounded-[32px] border border-white/10 lg:col-span-7 lg:min-h-[650px]"
      >
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=88"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 object-cover object-center transition duration-700 group-hover:scale-105"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/10" />

        <div className="absolute left-6 top-6">
          <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
            High Altitude
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-300">
            Himalayan Expeditions
          </p>

          <h3 className="mt-3 max-w-2xl text-4xl font-bold leading-[0.96] tracking-tight sm:text-5xl">
            Go higher.
            <span className="block text-white/55">
              Discover what you&apos;re capable of.
            </span>
          </h3>

          <div className="mt-7 flex items-center justify-between border-t border-white/15 pt-5">
            <span className="text-sm font-semibold text-white/75">
              Expeditions • Treks • High altitude
            </span>

            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg text-[#17251d] transition group-hover:bg-orange-400 group-hover:text-white">
              ↗
            </span>
          </div>
        </div>
      </a>

      {/* RIGHT COLUMN */}
      <div className="grid gap-5 lg:col-span-5">

        {/* WEEKEND TREKS */}
        <a
          href="/trips"
          className="group relative min-h-[310px] overflow-hidden rounded-[32px] border border-white/10"
        >
          <img
            src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=88"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="absolute inset-0 object-cover object-center transition duration-700 group-hover:scale-105"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-300">
              Weekend Treks
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              Big adventures.
              <span className="block text-white/55">
                Just a weekend away.
              </span>
            </h3>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/65">
                Sahyadri • Forts • Waterfalls
              </span>

              <span className="text-xl transition group-hover:translate-x-1">
                ↗
              </span>
            </div>
          </div>
        </a>

        {/* ROAD JOURNEYS */}
        <a
          href="/trips"
          className="group relative min-h-[310px] overflow-hidden rounded-[32px] border border-white/10"
        >
          <img
            src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=88"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="absolute inset-0 object-cover object-center transition duration-700 group-hover:scale-105"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-300">
              Road Journeys
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              Take the long road
              <span className="block text-white/55">
                to extraordinary places.
              </span>
            </h3>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/65">
                Ladakh • Spiti • Beyond
              </span>

              <span className="text-xl transition group-hover:translate-x-1">
                ↗
              </span>
            </div>
          </div>
        </a>

      </div>
    </div>

    {/* SECOND ROW */}
    <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

      {/* BACKPACKING */}
      <a
        href="/trips"
        className="group relative min-h-[390px] overflow-hidden rounded-[30px] border border-white/10"
      >
        <img
          src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1000&q=88"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 object-cover object-center transition duration-700 group-hover:scale-105"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-300">
            Backpacking
          </p>

          <h3 className="mt-3 text-3xl font-bold">
            Travel deeper.
            <span className="block text-white/50">
              Experience more.
            </span>
          </h3>

          <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-5">
            <span className="text-xs text-white/65">
              People • Culture • Discovery
            </span>

            <span className="text-xl">↗</span>
          </div>
        </div>
      </a>

      {/* CUSTOM JOURNEYS */}
      <a
        href="https://wa.me/918482846287"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative min-h-[390px] overflow-hidden rounded-[30px] border border-white/10"
      >
        <img
          src="https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=1000&q=88"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 object-cover object-center transition duration-700 group-hover:scale-105"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-300">
            Custom Journeys
          </p>

          <h3 className="mt-3 text-3xl font-bold">
            Your dates.
            <span className="block text-white/50">
              Your people. Your journey.
            </span>
          </h3>

          <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-5">
            <span className="text-xs text-white/65">
              Tailor-made travel
            </span>

            <span className="text-xl">↗</span>
          </div>
        </div>
      </a>

      {/* CORPORATE */}
      <a
        href="#contact"
        className="group relative min-h-[390px] overflow-hidden rounded-[30px] border border-white/10 md:col-span-2 xl:col-span-1"
      >
        <img
          src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=88"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 object-cover object-center transition duration-700 group-hover:scale-105"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-300">
            Corporate Adventures
          </p>

          <h3 className="mt-3 text-3xl font-bold">
            Stronger teams
            <span className="block text-white/50">
              begin outside the office.
            </span>
          </h3>

          <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-5">
            <span className="text-xs text-white/65">
              Teams • Retreats • Experiences
            </span>

            <span className="text-xl">↗</span>
          </div>
        </div>
      </a>

    </div>
    

    {/* BOTTOM CTA */}
    <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-base leading-7 text-white/50">
        Can&apos;t find exactly what you&apos;re looking for?
        Tell us where you want to go and we&apos;ll help design the journey.
      </p>

      <a
        href="https://wa.me/918482846287"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#17251d]"
      >
        Design My Trip
        <span className="ml-3">↗</span>
      </a>
    </div>

  </div>
</section>        
{/* PLAN YOUR TRIP / CONTACT */}
<section
  id="contact"
  className="relative overflow-hidden bg-[#f5f3ee] px-6 py-20 sm:py-24 lg:px-10 lg:py-36"
>
  <div className="mx-auto max-w-[1400px]">

    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">

      {/* LEFT CONTENT */}
      <div className="flex flex-col justify-between rounded-[34px] bg-[#17251d] p-8 text-white sm:p-10 lg:p-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-300">
            Plan Your Trip
          </p>

          <h2 className="mt-5 max-w-xl text-4xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Your next adventure
            <span className="block text-white/45">
              starts with a conversation.
            </span>
          </h2>

          <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
            Tell us what you have in mind — destination, dates, group size
            or even just the kind of experience you want. We&apos;ll help shape
            the journey from there.
          </p>

          <div className="mt-9 space-y-5 border-t border-white/10 pt-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                Best for
              </p>
              <p className="mt-2 font-semibold">
                Treks • Expeditions • Family Trips • Corporate Groups
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                Response
              </p>
              <p className="mt-2 font-semibold">
                WhatsApp & direct planning support
              </p>
            </div>
          </div>
        </div>

        <a
          href="https://wa.me/918482846287"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex w-fit items-center rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#17251d]"
        >
          Chat on WhatsApp
          <span className="ml-3">↗</span>
        </a>
      </div>

      {/* RIGHT FORM */}
<form
  onSubmit={(event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "");
    const phone = String(formData.get("phone") || "");
    const email = String(formData.get("email") || "");
    const groupSize = String(formData.get("groupSize") || "");
    const tripType = String(formData.get("tripType") || "");
    const travelMonth = String(formData.get("travelMonth") || "");
    const message = String(formData.get("message") || "");

    const whatsappMessage = [
      "Hi Bucketlist Adventure! 👋",
      "",
      "I would like to plan a trip.",
      "",
      `Name: ${name}`,
      `Phone / WhatsApp: ${phone}`,
      email ? `Email: ${email}` : "",
      `Trip Type: ${tripType}`,
      `Travel Month: ${travelMonth || "Flexible"}`,
      `Group Size: ${groupSize}`,
      "",
      "Trip Details:",
      message || "I would like to know more about suitable options.",
      "",
      "Please help me plan the trip.",
    ]
      .filter(Boolean)
      .join("\n");

    const whatsappUrl =
      `https://wa.me/918482846287?text=${encodeURIComponent(
        whatsappMessage
      )}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }}
  className="rounded-[34px] border border-black/10 bg-white p-8 shadow-[0_24px_70px_rgba(0,0,0,0.06)] sm:p-10 lg:p-12"
>
  <p className="text-sm font-bold uppercase tracking-[0.26em] text-orange-500">
    Tell us about your trip
  </p>

  <div className="mt-8 grid gap-5 sm:grid-cols-2">

    {/* NAME */}
    <div>
      <label
        htmlFor="trip-name"
        className="mb-2 block text-sm font-semibold text-[#17251d]"
      >
        Name *
      </label>

      <input
        id="trip-name"
        name="name"
        type="text"
        required
        placeholder="Your name"
        className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-4 text-sm text-[#17251d] outline-none transition focus:border-orange-400"
      />
    </div>

    {/* PHONE */}
    <div>
      <label
        htmlFor="trip-phone"
        className="mb-2 block text-sm font-semibold text-[#17251d]"
      >
        Phone / WhatsApp *
      </label>

      <input
        id="trip-phone"
        name="phone"
        type="tel"
        required
        placeholder="+91 98765 43210"
        className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-4 text-sm text-[#17251d] outline-none transition focus:border-orange-400"
      />
    </div>

    {/* EMAIL */}
    <div>
      <label
        htmlFor="trip-email"
        className="mb-2 block text-sm font-semibold text-[#17251d]"
      >
        Email
      </label>

      <input
        id="trip-email"
        name="email"
        type="email"
        placeholder="you@example.com"
        className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-4 text-sm text-[#17251d] outline-none transition focus:border-orange-400"
      />
    </div>

    {/* GROUP SIZE */}
    <div>
      <label
        htmlFor="trip-group-size"
        className="mb-2 block text-sm font-semibold text-[#17251d]"
      >
        Group Size *
      </label>

      <input
        id="trip-group-size"
        name="groupSize"
        type="number"
        min="1"
        required
        placeholder="No. of travellers"
        className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-4 text-sm text-[#17251d] outline-none transition focus:border-orange-400"
      />
    </div>

    {/* TRIP TYPE */}
    <div>
      <label
        htmlFor="trip-type"
        className="mb-2 block text-sm font-semibold text-[#17251d]"
      >
        Trip Type *
      </label>

      <select
        id="trip-type"
        name="tripType"
        required
        defaultValue=""
        className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-4 text-sm text-[#17251d] outline-none transition focus:border-orange-400"
      >
        <option value="" disabled>
          Select trip type
        </option>

        <option value="Weekend Trek">
          Weekend Trek
        </option>

        <option value="Himalayan Expedition">
          Himalayan Expedition
        </option>

        <option value="Road Trip">
          Road Trip
        </option>

        <option value="Backpacking">
          Backpacking
        </option>

        <option value="Family Holiday">
          Family Holiday
        </option>

        <option value="Corporate Outing">
          Corporate Outing
        </option>

        <option value="Custom Trip">
          Custom Trip
        </option>
      </select>
    </div>

    {/* TRAVEL MONTH */}
    <div>
      <label
        htmlFor="trip-month"
        className="mb-2 block text-sm font-semibold text-[#17251d]"
      >
        Travel Month
      </label>

      <input
        id="trip-month"
        name="travelMonth"
        type="month"
        className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-4 text-sm text-[#17251d] outline-none transition focus:border-orange-400"
      />
    </div>

    {/* MESSAGE */}
    <div className="sm:col-span-2">
      <label
        htmlFor="trip-message"
        className="mb-2 block text-sm font-semibold text-[#17251d]"
      >
        Tell us what you have in mind
      </label>

      <textarea
        id="trip-message"
        name="message"
        rows={5}
        placeholder="Destination, dates, preferences, special requirements..."
        className="w-full resize-none rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-4 text-sm text-[#17251d] outline-none transition focus:border-orange-400"
      />
    </div>

  </div>

  {/* SUBMIT */}
  <button
    type="submit"
    className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#17251d] px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-500"
  >
    Continue on WhatsApp
    <span className="ml-3">
      ↗
    </span>
  </button>

  <p className="mt-4 text-center text-xs leading-5 text-[#8a958e]">
    Your enquiry will open securely in WhatsApp. No payment is required.
  </p>
</form>

    </div>
  </div>
</section>
      {/* INSTAGRAM PROFILE */}
<section className="bg-white px-6 py-16 sm:py-20 lg:px-10 lg:py-24">
  <div className="mx-auto max-w-[1400px]">

    <div className="overflow-hidden rounded-[32px] border border-black/10 bg-[#f7f5f2] shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">

        {/* LEFT CONTENT */}
        <div className="p-8 sm:p-10 lg:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
            Instagram
          </p>

          <h2 className="mt-5 max-w-3xl text-4xl font-bold leading-[0.96] tracking-[-0.04em] text-[#17251d] sm:text-5xl lg:text-6xl">
            Follow the
            <span className="block text-[#8a958e]">
              journey as it happens.
            </span>
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5d6862]">
            Trail moments, mountain stories, upcoming adventures and real
            experiences from the Bucketlist Adventure community.
          </p>

          <a
            href="https://www.instagram.com/bucketlistadventuure/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center rounded-full bg-[#17251d] px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-500"
          >
            Follow @bucketlistadventuure
            <span className="ml-3">↗</span>
          </a>
        </div>

        {/* RIGHT VISUAL */}
        <div className="flex min-h-[320px] items-center justify-center bg-[#17251d] p-8 text-white sm:min-h-[380px] lg:min-h-full">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/15 bg-white/10 text-3xl font-bold backdrop-blur-md">
              IG
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.26em] text-orange-300">
              Bucketlist Adventure
            </p>

            <p className="mt-3 text-2xl font-bold">
              @bucketlistadventuure
            </p>

            <p className="mt-4 text-sm leading-6 text-white/60">
              Treks • Expeditions • Journeys • Community
            </p>
          </div>
        </div>

      </div>
    </div>

  </div>
</section>

      {/* CORPORATE CTA */}
      <section
        id="contact"
        className="relative overflow-hidden bg-[#e8e1d4] px-6 py-16 sm:py-20 lg:px-10 lg:py-32"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="mb-5 text-sm font-bold uppercase tracking-[0.3em] text-orange-500">
                Corporate Adventures
              </p>

              <h2 className="text-4xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
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
      <section className="bg-[#17251d] px-6 py-20 text-center text-white sm:py-28 lg:px-10 lg:py-36">
        <div className="mx-auto max-w-[1400px]">

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
            Reserve Your Spot ↗
          </a>

        </div>
      </section>

      {/* PREMIUM FOOTER */}
<footer className="bg-[#101812] px-6 pb-8 pt-20 text-white sm:pt-24 lg:px-10 lg:pt-28">
  <div className="mx-auto max-w-[1400px]">

    {/* TOP CTA */}
    <div className="grid gap-8 border-b border-white/10 pb-12 pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-300">
          Ready when you are
        </p>

        <h2 className="mt-5 max-w-4xl text-4xl font-bold leading-[0.92] tracking-[-0.045em] sm:text-5xl lg:text-7xl">
          Your next story
          <span className="block text-white/35">
            starts out there.
          </span>
        </h2>
      </div>

      <div className="lg:flex lg:justify-end">
        <a
          href="https://wa.me/918482846287"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-orange-500 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#17251d]"
        >
          Plan Your Adventure
          <span className="ml-3">↗</span>
        </a>
      </div>
    </div>

    {/* MAIN FOOTER GRID */}
    <div className="grid gap-12 py-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">

      {/* BRAND */}
      <div>
        <div className="relative h-20 w-64">
          <Image
            src="/bucketlist-logo.png"
            alt="Bucketlist Adventure"
            fill
            className="object-contain object-left"
            sizes="208px"
          />
        </div>

        <p className="mt-6 max-w-sm text-base leading-7 text-white/55">
          Thoughtfully designed treks, expeditions and journeys across India
          and beyond.
        </p>

        <p className="mt-5 text-lg font-semibold text-white">
          We Plan It.
          <span className="text-white/40">
            {" "}You Live It.
          </span>
        </p>
      </div>

      {/* EXPLORE */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
          Explore
        </p>

        <div className="mt-5 flex flex-col gap-3 text-sm text-white/60">
          <a href="/about" className="transition hover:text-white">
            About Us
          </a>

          <a href="#destinations" className="transition hover:text-white">
            Destinations
          </a>

          <a href="#adventures" className="transition hover:text-white">
            Upcoming Adventures
          </a>

          <a href="/trips" className="transition hover:text-white">
            All Trips
          </a>

          <a href="#contact" className="transition hover:text-white">
            Contact
          </a>
        </div>
      </div>

      {/* ADVENTURES */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
          Adventures
        </p>

        <div className="mt-5 flex flex-col gap-3 text-sm text-white/60">
          <a href="/trips" className="transition hover:text-white">
            Weekend Treks
          </a>

          <a href="/trips" className="transition hover:text-white">
            Himalayan Expeditions
          </a>

          <a href="/trips" className="transition hover:text-white">
            Road Journeys
          </a>

          <a
            href="https://wa.me/918482846287"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-white"
          >
            Custom Trips
          </a>

          <a href="#contact" className="transition hover:text-white">
            Corporate Adventures
          </a>
        </div>
      </div>

      {/* CONNECT */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
          Connect
        </p>

        <div className="mt-5 space-y-4 text-sm">
          <a
            href="https://www.instagram.com/bucketlistadventuure/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between border-b border-white/10 pb-3 text-white/65 transition hover:text-white"
          >
            <span>Instagram</span>
            <span className="transition group-hover:translate-x-1">↗</span>
          </a>

          <a
            href="https://www.facebook.com/bucketlistadventures2018/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between border-b border-white/10 pb-3 text-white/65 transition hover:text-white"
          >
            <span>Facebook</span>
            <span className="transition group-hover:translate-x-1">↗</span>
          </a>

          <a
            href={
              googleReviews?.place.googleMapsUri ||
              "https://share.google/f7H5lX1yIKrFREz6R"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between border-b border-white/10 pb-3 text-white/65 transition hover:text-white"
          >
            <span>
              Google Reviews
              {googleReviews?.place.rating
                ? ` · ${googleReviews.place.rating.toFixed(1)} ★`
                : ""}
            </span>

            <span className="transition group-hover:translate-x-1">↗</span>
          </a>

          <a
            href="https://wa.me/918482846287"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between border-b border-white/10 pb-3 text-white/65 transition hover:text-white"
          >
            <span>WhatsApp</span>
            <span className="transition group-hover:translate-x-1">↗</span>
          </a>
        </div>
      </div>

    </div>

    {/* SOCIAL STRIP */}
    <div className="grid gap-3 border-t border-white/10 py-8 sm:grid-cols-2 lg:grid-cols-4">

      <a
        href="https://www.instagram.com/bucketlistadventuure/"
        target="_blank"
        rel="noopener noreferrer"
        className="group rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:bg-white hover:text-[#17251d]"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300 group-hover:text-orange-500">
          Instagram
        </p>

        <p className="mt-2 font-semibold">
          @bucketlistadventuure ↗
        </p>
      </a>

      <a
        href="https://www.facebook.com/bucketlistadventures2018/"
        target="_blank"
        rel="noopener noreferrer"
        className="group rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:bg-white hover:text-[#17251d]"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300 group-hover:text-orange-500">
          Facebook
        </p>

        <p className="mt-2 font-semibold">
          Bucketlist Adventures ↗
        </p>
      </a>

      <a
        href={
          googleReviews?.place.googleMapsUri ||
          "https://share.google/f7H5lX1yIKrFREz6R"
        }
        target="_blank"
        rel="noopener noreferrer"
        className="group rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:bg-white hover:text-[#17251d]"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300 group-hover:text-orange-500">
          Google Reviews
        </p>

        <p className="mt-2 font-semibold">
          {googleReviews?.place.rating
            ? `${googleReviews.place.rating.toFixed(1)} ★ · ${googleReviews.place.reviewCount.toLocaleString(
                "en-IN"
              )} reviews`
            : "Read traveller reviews"}{" "}
          ↗
        </p>
      </a>

      <a
        href="https://wa.me/918482846287"
        target="_blank"
        rel="noopener noreferrer"
        className="group rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:bg-white hover:text-[#17251d]"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300 group-hover:text-orange-500">
          WhatsApp
        </p>

        <p className="mt-2 font-semibold">
          Plan a Trip ↗
        </p>
      </a>

    </div>

    {/* BOTTOM BAR */}
    <div className="flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
      <p>
        © {new Date().getFullYear()} Bucketlist Adventure. All rights reserved.
      </p>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <a
  href="/privacy-policy"
  className="transition hover:text-white"
>
  Privacy Policy
</a>

<a
  href="/terms-and-conditions"
  className="transition hover:text-white"
>
  Terms & Conditions
</a>

<a
  href="/cancellation-policy"
  className="transition hover:text-white"
>
  Cancellation & Refund Policy
</a>
      </div>
    </div>

  </div>
</footer>

    </main>
  );
}