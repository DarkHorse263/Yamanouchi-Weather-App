import { LegalShell, Section } from "./LegalShell";

/**
 * feelzlike Privacy Policy.
 *
 * Multi-country aware: written for AU (Privacy Act 1988 (Cth) + APPs),
 * JP (APPI), EU/UK (GDPR / UK GDPR) and California (CCPA/CPRA) visitors.
 * Substantively reflects the data the app actually collects today:
 *   - anonymous device-scoped analytics token (consent-gated)
 *   - Sentry crash reports (consent-gated)
 *   - email + push subscriptions for alerts (opt-in, double-opt-in for email)
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
      lastUpdated="27 July 2026"
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
            href="mailto:enquiries@navigatework.com.au"
          >
            enquiries@navigatework.com.au
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
            <strong>Anonymous analytics</strong> (only if you accept
            analytics in the cookie banner) · a random device-scoped
            token, page paths, and aggregate usage measured with Google
            Analytics 4, which does not store IP addresses; we also strip
            query strings from page paths before they are sent. No name,
            email, or precise location.
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
            address and the regions / mountains you chose to follow.
            Used only to send the alerts you asked for and to let you
            unsubscribe.
          </li>
          <li>
            <strong>Push notifications</strong> · a browser push
            endpoint and the alerts you opted in to. Used only to push
            the notifications you asked for.
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
          feelzlike is a global service. To deliver it we use a small
          number of carefully chosen sub-processors. Data may cross
          borders for these purposes only.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Hosting &amp; database</strong> · Replit
            Deployments and Replit-managed Postgres (regions hosted in
            United States and other Replit regions).
          </li>
          <li>
            <strong>Crash &amp; performance monitoring</strong> ·
            Sentry (United States / European Union).
          </li>
          <li>
            <strong>Product analytics</strong> · Google Analytics 4
            (Google, United States), loaded only after you accept
            analytics in the cookie banner. It does not store IP
            addresses, and no name, email or precise location is sent.
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
            <strong>Email delivery</strong> · the transactional email
            provider used for alert verification and unsubscribe
            messages.
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
        <p>
          Where personal information leaves your country we rely on
          standard contractual clauses (EU / UK), the OAIC&rsquo;s APP 8
          framework (Australia) or your explicit consent (Japan, under
          APPI Article 28). A current sub-processor list is available
          on request.
        </p>
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
          You always have the right to access, correct or delete the
          personal information we hold about you, withdraw consent for
          analytics or alerts, and lodge a complaint with your local
          regulator. Specific frameworks below.
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
          <li>
            <strong>Everywhere else</strong> · we will honour
            equivalent requests in line with applicable local law.
          </li>
        </ul>
        <p>
          To exercise any right, email{" "}
          <a
            className="text-sky-700 hover:underline"
            href="mailto:enquiries@navigatework.com.au"
          >
            enquiries@navigatework.com.au
          </a>
          . We respond within 30 days (Australia / EU / UK) or the
          shorter period required by your local law.
        </p>
      </Section>

      <Section title="7 · How long we keep it">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Server access logs</strong> · up to 30 days, then
            deleted or aggregated.
          </li>
          <li>
            <strong>Crash reports</strong> · 90 days in Sentry, then
            purged.
          </li>
          <li>
            <strong>Anonymous analytics events</strong> · up to 13
            months in aggregate form.
          </li>
          <li>
            <strong>Email alert subscriptions</strong> · until you
            unsubscribe (one-click in every email) or remove yourself
            via the manage-subscriptions link.
          </li>
          <li>
            <strong>Push subscriptions</strong> · until you revoke
            permission in your browser or your endpoint expires.
          </li>
        </ul>
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
            href="mailto:enquiries@navigatework.com.au"
          >
            enquiries@navigatework.com.au
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
            href="mailto:enquiries@navigatework.com.au"
          >
            enquiries@navigatework.com.au
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}
