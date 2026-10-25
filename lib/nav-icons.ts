import {
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  CloudDownload,
  Compass,
  Gauge,
  Home,
  Inbox,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  UploadCloud,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * 后端 nav 只给图标字符串，前端在这里映射成组件，
 * 这样契约里不出现 React 类型，两端可以独立维护。
 */
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  "book-open": BookOpen,
  compass: Compass,
  inbox: Inbox,
  trophy: Trophy,
  user: User,
  users: Users,
  upload: UploadCloud,
  download: CloudDownload,
  sparkles: Sparkles,
  settings: Settings,
  gauge: Gauge,
  "clipboard-check": ClipboardCheck,
  "alert-triangle": AlertTriangle,
  "shield-alert": ShieldAlert,
  "shield-check": ShieldCheck,
  "scroll-text": ScrollText,
  "user-cog": UserCog,
};

export function navIcon(key: string): LucideIcon {
  return ICONS[key] ?? BookOpen;
}
