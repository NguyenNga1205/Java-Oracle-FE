"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, CalendarCheck, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { homeFor, useAuth } from "@/components/app/auth";
import { Field } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const perks = [
  { icon: BookOpenCheck, title: "Quản lý gọn gàng", text: "Sinh viên, giảng viên, lớp học và môn học trong một nơi." },
  { icon: CalendarCheck, title: "Lịch & điểm danh", text: "Xếp lịch tuần, tạo buổi học và điểm danh chỉ vài thao tác." },
  { icon: ShieldCheck, title: "Phân quyền rõ ràng", text: "Mỗi vai trò chỉ thấy đúng những gì cần dùng." },
];

export default function LoginPage() {
  const { user, booting, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!booting && user) router.replace(homeFor(user.role));
  }, [booting, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const me = await login(username.trim(), password);
      router.replace(homeFor(me.role));
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="bg-glow grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="size-11 rounded-2xl" />
          <span className="text-xl font-bold tracking-tight">UniVerse</span>
        </div>
        <div className="max-w-lg">
          <h1 className="text-4xl leading-tight font-bold tracking-tight xl:text-5xl">
            Quản lý trường lớp <span className="text-primary">nhẹ nhàng</span> hơn mỗi ngày.
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">Một không gian làm việc thân thiện cho quản trị viên, giảng viên và sinh viên.</p>
          <ul className="mt-10 space-y-5">
            {perks.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="bg-secondary text-primary grid size-10 shrink-0 place-items-center rounded-xl"><Icon className="size-5" /></span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-muted-foreground text-sm">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground text-xs">© 2026 UniVerse · Student Management System</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="bg-card w-full max-w-md space-y-5 rounded-3xl border p-8 shadow-2xl shadow-black/30">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Chào mừng trở lại 👋</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Đăng nhập để tiếp tục làm việc.</p>
          </div>
          <Field label="Tên đăng nhập" htmlFor="username">
            <Input id="username" autoFocus autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="vd: admin" className="h-11 rounded-lg" />
          </Field>
          <Field label="Mật khẩu" htmlFor="password">
            <div className="relative">
              <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-lg pr-11" />
              <button type="button" aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          {error && <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2.5 text-sm">{error}</p>}
          <Button type="submit" disabled={busy || !username || !password} className="h-11 w-full rounded-lg text-base font-semibold">
            {busy ? <><Loader2 className="animate-spin" /> Đang đăng nhập…</> : "Đăng nhập"}
          </Button>
        </form>
      </section>
    </div>
  );
}
