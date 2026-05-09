import {
  BadgeCheck,
  BarChart3,
  FileSpreadsheet,
  Film,
  Home,
  ListOrdered,
  Mic,
  Trophy,
  Youtube,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", icon: Home, mobile: true },
  { label: "Processor", path: "/audio-processor", icon: Film, mobile: true },
  { label: "Queue", path: "/queue-processor", icon: ListOrdered, mobile: true },
  { label: "Transcribe", path: "/transcription", icon: Mic, mobile: true },
  {
    label: "Validation",
    path: "/validation",
    icon: BadgeCheck,
    adminOnly: true,
    mobile: true,
  },
  {
    label: "Leaderboard",
    path: "/leaderboard",
    icon: Trophy,
    adminOnly: true,
  },
  {
    label: "Statistics",
    path: "/statistics",
    icon: BarChart3,
    adminOnly: true,
  },
  {
    label: "Channels",
    path: "/channels",
    icon: Youtube,
    adminOnly: true,
  },
  { label: "CSV", path: "/csv-normalization", icon: FileSpreadsheet, mobile: true },
];
