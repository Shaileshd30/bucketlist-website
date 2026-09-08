"use client";
export default function TripEnquirySection() { return (
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
</section>);}
