"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { api, type Item } from "@/lib/api";
import { roleLabels } from "@/lib/labels";
import { DataTable, type Column } from "@/components/app/data-table";
import { Field, PageHeader, StatusBadge, UserAvatar } from "@/components/app/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const roleOptions = [
  { value: "STUDENT", label: "Sinh viên" },
  { value: "TEACHER", label: "Giảng viên" },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState<Item[]>([]);
  const [profiles, setProfiles] = React.useState<{ students: Item[]; teachers: Item[] }>({ students: [], teachers: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, students, teachers] = await Promise.all([api("/api/admin/users"), api("/api/catalog/students"), api("/api/catalog/teachers")]);
      setAccounts(a);
      setProfiles({ students, teachers });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const columns: Column<Item>[] = [
    { key: "username", header: "Tài khoản", sortValue: (a) => a.username, cell: (a) => (
      <div className="flex items-center gap-3"><UserAvatar name={a.username} /><span className="font-semibold">{a.username}</span></div>
    ) },
    { key: "role", header: "Vai trò", cell: (a) => <Badge variant="secondary">{roleLabels[a.role] || a.role}</Badge> },
    { key: "enabled", header: "Trạng thái", cell: (a) => <StatusBadge value={a.enabled ? "ACTIVE" : "INACTIVE"} label={a.enabled ? "Đang hoạt động" : "Đã khóa"} /> },
  ];

  return (
    <>
      <PageHeader
        title="Tài khoản"
        description="Cấp tài khoản đăng nhập cho sinh viên và giảng viên."
        actions={<Button onClick={() => setOpen(true)} className="h-10 rounded-lg"><UserRoundPlus /> Cấp tài khoản</Button>}
      />
      <DataTable rows={accounts} columns={columns} rowKey={(a) => a.id} loading={loading} error={error} onRetry={() => void load()}
        searchText={(a) => `${a.username} ${roleLabels[a.role] ?? ""}`} searchPlaceholder="Tìm tài khoản…" noun="tài khoản"
        emptyTitle="Chưa có tài khoản nào" emptyDescription="Bấm “Cấp tài khoản” để tạo tài khoản đầu tiên." />
      <CreateAccountDialog open={open} onOpenChange={setOpen} profiles={profiles} onCreated={() => void load()} />
    </>
  );
}

function CreateAccountDialog({ open, onOpenChange, profiles, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; profiles: { students: Item[]; teachers: Item[] }; onCreated: () => void;
}) {
  const [form, setForm] = React.useState<Item>({ role: "STUDENT" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [serverError, setServerError] = React.useState("");

  React.useEffect(() => {
    if (open) { setForm({ role: "STUDENT" }); setErrors({}); setServerError(""); setShow(false); }
  }, [open]);

  const profileKey = form.role === "STUDENT" ? "studentId" : "teacherId";
  const options = (form.role === "STUDENT" ? profiles.students : profiles.teachers).map((x) => ({ value: String(x.id), label: x.fullName, hint: x.code }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.username?.trim()) next.username = "Vui lòng nhập tên đăng nhập";
    if (!form.password || form.password.length < 8) next.password = "Mật khẩu cần ít nhất 8 ký tự";
    if (!form[profileKey]) next.profile = "Vui lòng chọn hồ sơ để liên kết";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setServerError("");
    try {
      await api("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      toast.success("Đã cấp tài khoản thành công.");
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Cấp tài khoản mới</DialogTitle>
          <DialogDescription>Tài khoản sẽ được liên kết với một hồ sơ sinh viên hoặc giảng viên có sẵn.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Tên đăng nhập" htmlFor="acc-user" required error={errors.username}>
            <Input id="acc-user" autoComplete="off" value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value })} className="h-10 rounded-lg" />
          </Field>
          <Field label="Mật khẩu" htmlFor="acc-pass" required error={errors.password} hint="Ít nhất 8 ký tự">
            <div className="relative">
              <Input id="acc-pass" type={show ? "text" : "password"} autoComplete="new-password" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-10 rounded-lg pr-10" />
              <button type="button" aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vai trò" required>
              <Select value={form.role} options={roleOptions} onChange={(v) => setForm({ username: form.username, password: form.password, role: v })} />
            </Field>
            <Field label="Liên kết hồ sơ" required error={errors.profile}>
              <Select value={form[profileKey] ? String(form[profileKey]) : ""} options={options} searchable placeholder="Chọn hồ sơ" invalid={!!errors.profile}
                onChange={(v) => setForm({ ...form, [profileKey]: Number(v) })} />
            </Field>
          </div>
          {serverError && <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2.5 text-sm">{serverError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Hủy</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Tạo tài khoản</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
