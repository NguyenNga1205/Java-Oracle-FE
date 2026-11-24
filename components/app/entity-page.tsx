"use client";

import * as React from "react";
import { Eye, Pencil, Plus, Trash2, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { api, type Item } from "@/lib/api";
import { entityAccess, lookupKeys, type EntityDef } from "@/lib/entities";
import { statusLabels, viDate } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "./auth";
import { DataTable, type Column } from "./data-table";
import { EntityFormDialog } from "./entity-form";
import { Code, ConfirmDialog, EmptyState, PageHeader, StatusBadge, UserAvatar } from "./shared";

const label = (x?: Item | null) => x?.name || x?.fullName || "—";

function IconAction({ tip, onClick, children, danger }: { tip: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={tip} onClick={onClick} className={danger ? "text-destructive hover:text-destructive hover:bg-destructive/10 size-8" : "size-8"}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

export function EntityPage({ def }: { def: EntityDef }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const allowed = !!user && entityAccess[user.role]?.includes(def.slug);

  const [rows, setRows] = React.useState<Item[]>([]);
  const [lookup, setLookup] = React.useState<Record<string, Item[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Item | null>(null);
  const [deleting, setDeleting] = React.useState<Item | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [classFilter, setClassFilter] = React.useState("");
  const [viewClass, setViewClass] = React.useState<Item | null>(null);

  const load = React.useCallback(async () => {
    if (!user || !allowed) return;
    setLoading(true);
    setError("");
    try {
      if (isAdmin) {
        const results = await Promise.all(lookupKeys.map((k) => api("/api/catalog/" + k)));
        const map = Object.fromEntries(lookupKeys.map((k, i) => [k, results[i]]));
        setLookup(map);
        setRows(map[def.slug] ?? (await api("/api/catalog/" + def.slug)));
      } else {
        let list: Item[] = await api("/api/catalog/" + def.slug);
        if (def.slug === "teachers") {
          const me = await api("/api/teacher/profile");
          list = list.filter((t) => t.faculty?.id === me.faculty?.id);
        }
        setRows(list);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user, allowed, isAdmin, def.slug]);

  React.useEffect(() => {
    setClassFilter("");
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api(`/api/catalog/${def.slug}/${deleting.id}`, { method: "DELETE" });
      toast.success("Đã xóa " + def.singular + ".");
      setDeleting(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns = React.useMemo<Column<Item>[]>(() => {
    const person = (x: Item) => (
      <div className="flex items-center gap-3">
        <UserAvatar name={label(x)} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{label(x)}</p>
          <p className="text-muted-foreground truncate text-xs">{x.email || x.phone || `ID #${x.id}`}</p>
        </div>
      </div>
    );
    const base: Column<Item>[] = [];
    switch (def.slug) {
      case "years":
        base.push(
          { key: "name", header: "Khóa", cell: person, sortValue: (x) => x.name },
          { key: "startYear", header: "Năm bắt đầu", cell: (x) => <span className="tabular-nums">{x.startYear}</span>, sortValue: (x) => x.startYear },
        );
        break;
      case "faculties":
        base.push(
          { key: "name", header: "Khoa", cell: person, sortValue: (x) => x.name },
          { key: "year", header: "Khóa học", cell: (x) => x.courseYear?.name ?? "—" },
        );
        break;
      case "classes":
        base.push(
          { key: "name", header: "Lớp", cell: person, sortValue: (x) => x.name },
          { key: "code", header: "Mã lớp", cell: (x) => <Code>{x.code}</Code> },
          { key: "faculty", header: "Khoa", cell: (x) => x.faculty?.name ?? "—" },
          { key: "teacher", header: "Giảng viên phụ trách", cell: (x) => x.teacher?.fullName ?? <span className="text-warning">Chưa phân công</span> },
        );
        break;
      case "subjects":
        base.push(
          { key: "code", header: "Mã môn", cell: (x) => <Code>{x.code}</Code>, sortValue: (x) => x.code },
          { key: "name", header: "Tên môn", cell: (x) => <span className="font-semibold">{x.name}</span>, sortValue: (x) => x.name },
          { key: "faculty", header: "Khoa", cell: (x) => x.faculty?.name ?? "—" },
        );
        break;
      case "teachers":
        base.push(
          { key: "name", header: "Giảng viên", cell: person, sortValue: (x) => x.fullName },
          { key: "code", header: "Mã GV", cell: (x) => <Code>{x.code}</Code> },
          { key: "faculty", header: "Khoa", cell: (x) => x.faculty?.name ?? "—" },
        );
        break;
      case "class-subjects":
        base.push(
          { key: "class", header: "Lớp", cell: (x) => <span className="font-semibold">{x.classroom?.name ?? "—"}</span> },
          { key: "subject", header: "Môn học", cell: (x) => x.subject?.name ?? "—" },
          { key: "teacher", header: "Giảng viên", cell: (x) => x.teacher?.fullName ?? "—" },
        );
        break;
      case "students":
        base.push(
          { key: "name", header: "Sinh viên", cell: person, sortValue: (x) => x.fullName },
          { key: "code", header: "Mã SV", cell: (x) => <Code>{x.code}</Code>, sortValue: (x) => x.code },
          { key: "class", header: "Lớp", cell: (x) => x.classroomName || x.classroom?.name || <span className="text-muted-foreground">Chưa xếp lớp</span> },
          { key: "dob", header: "Ngày sinh", cell: (x) => viDate(x.dateOfBirth) },
          { key: "status", header: "Trạng thái", cell: (x) => <StatusBadge value={x.status || "STUDYING"} /> },
        );
        break;
    }
    if (isAdmin || def.slug === "classes") {
      base.push({
        key: "actions", header: "", align: "right", className: "w-px whitespace-nowrap",
        cell: (x) => (
          <div className="flex justify-end gap-0.5">
            {def.slug === "classes" && <IconAction tip="Xem sinh viên trong lớp" onClick={() => setViewClass(x)}><Eye className="size-4" /></IconAction>}
            {isAdmin && (
              <>
                <IconAction tip={def.slug === "classes" ? "Phân công giảng viên" : "Chỉnh sửa"} onClick={() => { setEditing(x); setFormOpen(true); }}>
                  {def.slug === "classes" ? <UserRoundCog className="size-4" /> : <Pencil className="size-4" />}
                </IconAction>
                <IconAction tip="Xóa" danger onClick={() => setDeleting(x)}><Trash2 className="size-4" /></IconAction>
              </>
            )}
          </div>
        ),
      });
    }
    return base;
  }, [def.slug, isAdmin]);

  if (!user) return null;
  if (!allowed) return <EmptyState title="Bạn không có quyền xem trang này" />;

  const visibleRows =
    def.slug === "students" && classFilter
      ? rows.filter((x) =>
          classFilter === "NONE" ? !(x.classroom?.id ?? x.classroomId) : String(x.classroom?.id ?? x.classroomId ?? "") === classFilter,
        )
      : rows;

  const classOptions = [
    { value: "", label: "Tất cả lớp" },
    { value: "NONE", label: "Chưa xếp lớp" },
    ...(lookup.classes ?? []).map((c) => ({ value: String(c.id), label: c.name, hint: c.code })),
  ];

  const searchText = (x: Item) =>
    [x.code, x.name, x.fullName, x.email, x.phone, x.classroom?.name, x.classroomName, x.faculty?.name, x.courseYear?.name, x.teacher?.fullName, x.subject?.name, x.startYear, statusLabels[x.status]]
      .filter(Boolean)
      .join(" ");

  return (
    <>
      <PageHeader
        title={def.title}
        description={def.slug === "teachers" && !isAdmin ? "Giảng viên cùng khoa với bạn." : def.description}
        actions={isAdmin && (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="h-10 rounded-lg">
            <Plus /> Thêm {def.singular}
          </Button>
        )}
      />
      <DataTable
        rows={visibleRows}
        columns={columns}
        rowKey={(x) => x.id}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        searchText={searchText}
        searchPlaceholder={`Tìm ${def.singular}…`}
        pageSize={def.slug === "students" ? 25 : 12}
        noun={def.singular}
        emptyTitle={`Chưa có ${def.singular} nào`}
        emptyDescription={isAdmin ? `Bấm “Thêm ${def.singular}” để tạo bản ghi đầu tiên.` : undefined}
        emptyAction={isAdmin && <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> Thêm {def.singular}</Button>}
        filters={def.slug === "students" && isAdmin ? (
          <div className="w-48">
            <Select aria-label="Lọc theo lớp" value={classFilter} onChange={setClassFilter} options={classOptions} placeholder="Tất cả lớp" searchable />
          </div>
        ) : undefined}
      />

      {isAdmin && (
        <EntityFormDialog
          def={def}
          open={formOpen}
          onOpenChange={setFormOpen}
          editing={editing}
          lookup={lookup}
          onSaved={() => void load()}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Xóa ${def.singular}?`}
        description={`“${label(deleting)}” sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
        destructive
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
      <ClassStudentsSheet classroom={viewClass} onClose={() => setViewClass(null)} />
    </>
  );
}

function ClassStudentsSheet({ classroom, onClose }: { classroom: Item | null; onClose: () => void }) {
  const [state, setState] = React.useState<{ classroom: Item; students: Item[]; count: number } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!classroom) return;
    setState(null);
    setError("");
    setLoading(true);
    api(`/api/catalog/classes/${classroom.id}/students`)
      .then((r) => setState({ classroom: r.classroom ?? classroom, students: r.students ?? [], count: r.currentCount ?? 0 }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [classroom]);

  const c = state?.classroom ?? classroom;
  return (
    <Sheet open={!!classroom} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{c?.name} {c?.code && <span className="text-muted-foreground font-mono text-sm">· {c.code}</span>}</SheetTitle>
          <SheetDescription>
            Khoa {c?.faculty?.name || "—"} · GVCN {c?.teacher?.fullName || "chưa phân công"}
            {state && <> · Sĩ số {state.count}/{c?.maxStudents || 50}</>}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-muted-foreground py-8 text-center text-sm">Đang tải danh sách…</p>}
          {error && <EmptyState tone="error" title="Không tải được danh sách" description={error} />}
          {state && state.students.length === 0 && <EmptyState title="Lớp chưa có sinh viên" />}
          <ul className="space-y-1.5">
            {state?.students.map((s) => (
              <li key={s.id} className="bg-secondary/40 flex items-center gap-3 rounded-xl px-3 py-2.5">
                <UserAvatar name={s.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.fullName}</p>
                  <p className="text-muted-foreground font-mono text-xs">{s.code}</p>
                </div>
                <StatusBadge value={s.status || "STUDYING"} />
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

