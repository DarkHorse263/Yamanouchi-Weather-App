import { ShieldAlert, Mountain, Phone } from "lucide-react";
import { SafetyStrip as SharedSafetyStrip, type SafetyLink } from "@workspace/feelzlike-dashboard";

const AU_LINKS: SafetyLink[] = [
  {
    label: "NSW back-country bulletin",
    detail: "Snow safety conditions for Kosciuszko back-country",
    href: "https://mountainsafety.com.au/",
    icon: Mountain,
  },
  {
    label: "Avalanche awareness",
    detail: "Australian alpine avalanche education & terrain rating",
    href: "https://www.aaaresearch.com.au/",
    icon: ShieldAlert,
  },
  {
    label: "Ski patrol & emergency",
    detail: "Triple Zero (000) for emergencies · resort patrol on hill",
    href: "tel:000",
    icon: Phone,
  },
];

const AU_DISCLAIMER =
  "feelzlike provides reference conditions only. Avalanche risk in the Australian Alps is generally low but real " +
  "- wind-loaded slopes, cornices and tree wells have caused fatalities. Check current bulletins, carry safety " +
  "gear, and ski with a partner when leaving patrolled terrain.";

export function SafetyStrip() {
  return (
    <SharedSafetyStrip
      links={AU_LINKS}
      subhead="Resort terrain has ski-patrol cover · back-country does not"
      disclaimer={AU_DISCLAIMER}
    />
  );
}
