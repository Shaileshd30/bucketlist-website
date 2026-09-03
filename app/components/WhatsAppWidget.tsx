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
        className={`fixed bottom-6 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_35px_rgba(0,0,0,0.28)] transition duration-300 hover:scale-105 sm:bottom-7 sm:right-7 ${
          isTripDetailPage ? "hidden md:flex" : ""
        }`}
      >
        {isOpen ? (
          <span className="text-3xl leading-none">×</span>
        ) : (
          <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="h-7 w-7 fill-current"
          >
            <path d="M19.11 17.23c-.46-.23-2.7-1.33-3.12-1.48-.42-.16-.73-.23-1.03.23-.31.46-1.19 1.48-1.46 1.79-.27.31-.54.35-1 .12-.46-.23-1.94-.72-3.7-2.29-1.37-1.22-2.29-2.73-2.56-3.19-.27-.46-.03-.71.2-.94.21-.21.46-.54.69-.81.23-.27.31-.46.46-.77.15-.31.08-.58-.04-.81-.12-.23-1.03-2.48-1.41-3.4-.37-.89-.75-.77-1.03-.78-.27-.01-.58-.01-.88-.01-.31 0-.81.12-1.23.58-.42.46-1.61 1.57-1.61 3.83 0 2.26 1.65 4.44 1.88 4.75.23.31 3.24 4.95 7.85 6.94 1.1.47 1.95.75 2.62.96 1.1.35 2.1.3 2.89.18.88-.13 2.7-1.1 3.08-2.17.38-1.07.38-1.99.27-2.17-.12-.19-.42-.31-.88-.54Z" />
            <path d="M16.03 2.67C8.68 2.67 2.7 8.65 2.7 16c0 2.35.61 4.64 1.76 6.65L2.59 29.5l7.01-1.84A13.24 13.24 0 0 0 16.03 29.33c7.35 0 13.33-5.98 13.33-13.33S23.38 2.67 16.03 2.67Zm0 24.42c-2.03 0-4.02-.55-5.75-1.58l-.41-.24-4.16 1.09 1.11-4.06-.27-.42A11.08 11.08 0 0 1 4.94 16c0-6.12 4.98-11.09 11.09-11.09S27.12 9.88 27.12 16 22.14 27.09 16.03 27.09Z" />
          </svg>
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
                <svg
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                  className="h-7 w-7 fill-white"
                >
                  <path d="M19.11 17.23c-.46-.23-2.7-1.33-3.12-1.48-.42-.16-.73-.23-1.03.23-.31.46-1.19 1.48-1.46 1.79-.27.31-.54.35-1 .12-.46-.23-1.94-.72-3.7-2.29-1.37-1.22-2.29-2.73-2.56-3.19-.27-.46-.03-.71.2-.94.21-.21.46-.54.69-.81.23-.27.31-.46.46-.77.15-.31.08-.58-.04-.81-.12-.23-1.03-2.48-1.41-3.4-.37-.89-.75-.77-1.03-.78-.27-.01-.58-.01-.88-.01-.31 0-.81.12-1.23.58-.42.46-1.61 1.57-1.61 3.83 0 2.26 1.65 4.44 1.88 4.75.23.31 3.24 4.95 7.85 6.94 1.1.47 1.95.75 2.62.96 1.1.35 2.1.3 2.89.18.88-.13 2.7-1.1 3.08-2.17.38-1.07.38-1.99.27-2.17-.12-.19-.42-.31-.88-.54Z" />
                </svg>
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
              <svg
                viewBox="0 0 32 32"
                aria-hidden="true"
                className="h-5 w-5 fill-current"
              >
                <path d="M19.11 17.23c-.46-.23-2.7-1.33-3.12-1.48-.42-.16-.73-.23-1.03.23-.31.46-1.19 1.48-1.46 1.79-.27.31-.54.35-1 .12-.46-.23-1.94-.72-3.7-2.29-1.37-1.22-2.29-2.73-2.56-3.19-.27-.46-.03-.71.2-.94.21-.21.46-.54.69-.81.23-.27.31-.46.46-.77.15-.31.08-.58-.04-.81-.12-.23-1.03-2.48-1.41-3.4-.37-.89-.75-.77-1.03-.78-.27-.01-.58-.01-.88-.01-.31 0-.81.12-1.23.58-.42.46-1.61 1.57-1.61 3.83 0 2.26 1.65 4.44 1.88 4.75.23.31 3.24 4.95 7.85 6.94 1.1.47 1.95.75 2.62.96 1.1.35 2.1.3 2.89.18.88-.13 2.7-1.1 3.08-2.17.38-1.07.38-1.99.27-2.17-.12-.19-.42-.31-.88-.54Z" />
              </svg>

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