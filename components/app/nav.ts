import {
  BookOpen,
  Building2,
  CalendarClock,
  CalendarDays,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  LayoutDashboard,
  School,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { AuthUser } from "./auth";

export type NavItem = { href: string; label: string; icon: LucideIcon; description?: string };
export type NavGroup = { label: string; items: NavItem[] };

const all: Record<string, NavItem> = {
  dashboard: { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  students: { href: "/students", label: "Sinh viên", icon: GraduationCap },
  teachers: { href: "/teachers", label: "Giảng viên", icon: UsersRound },
  classes: { href: "/classes", label: "Lớp học", icon: School },
  faculties: { href: "/faculties", label: "Khoa", icon: Building2 },
  years: { href: "/years", label: "Khóa học", icon: CalendarDays },
  subjects: { href: "/subjects", label: "Môn học", icon: BookOpen },
  "class-subjects": { href: "/class-subjects", label: "Phân công môn theo lớp", icon: Layers },
  "teaching-classes": { href: "/teaching-classes", label: "Lớp giảng dạy", icon: BookOpen },
  schedules: { href: "/schedules", label: "Lịch học & điểm danh", icon: CalendarClock },
  import: { href: "/import", label: "Nhập từ Excel", icon: FileSpreadsheet },
  accounts: { href: "/accounts", label: "Tài khoản", icon: ShieldCheck },
  profile: { href: "/profile", label: "Hồ sơ của tôi", icon: UserRound },
};

export function navFor(role: AuthUser["role"]): NavGroup[] {
  const pick = (...keys: string[]) => keys.map((k) => all[k]);
  if (role === "ADMIN")
    return [
      { label: "Chung", items: pick("dashboard") },
      { label: "Con người", items: pick("students", "teachers", "accounts") },
      { label: "Tổ chức đào tạo", items: pick("faculties", "years", "classes", "subjects", "class-subjects") },
      { label: "Vận hành", items: pick("schedules", "import") },
      { label: "Cá nhân", items: pick("profile") },
    ];
  if (role === "TEACHER")
    return [
      { label: "Chung", items: pick("dashboard") },
      { label: "Giảng dạy", items: pick("teaching-classes", "schedules", "classes", "teachers") },
      { label: "Cá nhân", items: pick("profile") },
    ];
  return [{ label: "Cá nhân", items: pick("profile") }];
}

/** Which top-level paths a role may open. */
export function allowedPaths(role: AuthUser["role"]) {
  return navFor(role).flatMap((g) => g.items.map((i) => i.href));
}

export function titleFor(pathname: string) {
  const match = Object.values(all).find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)));
  return match?.label ?? "UniVerse";
}
