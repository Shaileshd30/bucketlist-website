import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and Conditions of Bucketlist Adventure for bookings, trips, treks, expeditions and travel services.",
};

export default function TermsAndConditionsPage() {
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
            Terms & Conditions
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
            These Terms & Conditions govern bookings, registrations and travel
            services provided by Bucketlist Adventure.
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
                These Terms & Conditions apply to all bookings, registrations,
                treks, expeditions, tours, road journeys, corporate outings,
                customized trips and other travel services offered by
                Bucketlist Adventure.
              </p>

              <p>
                By making a booking, submitting a registration form or making
                payment to Bucketlist Adventure, the participant agrees to
                these Terms & Conditions.
              </p>
            </PolicySection>

            <PolicySection title="2. Booking and Confirmation">
              <p>
                A booking is considered confirmed only after the required
                payment has been received and confirmation has been issued by
                Bucketlist Adventure.
              </p>

              <p>
                Availability may be limited and is subject to confirmation at
                the time of booking.
              </p>
            </PolicySection>

            <PolicySection title="3. Payments">
              <p>
                Participants are responsible for making payments within the
                timelines communicated by Bucketlist Adventure.
              </p>

              <p>
                Failure to make payment within the required timeline may result
                in cancellation of the booking or release of the reserved slot.
              </p>
            </PolicySection>

            <PolicySection title="4. Prices">
              <p>
                Prices are based on the inclusions mentioned for the specific
                trip or service.
              </p>

              <p>
                Unless specifically stated, personal expenses, additional
                meals, optional activities, insurance, medical expenses and
                services outside the published inclusions are not included.
              </p>
            </PolicySection>

            <PolicySection title="5. Cancellation and Refunds">
              <p>
                Cancellations and refunds are governed by the Bucketlist
                Adventure Cancellation & Refund Policy published on this
                website.
              </p>

              <p>
                Participants are advised to review the cancellation policy
                before making payment or confirming a booking.
              </p>
            </PolicySection>

            <PolicySection title="6. Changes to Itinerary">
              <p>
                Adventure travel is affected by weather, road conditions,
                government restrictions, local circumstances, safety concerns,
                natural events and other factors beyond reasonable control.
              </p>

              <p>
                Bucketlist Adventure reserves the right to modify the route,
                schedule, accommodation, transport, activity sequence or other
                itinerary elements when necessary for safety, operational or
                logistical reasons.
              </p>
            </PolicySection>

            <PolicySection title="7. Trip Cancellation by Bucketlist Adventure">
              <p>
                Bucketlist Adventure may cancel or postpone a trip due to
                insufficient participation, unsafe conditions, natural
                disasters, government restrictions, transport disruption or
                other circumstances that make operation impractical or unsafe.
              </p>

              <p>
                Where applicable, participants will be informed of available
                alternatives, rescheduling options or refunds based on the
                nature of the cancellation and costs already committed to third
                parties.
              </p>
            </PolicySection>

            <PolicySection title="8. Participant Responsibility">
              <p>
                Participants are responsible for providing accurate personal,
                medical and emergency information when requested.
              </p>

              <p>
                Participants must follow the instructions of trip leaders,
                coordinators, guides and local authorities, particularly in
                matters relating to safety.
              </p>
            </PolicySection>

            <PolicySection title="9. Fitness and Medical Conditions">
              <p>
                Adventure activities may involve trekking, altitude, uneven
                terrain, changing weather and physical exertion.
              </p>

              <p>
                Participants are responsible for assessing their fitness and
                disclosing relevant medical conditions before participation.
                Bucketlist Adventure may request medical clearance for certain
                expeditions or activities.
              </p>
            </PolicySection>

            <PolicySection title="10. Safety">
              <p>
                Bucketlist Adventure follows a safety-first approach and may
                alter, delay or discontinue an activity if conditions are
                considered unsafe.
              </p>

              <p>
                Participants must cooperate with safety instructions and use
                required safety equipment where applicable.
              </p>
            </PolicySection>

            <PolicySection title="11. Adventure Risk">
              <p>
                Trekking, mountaineering, road travel, camping and adventure
                activities involve inherent risks that cannot be completely
                eliminated.
              </p>

              <p>
                By participating, travellers acknowledge the nature of such
                activities and agree to follow reasonable safety instructions
                provided by Bucketlist Adventure and its representatives.
              </p>
            </PolicySection>

            <PolicySection title="12. Documents and Permits">
              <p>
                Participants must provide valid identification and other
                documents required for permits, hotels, transportation or
                regulatory purposes.
              </p>

              <p>
                Bucketlist Adventure will not be responsible for consequences
                arising from incorrect, invalid or incomplete documentation
                provided by the participant.
              </p>
            </PolicySection>

            <PolicySection title="13. Personal Belongings">
              <p>
                Participants are responsible for their personal belongings,
                luggage, equipment, cash, valuables and electronic devices.
              </p>

              <p>
                Bucketlist Adventure is not responsible for loss, theft or
                damage to personal property except where liability is required
                by applicable law.
              </p>
            </PolicySection>

            <PolicySection title="14. Behaviour and Conduct">
              <p>
                Participants are expected to behave responsibly and respectfully
                toward other travellers, staff, local communities and the
                environment.
              </p>

              <p>
                Bucketlist Adventure may remove a participant from a trip if
                their behaviour creates a serious safety risk, causes
                harassment, disrupts the group or violates applicable laws.
              </p>
            </PolicySection>

            <PolicySection title="15. Third-Party Services">
              <p>
                Certain services may be provided by independent hotels,
                transport operators, local guides, activity providers and other
                third parties.
              </p>

              <p>
                While Bucketlist Adventure selects and coordinates such
                services with reasonable care, third-party services may be
                subject to their own operating conditions and policies.
              </p>
            </PolicySection>

            <PolicySection title="16. Force Majeure">
              <p>
                Bucketlist Adventure will not be responsible for delays,
                cancellations or service disruption caused by events beyond
                reasonable control, including natural disasters, extreme
                weather, landslides, floods, strikes, civil disturbances,
                government restrictions, epidemics, transport disruption or
                similar events.
              </p>
            </PolicySection>

            <PolicySection title="17. Photography and Media">
              <p>
                Photographs or videos may be taken during trips for memories,
                documentation and promotional purposes.
              </p>

              <p>
                Participants who do not wish to appear in promotional content
                should inform the Bucketlist Adventure team before or during
                the trip.
              </p>
            </PolicySection>

            <PolicySection title="18. Website and Information">
              <p>
                Bucketlist Adventure makes reasonable efforts to keep website
                information accurate and current. However, trip details, prices,
                dates and inclusions may change due to operational or external
                circumstances.
              </p>
            </PolicySection>

            <PolicySection title="19. Governing Law">
              <p>
                These Terms & Conditions are governed by the laws applicable in
                India.
              </p>

              <p>
                Any dispute arising in connection with Bucketlist Adventure
                services shall be subject to the jurisdiction of the competent
                courts in Pune, Maharashtra, unless otherwise required by
                applicable law.
              </p>
            </PolicySection>

            <PolicySection title="20. Contact">
              <p>
                Questions regarding these Terms & Conditions may be submitted
                using the contact information available on the Bucketlist
                Adventure website.
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