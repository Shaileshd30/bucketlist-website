import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy of Bucketlist Adventure explaining how customer information is collected, used, stored and protected.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">
      {/* HERO */}
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
            Privacy Policy
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
            Bucketlist Adventure respects your privacy and is committed to
            protecting the personal information you share with us.
          </p>

          <p className="mt-6 text-sm text-white/40">
            Last updated: August 2026
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="px-6 py-16 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[32px] border border-black/10 bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.05)] sm:p-10 lg:p-14">
            <PolicySection title="1. Introduction">
              <p>
                This Privacy Policy explains how Bucketlist Adventure
                (&quot;Bucketlist Adventure&quot;, &quot;we&quot;,
                &quot;us&quot; or &quot;our&quot;) collects, uses, stores and
                protects personal information when you visit our website,
                submit an enquiry, register for a trip, make a booking, make a
                payment or otherwise interact with our services.
              </p>

              <p>
                By using our website or providing information to Bucketlist
                Adventure, you acknowledge the practices described in this
                Privacy Policy.
              </p>
            </PolicySection>

            <PolicySection title="2. Information We Collect">
              <p>
                Depending on the service being requested, Bucketlist Adventure
                may collect information including:
              </p>

              <ul>
                <li>Name</li>
                <li>Phone number and WhatsApp number</li>
                <li>Email address</li>
                <li>Residential or correspondence address where required</li>
                <li>Age, gender and date of birth where required</li>
                <li>Emergency contact information</li>
                <li>
                  Government identification information where required for
                  permits, accommodation, transportation or travel arrangements
                </li>
                <li>
                  Trip preferences, destination, travel dates and group size
                </li>
                <li>Booking and transaction information</li>
                <li>
                  Information submitted through registration forms, enquiries,
                  WhatsApp, email or other communication channels
                </li>
              </ul>
            </PolicySection>

            <PolicySection title="3. How We Use Your Information">
              <p>
                Bucketlist Adventure may use personal information for purposes
                including:
              </p>

              <ul>
                <li>Responding to enquiries</li>
                <li>Processing trip registrations and bookings</li>
                <li>Confirming and managing payments</li>
                <li>Planning and operating trips and travel services</li>
                <li>
                  Arranging accommodation, transportation, permits and other
                  travel services
                </li>
                <li>
                  Communicating itineraries, pickup details and trip updates
                </li>
                <li>Providing customer support</li>
                <li>Managing participant safety and emergency requirements</li>
                <li>Maintaining booking and transaction records</li>
                <li>Improving our website and services</li>
                <li>
                  Meeting applicable legal, accounting and regulatory
                  obligations
                </li>
              </ul>
            </PolicySection>

            <PolicySection title="4. Payment Information">
              <p>
                Payments made through the Bucketlist Adventure website may be
                processed by authorized third-party payment gateways and
                payment service providers.
              </p>

              <p>
                Bucketlist Adventure does not ordinarily store sensitive
                payment authentication information such as complete card
                details, CVV, UPI PIN, internet banking passwords or OTPs.
              </p>

              <p>
                Payment providers process payment information according to
                their own security standards, privacy policies and regulatory
                requirements.
              </p>
            </PolicySection>

            <PolicySection title="5. Sharing of Information">
              <p>
                Bucketlist Adventure does not sell or rent customer personal
                information.
              </p>

              <p>
                Information may be shared where reasonably necessary with
                service providers involved in delivering a booking, including:
              </p>

              <ul>
                <li>Hotels and accommodation providers</li>
                <li>Transport providers</li>
                <li>Local operators and destination partners</li>
                <li>Guides, coordinators and trip leaders</li>
                <li>Activity providers</li>
                <li>Permit and regulatory authorities where required</li>
                <li>Payment processors and payment gateways</li>
                <li>
                  Technology providers supporting our website and booking
                  systems
                </li>
              </ul>

              <p>
                We aim to share only information reasonably necessary to
                provide the relevant service.
              </p>
            </PolicySection>

            <PolicySection title="6. Health and Emergency Information">
              <p>
                Trekking, expeditions and other adventure activities may
                require participants to provide relevant health information,
                emergency contact information or medical declarations.
              </p>

              <p>
                Such information may be used for trip preparation, participant
                safety and emergency response.
              </p>

              <p>
                Participants are responsible for providing complete and
                accurate information where requested.
              </p>
            </PolicySection>

            <PolicySection title="7. Cookies and Website Usage">
              <p>
                The Bucketlist Adventure website may use cookies and similar
                technologies to support website functionality, understand
                website usage, improve performance and enhance the visitor
                experience.
              </p>

              <p>
                Third-party services integrated into our website may also use
                cookies or similar technologies in accordance with their own
                privacy policies.
              </p>
            </PolicySection>

            <PolicySection title="8. Analytics and Technical Information">
              <p>
                When you visit our website, certain technical information may
                be collected automatically, such as browser type, device type,
                pages visited, referring pages and general usage information.
              </p>

              <p>
                This information may be used to maintain, secure and improve
                the performance of our website.
              </p>
            </PolicySection>

            <PolicySection title="9. Communication">
              <p>
                Bucketlist Adventure may contact customers regarding enquiries,
                bookings, payments, itineraries, safety instructions,
                rescheduling, cancellations and other information related to
                requested services.
              </p>

              <p>
                Where permitted, we may also communicate information about
                upcoming trips, offers or travel experiences. Customers may
                request to stop receiving promotional communications.
              </p>
            </PolicySection>

            <PolicySection title="10. Data Security">
              <p>
                Bucketlist Adventure takes reasonable administrative and
                technical measures to protect personal information from
                unauthorized access, misuse, disclosure, alteration or loss.
              </p>

              <p>
                However, no internet transmission, website or electronic
                storage system can be guaranteed to be completely secure.
              </p>
            </PolicySection>

            <PolicySection title="11. Data Retention">
              <p>
                Personal information may be retained for as long as reasonably
                necessary to provide services, maintain booking and accounting
                records, resolve disputes, prevent fraud and comply with
                applicable legal or regulatory requirements.
              </p>
            </PolicySection>

            <PolicySection title="12. Third-Party Websites">
              <p>
                Our website may contain links to external websites or services
                operated by third parties.
              </p>

              <p>
                Bucketlist Adventure is not responsible for the privacy,
                security or content practices of third-party websites.
              </p>
            </PolicySection>

            <PolicySection title="13. Children's Privacy">
              <p>
                Where a minor participates in a trip or travel service,
                information relating to the minor should be provided by or with
                the authorization of a parent or legal guardian, as
                appropriate.
              </p>
            </PolicySection>

            <PolicySection title="14. Your Information and Choices">
              <p>
                Subject to applicable law, customers may contact Bucketlist
                Adventure to request correction of inaccurate personal
                information or raise concerns about how their information is
                being used.
              </p>

              <p>
                Certain information may need to be retained for legal,
                regulatory, accounting, security or legitimate business
                purposes.
              </p>
            </PolicySection>

            <PolicySection title="15. Changes to This Privacy Policy">
              <p>
                Bucketlist Adventure may update this Privacy Policy from time
                to time to reflect changes in our website, services,
                operational requirements or applicable laws.
              </p>

              <p>
                The latest version will be published on this page together with
                the date of the most recent update.
              </p>
            </PolicySection>

            <PolicySection title="16. Contact Us">
              <p>
                If you have questions or concerns regarding this Privacy Policy
                or the handling of your personal information, please contact
                Bucketlist Adventure using the contact information provided on
                our website.
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

      <div className="mt-4 space-y-4 text-[15px] leading-7 text-[#5d6862] [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}