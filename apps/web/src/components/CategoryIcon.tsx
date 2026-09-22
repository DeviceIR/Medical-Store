import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  BedDouble,
  Droplets,
  FlaskConical,
  HeartPulse,
  Package,
  Scan,
  Scissors,
  Shield,
  Smile,
  Sparkles,
  Stethoscope,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  surgical: Scissors,
  "surgical-scissors": Scissors,
  "surgical-forceps": Scissors,
  "surgical-retractors": Scissors,
  diagnostic: Stethoscope,
  stethoscopes: Stethoscope,
  "vital-signs": HeartPulse,
  consumable: Droplets,
  ppe: Shield,
  injection: Droplets,
  "wound-care": Droplets,
  hospital: BedDouble,
  "patient-furniture": BedDouble,
  "patient-monitoring": HeartPulse,
  laboratory: FlaskConical,
  "lab-devices": FlaskConical,
  emergency: HeartPulse,
  "first-aid": HeartPulse,
  dental: Smile,
  "dental-hand": Smile,
  sterilization: Sparkles,
  autoclave: Sparkles,
  imaging: Scan,
  ultrasound: Scan,
  physiotherapy: Accessibility,
  rehab: Accessibility,
};

const TONES: Record<string, string> = {
  surgical: "from-[#0b3a4d] to-[#14586a]",
  diagnostic: "from-[#0f7a72] to-[#1aa39a]",
  consumable: "from-[#2f5d50] to-[#4d8a78]",
  hospital: "from-[#12344a] to-[#1e5670]",
  laboratory: "from-[#355c7d] to-[#6c5b7b]",
  emergency: "from-[#8b3a3a] to-[#c45c5c]",
  dental: "from-[#1b6b7a] to-[#49a3b0]",
  sterilization: "from-[#3d5a80] to-[#98c1d9]",
  imaging: "from-[#24415a] to-[#3d7ea6]",
  physiotherapy: "from-[#2d6a4f] to-[#52b788]",
};

export function categoryTone(slug: string) {
  return TONES[slug] ?? TONES[slug.split("-")[0]] ?? "from-[#0b3a4d] to-[#0f7a72]";
}

export function CategoryIcon({ slug, className = "size-6" }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Package;
  return <Icon className={className} strokeWidth={1.75} />;
}
