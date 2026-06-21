import { LegalShell, Section } from "./LegalShell";

/**
 * feelzlike Terms of Service.
 *
 * Multi-country aware. Governing law is NSW, Australia (the operating
 * entity's jurisdiction), with non-derogation language for EU / UK /
 * Japan / NZ consumer rights so the choice-of-law clause never
 * overrides mandatory local consumer protections (which it can't anyway
 * in those jurisdictions).
 *
 * The mountain-safety disclaimer is the load-bearing clause for a snow
 * weather product · weather forecasts are advisory, not a guarantee,
 * and visitors must check official avalanche, road and resort sources
 * before travel.
 *
 * NOTE FOR PUBLISHER: Have your operating entity's lawyer review before
 * launch. Confirm the entity name / ABN matches your registered
 * details and that the governing law clause aligns with where your
 * business is registered.
 */
export default function Terms() {
  return (
    <LegalShell
      title="Terms of Service"
      description="feelzlike terms of service. Governs your use of the feelzlike weather and conditions app for mountain and ski resort information."
      path="/legal/terms"
      lastUpdated="25 May 2026"
    >
      <p>
        These terms govern your use of feelzlike (the &ldquo;Service&rdquo;),
        operated by <strong>Navigate Work Digital Pty Ltd</strong>
        (Australia), trading as feelzlike (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
        By using the Service you agree to these terms. If you do not
        agree, do not use the Service.
      </p>

      <Section title="1 · Who can use feelzlike">
        <p>
          The Service is general-audience and free to access. You must
          be old enough in your country to consent to the use of online
          services without parental supervision (typically 13 in the
          United States, 14 in Japan, and between 13 and 16 across EU
          member states). If you are below that age, please use the
          Service with a parent or guardian.
        </p>
      </Section>

      <Section title="2 · What feelzlike is">
        <p>
          feelzlike is an information service. It aggregates publicly
          available weather forecasts, road status, traffic camera
          feeds, transport operator information and venue data for
          mountain regions in Australia, Japan and other countries we
          add over time.
        </p>
        <p>
          The Service is provided for general planning purposes. It is
          not a substitute for official avalanche bulletins, resort
          operations advice, road authority alerts, or emergency
          services.
        </p>
      </Section>

      <Section title="3 · Mountain safety · please read">
        <p>
          Mountain weather changes fast. Forecasts on this Service are
          modelled predictions and can be wrong. Road closures,
          avalanche risk, lift status and resort opening hours are
          summaries we display from upstream sources · they may be
          stale, incomplete, or unavailable.
        </p>
        <p>
          Before you travel, ski, hike, ride or drive in alpine terrain
          you must independently confirm conditions with the relevant
          official sources, including but not limited to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            The Bureau of Meteorology (Australia), the Japan
            Meteorological Agency (Japan), and your country&rsquo;s
            equivalent national weather service.
          </li>
          <li>
            The road authority of the state or prefecture you are
            driving in (Transport for NSW, VicTraffic, NEXCO,
            prefectural police, etc.).
          </li>
          <li>
            The resort operator for lift status, on-mountain conditions
            and avalanche advisories.
          </li>
          <li>
            Local emergency services in any safety-critical situation.
          </li>
        </ul>
        <p>
          Decisions about whether to drive a mountain road, ski a
          slope, or enter backcountry terrain are yours alone. You use
          the Service at your own risk.
        </p>
      </Section>

      <Section title="4 · Third-party content">
        <p>
          The Service displays content sourced from third parties · for
          example, traffic camera images, Google Maps and Google Places
          venue listings, transport operator timetables, and weather
          model output from Open-Meteo, BOM and JMA. We do not own this
          content, do not control its accuracy, and do not endorse the
          third-party providers. Their own terms apply when you
          interact with their services through links we provide.
        </p>
      </Section>

      <Section title="5 · Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            scrape, mirror or republish the Service in bulk without
            written permission;
          </li>
          <li>
            interfere with or attempt to bypass our rate limits,
            security or access controls;
          </li>
          <li>
            use the Service to send spam, phishing, or unlawful
            content;
          </li>
          <li>
            misrepresent the source of weather, road or alert
            information you take from the Service when republishing it;
          </li>
          <li>
            use the Service to make safety-critical decisions for third
            parties (e.g. as a commercial avalanche or guiding service)
            without your own independent verification.
          </li>
        </ul>
      </Section>

      <Section title="6 · Email alerts &amp; push notifications">
        <p>
          When you opt in to alerts for a region or mountain we will
          send you notifications about the conditions you asked for. We
          may also include short, relevant service messages (e.g. a
          notice that a feed has changed). Every email contains a
          one-click unsubscribe; push notifications can be revoked from
          your browser&rsquo;s site settings.
        </p>
      </Section>

      <Section title="7 · Intellectual property">
        <p>
          The feelzlike name, wordmark, page designs, written copy and
          underlying code are owned by Navigate Work Digital Pty Ltd or
          its licensors. You receive a limited, revocable,
          non-exclusive, non-transferable licence to use the Service
          for your personal, non-commercial planning purposes. All
          other rights are reserved.
        </p>
        <p>
          Third-party logos shown alongside transport operators,
          resorts and tourism partners belong to their respective
          owners and are used for identification purposes only.
        </p>
      </Section>

      <Section title="8 · Disclaimers">
        <p>
          Except as required by law, the Service is provided
          &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We make no
          warranty that the Service will be accurate, complete,
          uninterrupted, error-free, or fit for any particular purpose.
          We do not warrant that weather, road, transport, lift or
          alert information is current at the moment you read it.
        </p>
        <p>
          Nothing in these terms excludes, restricts or modifies any
          consumer guarantee, right or remedy that cannot be excluded,
          restricted or modified under the Australian Consumer Law,
          the Consumer Rights Act 2015 (UK), the Consumer Contracts
          Directive (EU), the Consumer Contract Act (Japan), the
          Consumer Guarantees Act 1993 (NZ) or equivalent laws of your
          country. Where mandatory consumer law applies, our liability
          is limited to the maximum extent permitted by that law.
        </p>
      </Section>

      <Section title="9 · Limitation of liability">
        <p>
          To the maximum extent permitted by law, Navigate Work Digital
          Pty Ltd, its directors, employees and contractors are not
          liable for any indirect, incidental, special, consequential
          or punitive loss, or any loss of profit, revenue, data, or
          opportunity, arising out of or relating to your use of the
          Service.
        </p>
        <p>
          Our total aggregate liability to you for any direct loss
          arising out of or relating to the Service is limited to AUD
          100 or the amount you have paid us for the Service in the
          twelve months before the event giving rise to the claim,
          whichever is greater. The Service is currently provided free
          of charge.
        </p>
      </Section>

      <Section title="10 · Indemnity">
        <p>
          You agree to indemnify Navigate Work Digital Pty Ltd against
          third-party claims, losses, damages and reasonable legal
          costs arising out of your breach of these terms or your
          unlawful use of the Service.
        </p>
      </Section>

      <Section title="11 · Suspension &amp; termination">
        <p>
          We may suspend or terminate your access to the Service at any
          time if we reasonably believe you have breached these terms,
          or if we need to do so to protect the Service, our users, or
          comply with the law. You can stop using the Service at any
          time.
        </p>
      </Section>

      <Section title="12 · Governing law &amp; disputes">
        <p>
          These terms are governed by the laws of New South Wales,
          Australia. The courts of New South Wales have non-exclusive
          jurisdiction over any dispute arising out of or relating to
          these terms or the Service.
        </p>
        <p>
          This choice of law does not deprive you of the protection of
          mandatory consumer laws in your country of residence (in
          particular EU member states, the United Kingdom, Japan, New
          Zealand and other jurisdictions where local consumer law
          cannot be overridden by contract). You may also bring
          proceedings in the courts of your country of residence where
          local law requires.
        </p>
      </Section>

      <Section title="13 · Changes to these terms">
        <p>
          We may update these terms as the Service evolves. Material
          changes will be flagged in-app or by email to subscribers
          before they take effect. Continued use of the Service after
          the effective date of the updated terms means you accept the
          updated version.
        </p>
      </Section>

      <Section title="14 · Affiliate links">
        <p id="affiliate-links">
          Some links on the Service to accommodation providers, travel
          booking platforms, gear retailers and tour operators are
          affiliate links. If you click through and complete a purchase
          or booking, we may earn a commission from the partner at no
          additional cost to you. The price you pay is the same whether
          you use our link or go to the partner directly.
        </p>
        <p>
          Affiliate revenue helps fund the editorial work on the
          Service · weather data ingestion, road monitoring, town
          research and the development of the Service itself. It does
          not influence which mountains, towns, accommodations or
          venues we cover, the order in which they appear, or the
          conditions we report. We list partners because they are
          relevant to the town you are reading about, not because we
          earn from them.
        </p>
        <p>
          Current affiliate partners include Booking.com (via Commission
          Junction). We will update this section as additional partners
          are added. If you have a question about an affiliate
          relationship, contact us at the address in section 15.
        </p>
      </Section>

      <Section title="15 · Contact">
        <p>
          Questions about these terms ·{" "}
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
