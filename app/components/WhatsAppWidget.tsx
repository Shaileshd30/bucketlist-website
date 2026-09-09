"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const WHATSAPP_NUMBER = "918482846287";

function buildMessage(pathname: string) {
  if (pathname.startsWith("/corporate-outings-pune")) {
    return "Hi Bucketlist Adventure! 👋 I’m interested in planning a corporate outing. Please share the options and details.";
  }

  if (pathname.startsWith("/trips/")) {
    return "Hi Bucketlist Adventure! 👋 I’m interested in this trip. Please share the available batches, price and booking details.";
  }

  if (pathname.startsWith("/treks-near-pune")) {
    return "Hi Bucketlist Adventure! 👋 I’m looking for treks near Pune. Please share the upcoming options.";
  }

  return "Hi Bucketlist Adventure! 👋 I found you through your website and would like help planning my next adventure.";
}

function WhatsAppIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={`block shrink-0 ${className}`}
    >
      <path d="M20.52 3.48A11.91 11.91 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.94c0 2.1.55 4.15 1.6 5.96L0 24l6.26-1.64a11.9 11.9 0 0 0 5.78 1.47h.01C18.63 23.83 24 18.48 24 11.89a11.84 11.84 0 0 0-3.48-8.41ZM12.05 21.82h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.72.98.99-3.63-.23-.37a9.87 9.87 0 0 1-1.51-5.27c0-5.47 4.45-9.92 9.93-9.92a9.85 9.85 0 0 1 7.02 2.91 9.86 9.86 0 0 1 2.9 7.02c0 5.48-4.45 9.93-9.98 9.87Zm5.44-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

export default function WhatsAppWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const message = buildMessage(pathname);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;

  // Trip-detail pages already have the dedicated mobile booking bar.
  const isTripDetailPage =
    pathname.startsWith("/trips/") && pathname !== "/trips";

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Close WhatsApp chat" : "Open WhatsApp chat"}
                className={`fixed bottom-5 right-4 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_35px_rgba(0,0,0,0.28)] transition duration-300 hover:scale-105 sm:bottom-7 sm:right-7 sm:h-14 sm:w-14 ${
          isTripDetailPage ? "hidden md:flex" : ""
        }`}
      >
        {isOpen ? (
          <span className="text-3xl leading-none">×</span>
        ) : (
          <WhatsAppIcon />
        )}
      </button>

      {/* Chat card */}
      <div
        className={`fixed bottom-24 right-5 z-[79] w-[calc(100vw-2.5rem)] max-w-[360px] origin-bottom-right transition-all duration-300 sm:bottom-28 sm:right-7 ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="bg-[#17251d] px-6 py-6 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]">
                <WhatsAppIcon />
              </div>

              <div>
                <p className="text-sm font-medium text-white/70">
                  Bucketlist Adventure
                </p>
                <p className="text-lg font-semibold">
                  Plan your next adventure
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-white/75">
              Need help choosing a trek, tour or departure? Chat with our team
              directly on WhatsApp.
            </p>
          </div>

          <div className="p-6">
            <div className="mb-5 rounded-2xl bg-[#f5f3ee] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-[#25D366]" />

                <div>
                  <p className="font-semibold text-[#17251d]">
                    Trip Enquiries & Bookings
                  </p>

                  <p className="mt-1 text-sm leading-5 text-black/60">
                    Ask us about upcoming batches, pricing, custom trips or
                    corporate outings.
                  </p>
                </div>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 font-semibold text-white transition hover:brightness-95"
            >
              <WhatsAppIcon className="h-5 w-5" />

              Chat on WhatsApp
            </a>

            <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-black/40">
              We Plan It. You Live It.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}