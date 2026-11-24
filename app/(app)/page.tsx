"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, GraduationCap, Plus, School, UsersRound } from "lucide-react";
import { api, type Item } from "@/lib/api";
import { useAuth } from "@/components/app/auth";
import { navFor } from "@/components/app/nav";
import { InlineError, PageHeader, StatCard } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Stats = { students: number | string; teachers: number | string; classes: number | string; faculties: number | string; years?: number | string };

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [students, setStudents] = React.useState<Item[]>([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!user || user.role === "STUDENT") return;
    setLoading(true);
    setError("");
    try {
      if (user.role === "ADMIN") {
        const [s, teachers, list] = await Promise.all([api("/api/admin/stats"), api("/api/catalog/teachers"), api("/api/catalog/students")]);
        setStats({ students: s.students ?? list.length, teachers: teachers.length, classes: s.classes ?? 0, faculties: s.faculties ?? 0 });
        setStudents(list);
      } else {
        const [classes, list, me] = await Promise.all([api("/api/catalog/classes"), api("/api/catalog/students"), api("/api/teacher/profile")]);
        setStats({ students: list.length, teachers: 0, classes: classes.length, faculties: me.faculty ? 1 : 0, years: me.faculty?.courseYear ? 1 : 0 });
        setStudents(list);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => { void load(); }, [load]);

  if (!user) return null;
  const isAdmin = user.role === "ADMIN";

  const distribution = Object.entries(
    students.reduce<Record<string, number>>((acc, s) => {
      const k = s.classroom?.name || s.classroomName || "Chưa xếp lớp";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const max = Math.max(1, ...distribution.map((d) => d[1]));

  const cards = isAdmin
    ? [
        { label: "Sinh viên", value: stats?.students, icon: GraduationCap, tone: "primary" as const },
        { label: "Giảng viên", value: stats?.teachers, icon: UsersRound, tone: "success" as const },
        { label: "Lớp học", value: stats?.classes, icon: School, tone: "warning" as const },
        { label: "Khoa đào tạo", value: stats?.faculties, icon: Building2, tone: "info" as const },
      ]
    : [
        { label: "Sinh viên phụ trách", value: stats?.students, icon: GraduationCap, tone: "primary" as const },
        { label: "Lớp được phân công", value: stats?.classes, icon: School, tone: "warning" as const },
        { label: "Khoa", value: stats?.faculties, icon: Building2, tone: "info" as const },
        { label: "Khóa học", value: stats?.years, icon: CalendarDays, tone: "success" as const },
      ];

  const shortcuts = navFor(user.role).flatMap((g) => g.items).filter((i) => i.href !== "/" && i.href !== "/profile").slice(0, 6);

  return (
    <>
      <PageHeader
        title={`Xin chào, ${user.username} 👋`}
        description="Đây là bức tranh nhanh về hoạt động của nhà trường hôm nay."
        actions={isAdmin && (
          <Button asChild className="h-10 rounded-lg"><Link href="/students"><Plus /> Thêm sinh viên</Link></Button>
        )}
      />
      {error && <div className="mb-5"><InlineError message={error} onRetry={() => void load()} /></div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) =>
          loading ? <Skeleton key={c.label} className="h-[92px] rounded-2xl" /> : <StatCard key={c.label} label={c.label} value={c.value ?? "—"} icon={c.icon} tone={c.tone} />,
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="bg-card rounded-2xl border p-6">
          <h2 className="font-semibold">Sinh viên theo lớp</h2>
          <p className="text-muted-foreground mb-5 text-sm">Top lớp có nhiều sinh viên nhất</p>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-6" />)}</div>
          ) : distribution.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Chưa có dữ liệu sinh viên.</p>
          ) : (
            <ul className="space-y-4">
              {distribution.map(([name, n]) => (
                <li key={name}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="truncate font-medium">{name}</span>
                    <span className="text-muted-foreground tabular-nums">{n}</span>
                  </div>
                  <div className="bg-secondary h-2.5 overflow-hidden rounded-full">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-card rounded-2xl border p-6">
          <h2 className="font-semibold">Truy cập nhanh</h2>
          <p className="text-muted-foreground mb-4 text-sm">Đi thẳng tới việc bạn hay làm</p>
          <ul className="space-y-1.5">
            {shortcuts.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="hover:bg-accent group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors">
                  <span className="bg-secondary text-primary grid size-9 place-items-center rounded-lg"><Icon className="size-[18px]" /></span>
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
