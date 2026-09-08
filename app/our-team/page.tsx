import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {title: "Our Team", description: "Meet the people behind Bucketlist Adventure.", alternates: {canonical: "https://bucketlistadventure.in/our-team"}};
export default function OurTeamPage() { return (<main className="min-h-screen bg-[#f5f3ee] text-[#17251d]"><nav aria-label="Page navigation" className="mx-auto flex max-w-[1400px] flex-wrap gap-6 px-6 pt-8"><Link href="/">← Home</Link><Link href="/trips">Trips</Link><Link href="/corporate-outings-pune">Corporate Adventures</Link><Link href="/contact">Contact</Link></nav>{/* MEET THE TEAM */}
<section className="relative overflow-hidden bg-[#f5f3ee] px-6 py-20 sm:py-24 lg:px-10 lg:py-36">
  <div className="mx-auto max-w-[1400px]">

    {/* Heading */}
    <div className="mb-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
      <div>
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-orange-500">
          Meet the Team
        </p>

        <h1 className="max-w-4xl text-4xl font-bold leading-[0.95] tracking-[-0.045em] text-[#17251d] sm:text-5xl lg:text-7xl">
          The people behind
          <span className="block text-[#8a958e]">
            every great journey.
          </span>
        </h1>
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
</section></main>);}
