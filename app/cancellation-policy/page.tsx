import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description:
    "Cancellation and Refund Policy of Bucketlist Adventure for treks, trips, expeditions and travel services.",
};

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">
      <section className="bg-[#17251d] px-6 py-20 text-white sm:py-24 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="text-sm font-semibold text-orange-300 transition hover:text-white"
          >
            ← Back to Bucketlist Adventure
          </Link>

          <p className="mt-12 text-xs font-bold uppercase tracking-[0.3em] text-orange-300">
            Legal
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-7xl">
            Cancellation & Refund Policy
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
            This policy explains the cancellation, rescheduling and refund
            terms applicable to bookings made with Bucketlist Adventure.
          </p>

          <p className="mt-6 text-sm text-white/40">
            Last updated: August 2026
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[32px] border border-black/10 bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.05)] sm:p-10 lg:p-14">
            <PolicySection title="1. General">
              <p>
                This Cancellation & Refund Policy applies to bookings for
                treks, tours, expeditions, road trips, camping, corporate
                outings, customized journeys and other travel services offered
                by Bucketlist Adventure.
              </p>

              <p>
                By confirming a booking or making payment, the participant
                agrees to the cancellation and refund conditions described
                below.
              </p>
            </PolicySection>

            <PolicySection title="2. Cancellation of 1-Day and 2-Day Trips">
              <p>
                For trips with a duration of one day or two days, cancellation
                is not permitted within 48 hours of the scheduled departure
                time.
              </p>

              <p>
                Any booking cancelled within 48 hours of departure will be
                treated as non-refundable.
              </p>

              <p>
                For cancellations made more than 48 hours before departure,
                the applicable refund or rescheduling terms communicated at the
                time of booking will apply.
              </p>
            </PolicySection>

            <PolicySection title="3. Cancellation of Trips Longer Than 2 Days">
              <p>
                For trips with a duration of more than two days, the following
                cancellation charges apply unless different terms are clearly
                mentioned for a specific trip:
              </p>

              <div className="mt-5 overflow-hidden rounded-[22px] border border-black/10">
                <div className="grid grid-cols-[1.2fr_0.8fr] bg-[#17251d] px-5 py-4 text-sm font-bold text-white">
                  <span>Cancellation Period</span>
                  <span>Refund</span>
                </div>

                {[
                  ["More than 30 days before departure", "90% refund"],
                  ["15 to 30 days before departure", "75% refund"],
                  ["7 to 14 days before departure", "50% refund"],
                  ["Less than 7 days before departure", "No refund"],
                ].map(([period, refund]) => (
                  <div
                    key={period}
                    className="grid grid-cols-[1.2fr_0.8fr] border-t border-black/10 px-5 py-4 text-sm text-[#5d6862]"
                  >
                    <span>{period}</span>
                    <span className="font-semibold text-[#17251d]">
                      {refund}
                    </span>
                  </div>
                ))}
              </div>
            </PolicySection>

            <PolicySection title="4. No-Show">
              <p>
                If a participant fails to report at the specified departure
                location and time, the booking will be treated as a no-show.
              </p>

              <p>
                No refund will be provided for no-shows or for participants who
                voluntarily leave a trip after it has commenced.
              </p>
            </PolicySection>

            <PolicySection title="5. Cancellation After Trip Commencement">
              <p>
                No refund will be provided for unused services if a participant
                chooses to discontinue a trip after departure.
              </p>

              <p>
                This includes unused accommodation, transport, meals,
                activities, permits or other services included in the booking.
              </p>
            </PolicySection>

            <PolicySection title="6. Cancellation by Bucketlist Adventure">
              <p>
                Bucketlist Adventure may cancel, postpone or reschedule a trip
                due to circumstances including unsafe weather, natural
                disasters, road closures, government restrictions, transport
                disruption, insufficient participation or other operational
                or safety-related reasons.
              </p>

              <p>
                In such cases, participants may be offered an alternative date,
                trip credit, rescheduling option or refund depending on the
                circumstances and non-recoverable costs already paid to third
                parties.
              </p>
            </PolicySection>

            <PolicySection title="7. Weather and Natural Conditions">
              <p>
                Adventure travel is highly dependent on weather, road and local
                conditions.
              </p>

              <p>
                A change in weather, snowfall, heavy rainfall, landslide,
                flooding, route closure or similar condition does not
                automatically qualify a booking for a full refund.
              </p>

              <p>
                Bucketlist Adventure may modify the itinerary, route, activity
                or schedule when required for participant safety.
              </p>
            </PolicySection>

            <PolicySection title="8. Force Majeure">
              <p>
                Refunds may be limited where a trip is affected by events
                beyond the reasonable control of Bucketlist Adventure,
                including natural disasters, extreme weather, strikes,
                government orders, civil disturbance, epidemics, transport
                shutdowns, political restrictions or similar events.
              </p>

              <p>
                Any refundable amount will be determined after deducting
                expenses and commitments that cannot be recovered from hotels,
                transporters, local operators or other service providers.
              </p>
            </PolicySection>

            <PolicySection title="9. Third-Party Cancellation Charges">
              <p>
                Certain bookings may involve hotels, transport, flights,
                permits, activity providers or other third-party services.
              </p>

              <p>
                If a third-party service provider imposes a cancellation charge
                or retains an advance payment, such non-recoverable amounts may
                be deducted from the customer's refund.
              </p>
            </PolicySection>

            <PolicySection title="10. Flight, Train and Transport Tickets">
              <p>
                Where flight, train, bus or other transport tickets are booked
                separately or on behalf of the customer, cancellation and
                refund terms of the respective carrier will apply.
              </p>

              <p>
                Any applicable cancellation fees, convenience fees or service
                charges may be deducted from the refundable amount.
              </p>
            </PolicySection>

            <PolicySection title="11. Rescheduling">
              <p>
                Rescheduling requests are subject to availability and may not
                be possible for every trip.
              </p>

              <p>
                Additional charges may apply where hotels, transport, permits
                or other arrangements need to be changed.
              </p>

              <p>
                Approval of a rescheduling request is at the discretion of
                Bucketlist Adventure and the relevant service providers.
              </p>
            </PolicySection>

            <PolicySection title="12. Transfer of Booking">
              <p>
                Transfer of a booking to another participant may be permitted
                in certain cases if operationally possible and if the required
                documents can be updated in time.
              </p>

              <p>
                Any additional charges arising from name changes, permits,
                tickets or third-party services must be borne by the customer.
              </p>
            </PolicySection>

            <PolicySection title="13. Refund Processing">
              <p>
                Approved refunds will be processed through the original payment
                method where reasonably possible.
              </p>

              <p>
                Refund processing may take approximately 7 to 14 business days
                after approval, depending on the payment method, banking
                network and payment service provider.
              </p>

              <p>
                Bank processing timelines are outside the direct control of
                Bucketlist Adventure.
              </p>
            </PolicySection>

            <PolicySection title="14. Payment Gateway Charges">
              <p>
                Payment gateway, convenience or transaction charges may be
                non-refundable where such charges have already been collected
                or retained by the payment service provider.
              </p>
            </PolicySection>

            <PolicySection title="15. Special Departures and Promotional Bookings">
              <p>
                Certain fixed departures, promotional offers, discounted
                bookings, festival departures or special packages may have
                separate cancellation terms.
              </p>

              <p>
                Where specific cancellation terms are mentioned on the trip
                page, invoice, quotation, booking confirmation or registration
                form, those trip-specific terms will apply.
              </p>
            </PolicySection>

            <PolicySection title="16. Corporate and Customized Trips">
              <p>
                Corporate outings, private groups and customized trips may
                involve advance commitments to hotels, transporters, venues,
                activity providers and other suppliers.
              </p>

              <p>
                Cancellation terms for such bookings may therefore differ from
                the standard policy and will be communicated in the relevant
                quotation, proposal or confirmation.
              </p>
            </PolicySection>

            <PolicySection title="17. Refund Eligibility">
              <p>
                Refund eligibility is calculated from the scheduled departure
                date and the date on which Bucketlist Adventure receives the
                customer's written cancellation request.
              </p>
            </PolicySection>

            <PolicySection title="18. How to Request Cancellation">
              <p>
                Cancellation requests should be communicated to Bucketlist
                Adventure through the official contact channels provided on
                the website or through the communication channel used for the
                booking.
              </p>

              <p>
                A cancellation will be considered received only after it has
                been acknowledged by Bucketlist Adventure.
              </p>
            </PolicySection>

            <PolicySection title="19. Policy Updates">
              <p>
                Bucketlist Adventure may update this Cancellation & Refund
                Policy from time to time.
              </p>

              <p>
                The version published on the website at the time of booking,
                together with any trip-specific terms communicated to the
                participant, will apply.
              </p>
            </PolicySection>

            <PolicySection title="20. Contact">
              <p>
                For questions regarding cancellations, refunds or rescheduling,
                please contact Bucketlist Adventure using the contact
                information available on our website.
              </p>

              <p className="font-semibold text-[#17251d]">
                Bucketlist Adventure
                <br />
                Pune, Maharashtra, India
              </p>
            </PolicySection>
          </div>
        </div>
      </section>
    </main>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-black/10 py-8 first:pt-0 last:border-0 last:pb-0">
      <h2 className="text-xl font-bold tracking-tight text-[#17251d] sm:text-2xl">
        {title}
      </h2>

      <div className="mt-4 space-y-4 text-[15px] leading-7 text-[#5d6862]">
        {children}
      </div>
    </section>
  );
}