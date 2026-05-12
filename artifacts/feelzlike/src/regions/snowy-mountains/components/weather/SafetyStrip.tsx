import { ShieldAlert, Mountain, Phone, PhoneCall } from "lucide-react";
import { SafetyStrip as SharedSafetyStrip, type SafetyLink } from "@workspace/feelzlike-dashboard";

/**
 * Per-resort main switchboard. Use these to reach ski patrol via the
 * resort line. They are the resort's main public number · the operator
 * routes you to patrol or first-aid. We deliberately do not publish
 * direct patrol numbers because those rotate and change off-season.
 */
const RESORT_PATROL: Record<string, { name: string; phone: string; href: string }> = {
  thredbo: {
    name: "Thredbo · resort line",
    phone: "+61 2 6459 4100",
    href: "tel:+61264594100",
  },
  perisher: {
    name: "Perisher · snowphone",
    phone: "1300 655 822",
    href: "tel:1300655822",
  },
  "charlottes-pass": {
    name: "Charlotte's Pass · resort line",
    phone: "+61 2 6457 5247",
    href: "tel:+61264575247",
  },
  selwyn: {
    name: "Selwyn · resort line",
    phone: "+61 2 6454 9488",
    href: "tel:+61264549488",
  },
};

const BASE_LINKS: SafetyLink[] = [
  {
    label: "BoM · Kosciuszko forecast",
    detail: "Bureau of Meteorology official Kosciuszko alpine forecast",
    href: "http://www.bom.gov.au/nsw/forecasts/kosciuszko.shtml",
    icon: Mountain,
  },
  {
    label: "Mountain Safety Collective",
    detail: "NSW back-country snow safety bulletin & avalanche awareness",
    href: "https://mountainsafety.com.au/",
    icon: ShieldAlert,
  },
  {
    label: "Emergency · 000",
    detail: "Triple Zero for life-threatening emergencies on or off mountain",
    href: "tel:000",
    icon: Phone,
  },
];

const AU_DISCLAIMER =
  "feelzlike provides reference conditions only. Avalanche risk in the Australian Alps is generally low but real " +
  "· wind-loaded slopes, cornices and tree wells have caused fatalities. Check current bulletins, carry safety " +
  "gear, and ski with a partner when leaving patrolled terrain.";

export function SafetyStrip({ resortId }: { resortId?: string } = {}) {
  const patrol = resortId ? RESORT_PATROL[resortId] : undefined;
  const links: SafetyLink[] = patrol
    ? [
        {
          label: patrol.name,
          detail: "Ask the operator for ski patrol or first-aid · main resort switchboard",
          href: patrol.href,
          icon: PhoneCall,
        },
        ...BASE_LINKS,
      ]
    : BASE_LINKS;

  return (
    <SharedSafetyStrip
      links={links}
      subhead="Resort terrain has ski-patrol cover · back-country does not"
      disclaimer={AU_DISCLAIMER}
    />
  );
}
