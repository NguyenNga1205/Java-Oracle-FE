"use client";

import * as React from "react";
import { Check, Copy, KeyRound, Loader2, Lock, LockOpen, MoreHorizontal, RefreshCw, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { api, type Item } from "@/lib/api";
import { roleLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/app/data-table";
import { Code, ConfirmDialog, Field, PageHeader, StatusBadge, UserAvatar } from "@/components/app/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generatePassword(length = 10) {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}
const slug = (code: string) => code.trim().toLowerCase().replace(/\s+/g, "");

type Role = "STUDENT" | "TEACHER";
type Credentials = { username: string; password: string; name: string };

function CopyButton({ text, label = "Sao chép" }: { text: string; label?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <Button type="button" variant="outline" size="sm" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { toast.error("Không sao chép được."); }
    }}>
      {done ? <Check className="text-success" /> : <Copy />} {done ? "Đã chép" : label}
    </Button>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState<Item[]>([]);
  const [students, setStudents] = React.useState<Item[]>([]);
  const [teachers, setTeachers] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [role, setRole] = React.useState<"ALL" | Role>("ALL");
  const [createRole, setCreateRole] = React.useState<Role | null>(null);
  const [resetFor, setResetFor] = React.useState<Item | null>(null);
  const [toggle, setToggle] = React.useState<Item | null>(null);
  const [toggleBusy, setToggleBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, s, t] = await Promise.all([api("/api/admin/users"), api("/api/catalog/students"), api("/api/catalog/teachers")]);
      setAccounts(a);
      setStudents(s);
      setTeachers(t);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const linked = React.useMemo(() => ({
    students: new Set(accounts.map((a) => a.studentId).filter(Boolean)),
    teachers: new Set(accounts.map((a) => a.teacherId).filter(Boolean)),
  }), [accounts]);
  const unlinkedStudents = students.filter((s) => !linked.students.has(s.id));
  const unlinkedTeachers = teachers.filter((t) => !linked.teachers.has(t.id));

  const rows = accounts.filter((a) => role === "ALL" || a.role === role);
  const counts = {
    ALL: accounts.length,
    TEACHER: accounts.filter((a) => a.role === "TEACHER").length,
    STUDENT: accounts.filter((a) => a.role === "STUDENT").length,
  };

  async function confirmToggle() {
    if (!toggle) return;
    setToggleBusy(true);
    try {
      await api(`/api/admin/users/${toggle.id}/enabled`, { method: "PUT", body: JSON.stringify({ enabled: !toggle.enabled }) });
      toast.success(toggle.enabled ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.");
      setToggle(null);
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setToggleBusy(false); }
  }

  const columns: Column<Item>[] = [
    { key: "profile", header: "Chủ tài khoản", sortValue: (a) => a.fullName ?? a.username, cell: (a) => (
      <div className="flex items-center gap-3">
        <UserAvatar name={a.fullName || a.username} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{a.fullName || a.username}</p>
          <p className="text-muted-foreground text-xs">{a.code ? <span className="font-mono">{a.code}</span> : "Quản trị hệ thống"}</p>
        </div>
      </div>
    ) },
    { key: "username", header: "Tên đăng nhập", sortValue: (a) => a.username, cell: (a) => <Code>{a.username}</Code> },
    { key: "role", header: "Vai trò", cell: (a) => <Badge variant="secondary" className={cn(a.role === "TEACHER" && "bg-info/15 text-info", a.role === "STUDENT" && "bg-primary/15 text-link", a.role === "ADMIN" && "bg-warning/15 text-warning")}>{roleLabels[a.role] || a.role}</Badge> },
    { key: "enabled", header: "Trạng thái", cell: (a) => <StatusBadge value={a.enabled ? "ACTIVE" : "INACTIVE"} label={a.enabled ? "Đang hoạt động" : "Đã khóa"} /> },
    { key: "actions", header: "", align: "right", className: "w-px", cell: (a) => a.role === "ADMIN" ? null : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Thao tác với ${a.username}`} className="size-8"><MoreHorizontal className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setResetFor(a)}><KeyRound /> Đặt lại mật khẩu</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant={a.enabled ? "destructive" : "default"} onSelect={() => setToggle(a)}>
            {a.enabled ? <><Lock /> Khóa tài khoản</> : <><LockOpen /> Mở khóa</>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) },
  ];

  const missing = unlinkedStudents.length + unlinkedTeachers.length;
  return (
    <>
      <PageHeader
        title="Tài khoản"
        description="Cấp quyền đăng nhập cho giảng viên và sinh viên. Mỗi hồ sơ chỉ có một tài khoản."
        actions={
          <>
            <Button variant="outline" className="h-10 rounded-lg" onClick={() => setCreateRole("TEACHER")}><UserRoundPlus /> Cho giảng viên</Button>
            <Button className="h-10 rounded-lg" onClick={() => setCreateRole("STUDENT")}><UserRoundPlus /> Cho sinh viên</Button>
          </>
        }
      />

      {!loading && !error && missing > 0 && (
        <div className="border-warning/30 bg-warning/10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
          <p>
            {[unlinkedStudents.length > 0 && `${unlinkedStudents.length} sinh viên`, unlinkedTeachers.length > 0 && `${unlinkedTeachers.length} giảng viên`].filter(Boolean).map((t, i) => (
              <span key={i}>{i > 0 && " và "}<span className="text-warning font-semibold">{t}</span></span>
            ))}{" "}
            chưa có tài khoản đăng nhập.
          </p>
          <div className="flex gap-2">
            {unlinkedTeachers.length > 0 && <Button size="sm" variant="outline" onClick={() => setCreateRole("TEACHER")}>Cấp cho giảng viên</Button>}
            {unlinkedStudents.length > 0 && <Button size="sm" variant="outline" onClick={() => setCreateRole("STUDENT")}>Cấp cho sinh viên</Button>}
          </div>
        </div>
      )}

      <DataTable
        rows={rows} columns={columns} rowKey={(a) => a.id} loading={loading} error={error} onRetry={() => void load()}
        searchText={(a) => `${a.username} ${a.fullName ?? ""} ${a.code ?? ""} ${roleLabels[a.role] ?? ""}`} searchPlaceholder="Tìm theo tên, mã, tên đăng nhập…" noun="tài khoản"
        emptyTitle="Chưa có tài khoản nào" emptyDescription="Cấp tài khoản cho giảng viên hoặc sinh viên để họ đăng nhập được."
        filters={
          <Tabs value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <TabsList>
              <TabsTrigger value="ALL">Tất cả ({counts.ALL})</TabsTrigger>
              <TabsTrigger value="TEACHER">Giảng viên ({counts.TEACHER})</TabsTrigger>
              <TabsTrigger value="STUDENT">Sinh viên ({counts.STUDENT})</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <CreateAccountSheet role={createRole} onClose={() => setCreateRole(null)} profiles={createRole === "STUDENT" ? unlinkedStudents : unlinkedTeachers} onCreated={() => void load()} />
      <ResetPasswordSheet account={resetFor} onClose={() => setResetFor(null)} />
      <ConfirmDialog
        open={!!toggle} onOpenChange={(o) => !o && setToggle(null)} busy={toggleBusy} onConfirm={confirmToggle}
        title={toggle?.enabled ? "Khóa tài khoản?" : "Mở khóa tài khoản?"} destructive={!!toggle?.enabled}
        confirmLabel={toggle?.enabled ? "Khóa" : "Mở khóa"}
        description={toggle?.enabled ? `“${toggle?.username}” sẽ không đăng nhập được cho đến khi được mở khóa.` : `“${toggle?.username}” sẽ đăng nhập lại được bình thường.`}
      />
    </>
  );
}

function CredentialsCard({ cred, onDone, doneLabel }: { cred: Credentials; onDone: () => void; doneLabel: string }) {
  const text = `Tài khoản UniVerse\nTên đăng nhập: ${cred.username}\nMật khẩu: ${cred.password}`;
  return (
    <div className="space-y-5">
      <div className="bg-success/10 border-success/30 rounded-xl border p-4">
        <p className="text-success flex items-center gap-2 text-sm font-semibold"><Check className="size-4" /> Đã tạo thành công cho {cred.name}</p>
        <p className="text-muted-foreground mt-1 text-xs">Mật khẩu chỉ hiển thị một lần. Hãy gửi cho người dùng ngay bây giờ.</p>
      </div>
      <dl className="bg-secondary/40 space-y-3 rounded-xl border p-4 text-sm">
        <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Tên đăng nhập</dt><dd className="font-mono font-semibold">{cred.username}</dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Mật khẩu</dt><dd className="font-mono font-semibold">{cred.password}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="Sao chép thông tin đăng nhập" />
        <Button type="button" className="ml-auto" onClick={onDone}>{doneLabel}</Button>
      </div>
    </div>
  );
}

function CreateAccountSheet({ role, onClose, profiles, onCreated }: { role: Role | null; onClose: () => void; profiles: Item[]; onCreated: () => void }) {
  const [profileId, setProfileId] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [userEdited, setUserEdited] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState("");
  const [created, setCreated] = React.useState<Credentials | null>(null);

  React.useEffect(() => {
    if (role) {
      setProfileId(""); setUsername(""); setUserEdited(false); setPassword(generatePassword());
      setErrors({}); setServerError(""); setCreated(null);
    }
  }, [role]);

  const profile = profiles.find((p) => String(p.id) === profileId);
  const label = role === "TEACHER" ? "giảng viên" : "sinh viên";

  function pick(id: string) {
    setProfileId(id);
    const p = profiles.find((x) => String(x.id) === id);
    if (p && !userEdited) setUsername(slug(p.code ?? ""));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!profile) next.profile = `Hãy chọn ${label} cần cấp tài khoản`;
    if (!username.trim()) next.username = "Vui lòng nhập tên đăng nhập";
    if (password.length < 8) next.password = "Mật khẩu cần ít nhất 8 ký tự";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true); setServerError("");
    try {
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password, role, [role === "TEACHER" ? "teacherId" : "studentId"]: profile!.id }),
      });
      setCreated({ username: username.trim(), password, name: profile!.fullName });
      onCreated();
    } catch (err: any) {
      setServerError(/exists/i.test(err.message) ? "Tên đăng nhập này đã được dùng, hãy chọn tên khác." : err.message);
    } finally { setBusy(false); }
  }

  const options = profiles.map((p) => ({ value: String(p.id), label: p.fullName, hint: [p.code, p.classroom?.name, p.faculty?.name].filter(Boolean).join(" · ") }));
  return (
    <Sheet open={!!role} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="border-b">
          <SheetTitle>Cấp tài khoản cho {label}</SheetTitle>
          <SheetDescription>Chọn hồ sơ chưa có tài khoản. Tên đăng nhập và mật khẩu được gợi ý sẵn.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {created ? (
            <CredentialsCard cred={created} onDone={onClose} doneLabel="Xong" />
          ) : (
            <form id="account-form" onSubmit={submit} noValidate className="space-y-4">
              <Field label={`Hồ sơ ${label}`} required error={errors.profile} hint={profiles.length === 0 ? `Tất cả ${label} đã có tài khoản.` : `${profiles.length} ${label} chưa có tài khoản`}>
                <Select value={profileId} onChange={pick} options={options} searchable placeholder={`Chọn ${label}`} invalid={!!errors.profile} disabled={profiles.length === 0} />
              </Field>
              <Field label="Tên đăng nhập" htmlFor="acc-user" required error={errors.username} hint="Gợi ý: dùng mã để dễ nhớ">
                <Input id="acc-user" autoComplete="off" value={username} onChange={(e) => { setUsername(e.target.value); setUserEdited(true); }} className="h-10 rounded-lg font-mono" aria-invalid={!!errors.username || undefined} />
              </Field>
              <Field label="Mật khẩu" htmlFor="acc-pass" required error={errors.password} hint="Tự sinh ngẫu nhiên, ít nhất 8 ký tự">
                <div className="flex gap-2">
                  <Input id="acc-pass" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-lg font-mono" aria-invalid={!!errors.password || undefined} />
                  <Button type="button" variant="outline" size="icon" aria-label="Sinh mật khẩu mới" className="size-10 shrink-0" onClick={() => setPassword(generatePassword())}><RefreshCw className="size-4" /></Button>
                </div>
              </Field>
              {serverError && <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2.5 text-sm">{serverError}</p>}
            </form>
          )}
        </div>
        {!created && (
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
            <Button type="submit" form="account-form" disabled={busy || profiles.length === 0}>{busy && <Loader2 className="animate-spin" />} Tạo tài khoản</Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ResetPasswordSheet({ account, onClose }: { account: Item | null; onClose: () => void }) {
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState<Credentials | null>(null);

  React.useEffect(() => { if (account) { setPassword(generatePassword()); setError(""); setDone(null); } }, [account]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Mật khẩu cần ít nhất 8 ký tự"); return; }
    setBusy(true); setError("");
    try {
      await api(`/api/admin/users/${account!.id}/password`, { method: "PUT", body: JSON.stringify({ password }) });
      setDone({ username: account!.username, password, name: account!.fullName || account!.username });
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <Sheet open={!!account} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="border-b">
          <SheetTitle>Đặt lại mật khẩu</SheetTitle>
          <SheetDescription>{account?.fullName || account?.username} · <span className="font-mono">{account?.username}</span></SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {done ? <CredentialsCard cred={done} onDone={onClose} doneLabel="Xong" /> : (
            <form id="reset-form" onSubmit={submit} noValidate className="space-y-4">
              <Field label="Mật khẩu mới" htmlFor="reset-pass" required error={error} hint="Tự sinh ngẫu nhiên, bạn có thể sửa">
                <div className="flex gap-2">
                  <Input id="reset-pass" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-lg font-mono" />
                  <Button type="button" variant="outline" size="icon" aria-label="Sinh mật khẩu mới" className="size-10 shrink-0" onClick={() => setPassword(generatePassword())}><RefreshCw className="size-4" /></Button>
                </div>
              </Field>
            </form>
          )}
        </div>
        {!done && (
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
            <Button type="submit" form="reset-form" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Đặt lại mật khẩu</Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
