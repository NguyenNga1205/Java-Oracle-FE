"use client";

import * as React from "react";
import { Ban, CalendarPlus, ClipboardCheck, Loader2, Pencil, Plus, WandSparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api, type Item } from "@/lib/api";
import { clock, dayNames, isoDate, parseIso, sessionStatusLabels, toMinute, viDate } from "@/lib/labels";
import { useAuth } from "@/components/app/auth";
import { DataTable, type Column } from "@/components/app/data-table";
import { ConfirmDialog, EmptyState, Field, InlineError, PageHeader, StatusBadge, UserAvatar } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

const dayOptions = Object.entries(dayNames).map(([value, label]) => ({ value, label }));
const offeringName = (o: Item) => `${o.classroom?.name || "Lớp"} · ${o.subject?.name || "Môn"}`;
const range = (a: string, b: string) => (b ? `${viDate(a)} → ${viDate(b)}` : `${viDate(a)} → …`);

const markOptions = [
  { value: "PRESENT", label: "Có mặt", tone: "data-[on=true]:bg-success/20 data-[on=true]:text-success data-[on=true]:border-success/50" },
  { value: "LATE", label: "Đi trễ", tone: "data-[on=true]:bg-warning/20 data-[on=true]:text-warning data-[on=true]:border-warning/50" },
  { value: "ABSENT", label: "Vắng", tone: "data-[on=true]:bg-destructive/20 data-[on=true]:text-destructive data-[on=true]:border-destructive/50" },
];

type WeeklyForm = { classroomSubjectId: string; dayOfWeek: string; start: string; end: string; room: string; effectiveFrom: string; effectiveTo: string };
type SessionForm = { classroomSubjectId: string; weeklyScheduleId: string; sessionNo: string; sessionDate: string; start: string; end: string; room: string; note: string };

export default function SchedulesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const today = React.useMemo(() => isoDate(new Date()), []);
  const in90 = React.useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 90); return isoDate(d); }, []);

  const [tab, setTab] = React.useState<"sessions" | "weekly">("sessions");
  const [from, setFrom] = React.useState(today);
  const [to, setTo] = React.useState(in90);
  const [offerings, setOfferings] = React.useState<Item[]>([]);
  const [weekly, setWeekly] = React.useState<Item[]>([]);
  const [sessions, setSessions] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [weeklyDialog, setWeeklyDialog] = React.useState<{ open: boolean; editing: Item | null }>({ open: false, editing: null });
  const [sessionDialog, setSessionDialog] = React.useState<{ open: boolean; editing: Item | null }>({ open: false, editing: null });
  const [generateFor, setGenerateFor] = React.useState<Item | null>(null);
  const [confirm, setConfirm] = React.useState<{ kind: "deactivate" | "cancel"; item: Item } | null>(null);
  const [confirmBusy, setConfirmBusy] = React.useState(false);
  const [attendance, setAttendance] = React.useState<Item | null>(null);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true); setError("");
    try {
      if (isAdmin) {
        const [o, w, s] = await Promise.all([
          api("/api/catalog/class-subjects"),
          api("/api/admin/schedules/weekly"),
          api(`/api/admin/schedules/sessions?from=${from}&to=${to}`),
        ]);
        setOfferings(o); setWeekly(w); setSessions(s);
      } else {
        const [w, s] = await Promise.all([api("/api/teacher/schedule/weekly"), api(`/api/teacher/sessions?from=${from}&to=${to}`)]);
        setWeekly(w); setSessions(s);
      }
    } catch (e: any) {
      setError(e.message || "Không thể tải dữ liệu lịch học.");
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, from, to]);
  React.useEffect(() => { void load(); }, [load]);

  async function runConfirm() {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      if (confirm.kind === "deactivate") {
        await api(`/api/admin/schedules/weekly/${confirm.item.id}/deactivate`, { method: "PUT" });
        toast.success("Đã ngừng áp dụng lịch tuần. Các buổi học đã tạo vẫn được giữ nguyên.");
      } else {
        await api(`/api/admin/schedules/sessions/${confirm.item.id}/cancel`, { method: "PUT" });
        toast.success("Đã hủy buổi học.");
      }
      setConfirm(null);
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setConfirmBusy(false); }
  }

  const iconBtn = (label: string, onClick: () => void, icon: React.ReactNode, opts: { danger?: boolean; disabled?: boolean } = {}) => (
    <Button variant="ghost" size="sm" aria-label={label} title={label} disabled={opts.disabled} onClick={onClick}
      className={cn("h-8 gap-1.5 px-2 text-xs", opts.danger && "text-destructive hover:text-destructive hover:bg-destructive/10")}>
      {icon} {label}
    </Button>
  );

  const weeklyCols: Column<Item>[] = [
    { key: "day", header: "Thứ", sortValue: (w) => w.dayOfWeek, cell: (w) => <span className="font-semibold">{dayNames[w.dayOfWeek]}</span> },
    { key: "class", header: "Lớp / Môn", cell: (w) => <div><p className="font-medium">{w.classroomName}</p><p className="text-muted-foreground text-xs">{w.subjectName}</p></div> },
    ...(isAdmin ? [{ key: "teacher", header: "Giảng viên", cell: (w: Item) => w.teacherName } as Column<Item>] : []),
    { key: "time", header: "Thời gian", cell: (w) => <span className="font-mono text-sm">{clock(w.startMinute)}–{clock(w.endMinute)}</span> },
    { key: "room", header: "Phòng", cell: (w) => w.room || "—" },
    { key: "valid", header: "Hiệu lực", cell: (w) => (
      <div><p className="text-sm">{range(w.effectiveFrom, w.effectiveTo)}</p><StatusBadge value={w.active ? "ACTIVE" : "INACTIVE"} label={w.active ? "Đang áp dụng" : "Đã ngừng"} /></div>
    ) },
    ...(isAdmin ? [{ key: "actions", header: "", align: "right", className: "whitespace-nowrap", cell: (w: Item) => (
      <div className="flex justify-end">
        {iconBtn("Tạo buổi", () => setGenerateFor(w), <WandSparkles className="size-3.5" />, { disabled: !w.active })}
        {iconBtn("Sửa", () => setWeeklyDialog({ open: true, editing: w }), <Pencil className="size-3.5" />, { disabled: !w.active })}
        {iconBtn("Ngừng", () => setConfirm({ kind: "deactivate", item: w }), <Ban className="size-3.5" />, { danger: true, disabled: !w.active })}
      </div>
    ) } as Column<Item>] : []),
  ];

  const sessionCols: Column<Item>[] = [
    { key: "date", header: "Ngày", sortValue: (s) => s.sessionDate + s.startMinute, cell: (s) => <span className="font-medium">{viDate(s.sessionDate)}</span> },
    { key: "class", header: "Lớp / Môn", cell: (s) => <div><p className="font-medium">{s.classroomName}</p><p className="text-muted-foreground text-xs">{s.subjectName}{isAdmin && ` · ${s.teacherName}`}</p></div> },
    { key: "time", header: "Thời gian", cell: (s) => <span className="font-mono text-sm">{clock(s.startMinute)}–{clock(s.endMinute)}</span> },
    { key: "room", header: "Phòng", cell: (s) => s.room || "—" },
    { key: "status", header: "Trạng thái", cell: (s) => <StatusBadge value={s.status} label={sessionStatusLabels[s.status]} /> },
    { key: "actions", header: "", align: "right", className: "whitespace-nowrap", cell: (s) =>
      isAdmin ? (
        s.status !== "CANCELLED" && (
          <div className="flex justify-end">
            {iconBtn("Sửa", () => setSessionDialog({ open: true, editing: s }), <Pencil className="size-3.5" />)}
            {iconBtn("Hủy", () => setConfirm({ kind: "cancel", item: s }), <XCircle className="size-3.5" />, { danger: true })}
          </div>
        )
      ) : (
        <Button size="sm" variant="secondary" disabled={s.status === "CANCELLED"} onClick={() => setAttendance(s)}><ClipboardCheck /> Điểm danh</Button>
      ) },
  ];

  const rangeFilters = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-40"><DatePicker value={from} onChange={(v) => v && setFrom(v)} fromYear={2020} toYear={2040} /></div>
      <span className="text-muted-foreground text-sm">→</span>
      <div className="w-40"><DatePicker value={to} onChange={(v) => v && setTo(v)} fromYear={2020} toYear={2040} /></div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Lịch học & điểm danh"
        description={isAdmin ? "Xếp thời khóa biểu tuần, tạo buổi học cụ thể và theo dõi lịch toàn trường." : "Xem lịch giảng dạy của bạn và điểm danh sinh viên theo từng buổi."}
        actions={isAdmin && (
          <>
            <Button variant="outline" className="h-10 rounded-lg" onClick={() => setSessionDialog({ open: true, editing: null })}><CalendarPlus /> Thêm buổi học</Button>
            <Button className="h-10 rounded-lg" onClick={() => setWeeklyDialog({ open: true, editing: null })}><Plus /> Thêm lịch tuần</Button>
          </>
        )}
      />
      {error && <div className="mb-5"><InlineError message={error} onRetry={() => void load()} /></div>}

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList variant="line">
          <TabsTrigger value="sessions">Buổi học ({sessions.length})</TabsTrigger>
          <TabsTrigger value="weekly">Thời khóa biểu tuần ({weekly.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "sessions" ? (
        <DataTable rows={sessions} columns={sessionCols} rowKey={(s) => s.id} loading={loading} filters={rangeFilters} onRetry={() => void load()} noun="buổi học"
          searchText={(s) => `${s.classroomName} ${s.subjectName} ${s.teacherName} ${s.room}`} searchPlaceholder="Tìm lớp, môn, phòng…"
          emptyTitle="Không có buổi học nào" emptyDescription="Thử mở rộng khoảng ngày để xem thêm buổi học." />
      ) : (
        <DataTable rows={weekly} columns={weeklyCols} rowKey={(w) => w.id} loading={loading} onRetry={() => void load()} noun="lịch tuần"
          searchText={(w) => `${w.classroomName} ${w.subjectName} ${w.teacherName} ${w.room} ${dayNames[w.dayOfWeek]}`} searchPlaceholder="Tìm lịch tuần…"
          emptyTitle="Chưa có thời khóa biểu tuần" />
      )}

      {isAdmin && (
        <>
          <WeeklyDialog state={weeklyDialog} onClose={() => setWeeklyDialog({ open: false, editing: null })} offerings={offerings} today={today} onSaved={() => void load()} />
          <SessionDialog state={sessionDialog} onClose={() => setSessionDialog({ open: false, editing: null })} offerings={offerings} weekly={weekly} today={today} onSaved={() => void load()} />
          <GenerateDialog weekly={generateFor} today={today} in90={in90} onClose={() => setGenerateFor(null)} onDone={() => void load()} />
          <ConfirmDialog
            open={!!confirm}
            onOpenChange={(o) => !o && setConfirm(null)}
            title={confirm?.kind === "deactivate" ? "Ngừng áp dụng lịch tuần?" : "Hủy buổi học?"}
            description={confirm?.kind === "deactivate" ? "Các buổi học đã tạo từ lịch này sẽ được giữ nguyên." : "Buổi học sẽ chuyển sang trạng thái Đã hủy."}
            confirmLabel={confirm?.kind === "deactivate" ? "Ngừng áp dụng" : "Hủy buổi học"}
            destructive busy={confirmBusy} onConfirm={runConfirm}
          />
        </>
      )}
      {!isAdmin && <AttendanceSheet session={attendance} onClose={() => setAttendance(null)} />}
    </>
  );
}

function WeeklyDialog({ state, onClose, offerings, today, onSaved }: { state: { open: boolean; editing: Item | null }; onClose: () => void; offerings: Item[]; today: string; onSaved: () => void }) {
  const blank: WeeklyForm = { classroomSubjectId: "", dayOfWeek: "2", start: "07:00", end: "09:00", room: "", effectiveFrom: today, effectiveTo: "" };
  const [f, setF] = React.useState<WeeklyForm>(blank);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [serverError, setServerError] = React.useState("");
  const e = state.editing;

  React.useEffect(() => {
    if (!state.open) return;
    setErrors({}); setServerError("");
    setF(e ? { classroomSubjectId: String(e.classroomSubjectId), dayOfWeek: String(e.dayOfWeek), start: clock(e.startMinute), end: clock(e.endMinute), room: e.room || "", effectiveFrom: e.effectiveFrom, effectiveTo: e.effectiveTo || "" } : { ...blank, effectiveFrom: today });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open, e]);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const next: Record<string, string> = {};
    if (!f.classroomSubjectId) next.cs = "Vui lòng chọn lớp – môn";
    if (toMinute(f.end) <= toMinute(f.start)) next.end = "Giờ kết thúc phải sau giờ bắt đầu";
    if (!f.effectiveFrom) next.from = "Vui lòng chọn ngày";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true); setServerError("");
    try {
      await api(e ? `/api/admin/schedules/weekly/${e.id}` : "/api/admin/schedules/weekly", {
        method: e ? "PUT" : "POST",
        body: JSON.stringify({ classroomSubjectId: Number(f.classroomSubjectId), dayOfWeek: Number(f.dayOfWeek), startMinute: toMinute(f.start), endMinute: toMinute(f.end), room: f.room || null, effectiveFrom: f.effectiveFrom, effectiveTo: f.effectiveTo || null }),
      });
      toast.success(e ? "Đã cập nhật thời khóa biểu tuần." : "Đã tạo thời khóa biểu tuần.");
      onClose(); onSaved();
    } catch (err: any) { setServerError(err.message); }
    finally { setBusy(false); }
  }

  const options = offerings.map((o) => ({ value: String(o.id), label: offeringName(o), hint: o.teacher?.fullName }));
  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" onOpenAutoFocus={(ev) => ev.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{e ? `Sửa lịch tuần #${e.id}` : "Thêm thời khóa biểu tuần"}</DialogTitle>
          <DialogDescription>Lịch lặp lại hàng tuần cho một phân công lớp – môn.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Lớp / môn / giảng viên" required error={errors.cs}>
            <Select value={f.classroomSubjectId} onChange={(v) => setF({ ...f, classroomSubjectId: v })} options={options} searchable placeholder="Chọn phân công lớp – môn" invalid={!!errors.cs} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Thứ"><Select value={f.dayOfWeek} onChange={(v) => setF({ ...f, dayOfWeek: v })} options={dayOptions} /></Field>
            <Field label="Phòng học"><Input value={f.room} onChange={(ev) => setF({ ...f, room: ev.target.value })} placeholder="vd: A.201" className="h-10 rounded-lg" /></Field>
            <Field label="Bắt đầu" required><TimePicker value={f.start} onChange={(v) => setF({ ...f, start: v })} /></Field>
            <Field label="Kết thúc" required error={errors.end}><TimePicker value={f.end} onChange={(v) => setF({ ...f, end: v })} /></Field>
            <Field label="Áp dụng từ ngày" required error={errors.from}><DatePicker value={f.effectiveFrom} onChange={(v) => setF({ ...f, effectiveFrom: v })} fromYear={2020} toYear={2040} /></Field>
            <Field label="Đến ngày" hint="Bỏ trống nếu không giới hạn"><DatePicker value={f.effectiveTo} onChange={(v) => setF({ ...f, effectiveTo: v })} clearable fromYear={2020} toYear={2040} /></Field>
          </div>
          {serverError && <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2.5 text-sm">{serverError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} {e ? "Cập nhật" : "Lưu lịch tuần"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionDialog({ state, onClose, offerings, weekly, today, onSaved }: { state: { open: boolean; editing: Item | null }; onClose: () => void; offerings: Item[]; weekly: Item[]; today: string; onSaved: () => void }) {
  const blank: SessionForm = { classroomSubjectId: "", weeklyScheduleId: "", sessionNo: "", sessionDate: today, start: "07:00", end: "09:00", room: "", note: "" };
  const [f, setF] = React.useState<SessionForm>(blank);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [serverError, setServerError] = React.useState("");
  const e = state.editing;

  React.useEffect(() => {
    if (!state.open) return;
    setErrors({}); setServerError("");
    setF(e ? { classroomSubjectId: String(e.classroomSubjectId), weeklyScheduleId: e.weeklyScheduleId ? String(e.weeklyScheduleId) : "", sessionNo: e.sessionNo ? String(e.sessionNo) : "", sessionDate: e.sessionDate, start: clock(e.startMinute), end: clock(e.endMinute), room: e.room || "", note: e.note || "" } : { ...blank, sessionDate: today });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open, e]);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const next: Record<string, string> = {};
    if (!f.classroomSubjectId) next.cs = "Vui lòng chọn lớp – môn";
    if (!f.sessionDate) next.date = "Vui lòng chọn ngày học";
    if (toMinute(f.end) <= toMinute(f.start)) next.end = "Giờ kết thúc phải sau giờ bắt đầu";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true); setServerError("");
    try {
      await api(e ? `/api/admin/schedules/sessions/${e.id}` : "/api/admin/schedules/sessions", {
        method: e ? "PUT" : "POST",
        body: JSON.stringify({
          classroomSubjectId: Number(f.classroomSubjectId),
          weeklyScheduleId: f.weeklyScheduleId ? Number(f.weeklyScheduleId) : null,
          sessionNo: f.sessionNo ? Number(f.sessionNo) : null,
          sessionDate: f.sessionDate, startMinute: toMinute(f.start), endMinute: toMinute(f.end),
          room: f.room || null, note: f.note || null,
        }),
      });
      toast.success(e ? "Đã cập nhật buổi học." : "Đã tạo buổi học.");
      onClose(); onSaved();
    } catch (err: any) { setServerError(err.message); }
    finally { setBusy(false); }
  }

  const options = offerings.map((o) => ({ value: String(o.id), label: offeringName(o), hint: o.teacher?.fullName }));
  const weeklyOptions = [
    { value: "", label: "Buổi học độc lập" },
    ...weekly.filter((w) => String(w.classroomSubjectId) === f.classroomSubjectId).map((w) => ({
      value: String(w.id), label: `${dayNames[w.dayOfWeek]} · ${clock(w.startMinute)}–${clock(w.endMinute)}`, hint: w.room || "Chưa có phòng", disabled: !w.active && String(w.id) !== f.weeklyScheduleId,
    })),
  ];
  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" onOpenAutoFocus={(ev) => ev.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{e ? `Sửa buổi học #${e.id}` : "Thêm buổi học cụ thể"}</DialogTitle>
          <DialogDescription>Tạo một buổi học riêng lẻ, có thể gắn với lịch tuần.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Lớp / môn / giảng viên" required error={errors.cs}>
            <Select value={f.classroomSubjectId} onChange={(v) => setF({ ...f, classroomSubjectId: v, weeklyScheduleId: "" })} options={options} searchable placeholder="Chọn phân công lớp – môn" invalid={!!errors.cs} />
          </Field>
          <Field label="Lịch tuần nguồn" hint="Có thể để độc lập"><Select value={f.weeklyScheduleId} onChange={(v) => setF({ ...f, weeklyScheduleId: v })} options={weeklyOptions} placeholder="Buổi học độc lập" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ngày học" required error={errors.date}><DatePicker value={f.sessionDate} onChange={(v) => setF({ ...f, sessionDate: v })} fromYear={2020} toYear={2040} /></Field>
            <Field label="Số buổi"><Input type="number" min={1} value={f.sessionNo} onChange={(ev) => setF({ ...f, sessionNo: ev.target.value })} placeholder="tùy chọn" className="h-10 rounded-lg" /></Field>
            <Field label="Bắt đầu" required><TimePicker value={f.start} onChange={(v) => setF({ ...f, start: v })} /></Field>
            <Field label="Kết thúc" required error={errors.end}><TimePicker value={f.end} onChange={(v) => setF({ ...f, end: v })} /></Field>
            <Field label="Phòng học"><Input value={f.room} onChange={(ev) => setF({ ...f, room: ev.target.value })} className="h-10 rounded-lg" /></Field>
            <Field label="Ghi chú"><Input value={f.note} onChange={(ev) => setF({ ...f, note: ev.target.value })} className="h-10 rounded-lg" /></Field>
          </div>
          {serverError && <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2.5 text-sm">{serverError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} {e ? "Cập nhật" : "Lưu buổi học"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GenerateDialog({ weekly, today, in90, onClose, onDone }: { weekly: Item | null; today: string; in90: string; onClose: () => void; onDone: () => void }) {
  const [from, setFrom] = React.useState(today);
  const [to, setTo] = React.useState(in90);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  React.useEffect(() => { if (weekly) { setFrom(today); setTo(in90); setError(""); } }, [weekly, today, in90]);

  async function run() {
    if (!weekly) return;
    setBusy(true); setError("");
    try {
      const r = await api(`/api/admin/schedules/weekly/${weekly.id}/generate`, { method: "POST", body: JSON.stringify({ from, to }) });
      toast.success(`Đã tạo ${r.createdCount} buổi học; bỏ qua ${r.skippedCount} ngày đã có buổi học.`);
      onClose(); onDone();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }
  return (
    <Dialog open={!!weekly} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Tạo hàng loạt buổi học</DialogTitle>
          <DialogDescription>{weekly && `${weekly.classroomName} · ${weekly.subjectName} · ${dayNames[weekly.dayOfWeek]}`}. Chỉ tạo những ngày trùng thứ và nằm trong thời gian hiệu lực; ngày đã có buổi học sẽ được bỏ qua.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Từ ngày"><DatePicker value={from} onChange={setFrom} fromYear={2020} toYear={2040} /></Field>
          <Field label="Đến ngày"><DatePicker value={to} onChange={setTo} fromYear={2020} toYear={2040} /></Field>
        </div>
        {error && <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2.5 text-sm">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
          <Button onClick={run} disabled={busy || !from || !to}>{busy ? <Loader2 className="animate-spin" /> : <WandSparkles />} Tạo buổi học</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttendanceSheet({ session, onClose }: { session: Item | null; onClose: () => void }) {
  const [students, setStudents] = React.useState<Item[]>([]);
  const [marks, setMarks] = React.useState<Record<number, { status: string; note: string }>>({});
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async (id: number) => {
    setLoading(true); setError("");
    try {
      const rows: Item[] = await api(`/api/teacher/sessions/${id}/students`);
      setStudents(rows);
      setMarks(Object.fromEntries(rows.map((s) => [s.studentId, { status: s.attendanceStatus || "", note: s.attendanceNote || "" }])));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { if (session) void load(session.id); else setStudents([]); }, [session, load]);

  const missing = students.filter((s) => !marks[s.studentId]?.status).length;

  async function save() {
    if (!session) return;
    if (missing) { setError(`Còn ${missing} sinh viên chưa được chọn trạng thái.`); return; }
    setBusy(true); setError("");
    try {
      await api(`/api/teacher/sessions/${session.id}/attendance`, {
        method: "POST",
        body: JSON.stringify(students.map((s) => ({ studentId: s.studentId, status: marks[s.studentId].status, note: marks[s.studentId].note || null }))),
      });
      toast.success("Đã lưu điểm danh thành công.");
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  const count = (st: string) => students.filter((s) => marks[s.studentId]?.status === st).length;
  return (
    <Sheet open={!!session} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>Điểm danh · {session?.subjectName}</SheetTitle>
          <SheetDescription>{session && `${session.classroomName} · ${viDate(session.sessionDate)} · ${clock(session.startMinute)}–${clock(session.endMinute)}`}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {error && <InlineError message={error} />}
          {loading && <p className="text-muted-foreground py-10 text-center text-sm">Đang tải danh sách…</p>}
          {!loading && students.length === 0 && !error && <EmptyState title="Lớp chưa có sinh viên để điểm danh" />}
          {students.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm">
                  <span className="text-success">{count("PRESENT")} có mặt</span> · <span className="text-warning">{count("LATE")} trễ</span> · <span className="text-destructive">{count("ABSENT")} vắng</span>
                </p>
                <Button size="sm" variant="outline" onClick={() => setMarks(Object.fromEntries(students.map((s) => [s.studentId, { status: "PRESENT", note: marks[s.studentId]?.note || "" }])))}>Tất cả có mặt</Button>
              </div>
              <ul className="space-y-2">
                {students.map((s) => {
                  const m = marks[s.studentId] ?? { status: "", note: "" };
                  return (
                    <li key={s.studentId} className="bg-secondary/30 rounded-xl border p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <UserAvatar name={s.studentName} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{s.studentName}</p>
                          <p className="text-muted-foreground font-mono text-xs">{s.studentCode}</p>
                        </div>
                        <div role="radiogroup" aria-label={`Trạng thái của ${s.studentName}`} className="flex w-full gap-1.5 sm:w-auto">
                          {markOptions.map((o) => (
                            <button key={o.value} type="button" role="radio" aria-checked={m.status === o.value} data-on={m.status === o.value}
                              onClick={() => setMarks({ ...marks, [s.studentId]: { ...m, status: o.value } })}
                              className={cn("hover:bg-accent flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none", o.tone)}>
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {(m.status === "ABSENT" || m.status === "LATE" || m.note) && (
                        <Input value={m.note} onChange={(e) => setMarks({ ...marks, [s.studentId]: { ...m, note: e.target.value } })} placeholder="Ghi chú (nếu có)" aria-label={`Ghi chú cho ${s.studentName}`} className="mt-2.5 h-9 rounded-lg text-sm" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
        {students.length > 0 && (
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} disabled={busy}>Đóng</Button>
            <Button onClick={save} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Lưu điểm danh</Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
