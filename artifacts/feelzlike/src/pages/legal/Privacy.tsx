import { LegalShell, Section } from "./LegalShell";

/**
 * feelzlike Privacy Policy.
 *
 * Substantively reflects the data the app actually collects today:
 *   - consent-mode analytics and first-party aggregate counters
 *   - Sentry crash reports
 *   - email + push subscriptions for alerts (opt-in, double-opt-in for email)
 *   - Clerk-backed accounts with a local profile row
 *   - account-free browsing of weather, transport and roads data
 *
 * NOTE FOR PUBLISHER: This is a working policy reviewed for accuracy
 * against the codebase, not a substitute for jurisdiction-specific legal
 * counsel. Have your operating entity's lawyer review before launch and
 * adjust the entity name / ABN / address block in the "Who we are"
 * section to match your registered details.
 */
export default function Privacy() {
  return (
    <LegalShell
      title="Privacy Policy"
      description="feelzlike privacy policy. Explains what data we collect, why, where it goes, and the rights you have over it."
      path="/legal/privacy"
      lastUpdated="24 September 2026"
    >
      <p>
        feelzlike respects your privacy. This policy explains what we
        collect, why, where it goes, and the rights you have over it. It
        applies to feelzlike.com and the feelzlike Progressive Web App
        (the &ldquo;Service&rdquo;).
      </p>

      <Section title="1 · Who we are">
        <p>
          The Service is operated by <strong>Navigate Work Digital Pty
          Ltd</strong> (Australia), trading as feelzlike. We are the
          data controller (GDPR) / business (CCPA) / handling business
          operator (APPI) for personal information collected through the
          Service.
        </p>
        <p>
          Contact for privacy enquiries:{" "}
          <a
            className="text-sky-700 hover:underline"
            href="mailto:info@feelzlike.com"
          >
            info@feelzlike.com
          </a>
          .
        </p>
      </Section>

      <Section title="2 · What we collect">
        <p>
          We try to collect as little as possible. You can browse most of
          feelzlike without an account.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Essential technical data</strong> · IP address, user
            agent, requested URL and timestamps. Used to deliver the
            page, apply rate limits, and protect the Service from abuse.
          </li>
          <li>
            <strong>Analytics</strong> · Google Analytics 4 loads with
            storage denied by default and may receive anonymous,
            cookieless measurement pings before you accept analytics.
            Accepting analytics enables full measurement, including a
            random device-scoped identifier and returning-visitor
            measurement. We also maintain first-party aggregate page and
            visitor counts using coarse page labels and a one-way,
            monthly rotating hash derived from network and browser data.
            Query strings are stripped except for a closed list of
            advertising campaign parameters. No name, email, precise
            location or alert-link token is sent as analytics data.
          </li>
          <li>
            <strong>Crash reports</strong> · stack traces and the URL
            path you were on when an error occurred, sent to Sentry so
            we can fix bugs. This runs by default because we need it
            to keep the Service stable. Personal information is
            redacted before sending · query strings and authentication
            tokens are stripped, and any session-replay capture masks
            all text and blocks media so the DOM structure is
            recorded without your typed content or images.
          </li>
          <li>
            <strong>Email alert subscriptions</strong> · your email
            address; regions and mountains; snowfall threshold, forecast
            horizon, delivery method and timezone; verification,
            unsubscribe and delivery records; and, for new signups,
            server-recorded consent time, policy version and signup
            surface. Used to verify ownership, send the alerts you asked
            for, prevent duplicate delivery and honour unsubscribe
            requests.
          </li>
          <li>
            <strong>Push notifications</strong> · a browser push
            endpoint and the alerts you opted in to. Used only to push
            the notifications you asked for.
          </li>
          <li>
            <strong>Accounts</strong> · Clerk stores the authentication
            identity and manages sessions. Our database stores a linked
            provider identifier, email address and account profile
            preferences such as display name, home region and units.
            Powder alerts remain available without an account.
          </li>
          <li>
            <strong>Approximate location</strong> (only if you allow
            it) · used in-browser to suggest the closest base town. We
            do not store your coordinates on our servers.
          </li>
        </ul>
        <p>
          We do not knowingly collect health, biometric, payment, or
          government identifier information through the Service.
        </p>
      </Section>

      <Section title="3 · Why we use it">
        <p>
          Lawful bases under GDPR / UK GDPR are listed in brackets.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Deliver the weather, road, transport and alert features you
            request (contract / legitimate interests).
          </li>
          <li>
            Keep the Service safe · rate limiting, abuse protection,
            error monitoring (legitimate interests).
          </li>
          <li>
            Send the email alerts and push notifications you opted in
            to (consent · withdrawable any time).
          </li>
          <li>
            Improve the product through aggregate analytics (consent ·
            withdrawable any time via the cookie banner).
          </li>
          <li>
            Comply with our legal obligations and respond to lawful
            requests (legal obligation).
          </li>
        </ul>
      </Section>

      <Section title="4 · Where your data is stored · sub-processors">
        <p>
          To deliver the Service we use a small number of service
          providers. They may process data in more than one country as
          described in their own privacy notices.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Hosting &amp; database</strong> · Replit Deployments
            and Replit-managed Postgres. Our production deployment is
            configured in the North America region. That deployment
            setting does not independently prove a fixed database
            residency.
          </li>
          <li>
            <strong>Authentication</strong> · Clerk, which stores account
            identity data and manages sign-in sessions.
          </li>
          <li>
            <strong>Crash &amp; performance monitoring</strong> ·
            Sentry (United States / European Union).
          </li>
          <li>
            <strong>Product analytics</strong> · Google Analytics 4
            (Google, United States), run in Google&apos;s Consent Mode.
            Before analytics consent, measurement is limited to
            cookieless pings with analytics storage denied. Full
            measurement, including cookies and returning-visitor
            detection, happens only after you accept. No name, email,
            precise location or alert-link token is sent as analytics
            data.
          </li>
          <li>
            <strong>Ad measurement</strong> · Meta Platforms (United
            States), loaded only after you accept ads in the cookie
            banner. The Meta Pixel records page views so we can measure
            ads we run on Facebook and Instagram. It never receives
            your email address, and alert-link security tokens are
            never sent to it.
          </li>
          <li>
            <strong>Email delivery</strong> · Resend, used for alert
            verification, powder alerts, unsubscribe-related messages
            and account deletion receipts.
          </li>
          <li>
            <strong>Mapping &amp; venue data</strong> · Google Maps and
            Google Places APIs are loaded by your browser when you open
            map / launchpad views.
          </li>
          <li>
            <strong>Weather &amp; road data</strong> · Open-Meteo,
            Australian Bureau of Meteorology, Transport for NSW,
            VicEmergency / VicTraffic, and the Japan Meteorological
            Agency. We pass anonymous lat / lng queries only.
          </li>
        </ul>
        <p>A current service-provider list is available on request.</p>
      </Section>

      <Section title="5 · We do not sell your data">
        <p>
          We do not sell, rent or trade personal information. We do not
          show third-party display advertising on the Service. If you
          accept ads in the cookie banner, the Meta Pixel measures
          whether our own ads on Facebook / Instagram brought you here ·
          you can decline or withdraw this at any time. We do not share
          email addresses with third parties for marketing.
        </p>
      </Section>

      <Section title="6 · Your rights · by country">
        <p>
          Your privacy rights depend on where you live and may include
          access, correction, deletion, restriction, portability,
          objection and withdrawal of consent. The frameworks below may
          apply; this summary is not a claim that every framework applies
          to every visitor.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Australia</strong> · Privacy Act 1988 (Cth) and the
            Australian Privacy Principles. Complaints can go to the
            Office of the Australian Information Commissioner (OAIC) at{" "}
            <a
              className="text-sky-700 hover:underline"
              href="https://www.oaic.gov.au"
              target="_blank"
              rel="noopener noreferrer"
            >
              oaic.gov.au
            </a>
            .
          </li>
          <li>
            <strong>Japan</strong> · Act on the Protection of Personal
            Information (APPI). Complaints can go to the Personal
            Information Protection Commission (PPC) at{" "}
            <a
              className="text-sky-700 hover:underline"
              href="https://www.ppc.go.jp/en/"
              target="_blank"
              rel="noopener noreferrer"
            >
              ppc.go.jp
            </a>
            .
          </li>
          <li>
            <strong>European Union &amp; United Kingdom</strong> · GDPR
            / UK GDPR. You have the rights of access, rectification,
            erasure, restriction, portability and objection, and the
            right to lodge a complaint with your supervisory authority
            (EU) or the ICO (UK).
          </li>
          <li>
            <strong>California, USA</strong> · CCPA / CPRA. You have
            the right to know, delete, correct and limit the use of
            sensitive personal information. We do not &ldquo;sell&rdquo;
            or &ldquo;share&rdquo; personal information as those terms
            are defined under the CCPA.
          </li>
          <li>
            <strong>New Zealand</strong> · Privacy Act 2020. The Office
            of the Privacy Commissioner is at{" "}
            <a
              className="text-sky-700 hover:underline"
              href="https://www.privacy.org.nz"
              target="_blank"
              rel="noopener noreferrer"
            >
              privacy.org.nz
            </a>
            .
          </li>
        </ul>
        <p>
          To exercise any right, email{" "}
          <a
            className="text-sky-700 hover:underline"
            href="mailto:info@feelzlike.com"
          >
            info@feelzlike.com
          </a>
          . We will respond as required by the law that applies to your
          request.
        </p>
      </Section>

      <Section title="7 · How long we keep it">
        <p>
          The following periods apply to our app-controlled alert records.
          Scheduled cleanup runs daily when the service is awake, with
          catch-up after downtime, rather than guaranteeing removal at an
          exact time.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Unverified signups · 30 days from signup.</li>
          <li>Active alert profiles · while you remain subscribed.</li>
          <li>Unsubscribed profiles and preferences · 90 days after unsubscribe.</li>
          <li>
            Recorded consent evidence · while subscribed, then two years
            after unsubscribe or account deletion. We do not invent
            missing historical consent records. Expired unverified
            signups are removed with their signup evidence.
          </li>
          <li>Alert dispatch logs · 90 days, or sooner when the associated profile is deleted.</li>
          <li>Detailed bounce and complaint incidents · one year.</li>
          <li>
            Minimal suppression records · until explicitly cleared through
            an authorized process. These use a keyed identifier for your
            email address to honour unsubscribe requests and unresolved
            delivery blocks after detailed records are removed. They are
            not used to send marketing and are not anonymous data.
          </li>
        </ul>
        <p>
          You can delete a signed-in account from the account page.
          This requests deletion of your Clerk identity, local account,
          alert profile and linked push subscriptions. The limited consent
          and suppression records described above remain separately.
          If deletion cannot finish immediately, we keep a recovery record
          and retry; operators can see and retry unresolved requests.
          Identifying details in that recovery record are removed 30 days
          after completion. Non-identifying operational counts and
          timestamps may remain.
        </p>
        <p>
          Where a billing account is linked, deletion first cancels
          non-terminal subscriptions and closes open checkout sessions
          before removing the sign-in identity and local billing ownership
          link. It does not automatically issue a refund. Provider-held
          customer, payment and invoice records, and billing event records,
          are not purged under this alert-retention policy.
        </p>
        <p>
          These periods do not control provider-held logs or backups.
          Resend publishes 30-day email and log retention on its standard
          plans and seven-day backup retention; enterprise arrangements
          can differ. Clerk manages its own retention obligations.
          Deleting an account here does not establish that every copy held
          by a provider has been erased. Other technical, analytics and
          crash-report data is subject to its applicable operational and
          provider settings, not the alert periods above.
        </p>
        <p>
          Unsubscribing stops alert delivery. You can ask us to access or
          delete information, or review a retained suppression record,
          by emailing info@feelzlike.com.
        </p>
      </Section>

      <Section title="8 · Children">
        <p>
          The Service is general-audience and not directed at children
          under 13 (United States), under 14 (Japan, where APPI requires
          guardian consent for children under 14 to handle personal
          data), or under 16 (most EU member states). We do not
          knowingly collect personal information from children in those
          age groups. If you believe a child has provided us
          information, contact us and we will delete it.
        </p>
      </Section>

      <Section title="9 · Cookies &amp; similar technologies">
        <p>
          We use a small number of strictly necessary cookies / local
          storage entries to run the Service (your cookie choice, your
          language preference, your selected base town). Analytics
          storage is loaded only after you accept analytics in the
          cookie banner; advertising storage (affiliate cookies, the
          Meta Pixel) only after you accept ads. You can change your
          choice at any time from the &ldquo;Cookie preferences&rdquo;
          link in the footer.
        </p>
      </Section>

      <Section title="10 · Security">
        <p>
          Traffic is encrypted in transit with TLS. Email and push
          subscription tokens are signed with HMAC. We follow industry
          practice for access controls and dependency hygiene. No system
          is perfect · if you discover a security issue, please email{" "}
          <a
            className="text-sky-700 hover:underline"
            href="mailto:info@feelzlike.com"
          >
            info@feelzlike.com
          </a>{" "}
          and allow us reasonable time to fix it before disclosure.
        </p>
      </Section>

      <Section title="11 · Changes">
        <p>
          We may update this policy as the Service evolves. The
          &ldquo;Last updated&rdquo; date at the top reflects the most
          recent change. Material changes will be highlighted in-app or
          by email to subscribers.
        </p>
      </Section>

      <Section title="12 · Contact">
        <p>
          Navigate Work Digital Pty Ltd · Australia · privacy enquiries
          to{" "}
          <a
            className="text-sky-700 hover:underline"
            href="mailto:info@feelzlike.com"
          >
            info@feelzlike.com
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}
