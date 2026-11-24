"use client";

import * as React from "react";
import { Eye, Users } from "lucide-react";
import { api, type Item } from "@/lib/api";
import { DataTable, type Column } from "@/components/app/data-table";
import { Code, EmptyState, PageHeader, StatusBadge, UserAvatar } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function TeachingClassesPage() {
  const [rows, setRows] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [open, setOpen] = React.useState<Item | null>(null);
  const [detail, setDetail] = React.useState<Item | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await api("/api/catalog/teaching-classes")); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  React.useEffect(() => {
    if (!open) return;
    setDetail(null); setDetailError(""); setDetailLoading(true);
    api(`/api/catalog/teaching-classes/${open.id}/students`)
      .then(setDetail)
      .catch((e) => setDetailError(e.message))
      .finally(() => setDetailLoading(false));
  }, [open]);

  const columns: Column<Item>[] = [
    { key: "subject", header: "Môn học", sortValue: (o) => o.subject?.name ?? "", cell: (o) => (
      <div><p className="font-semibold">{o.subject?.name || "—"}</p><p className="text-muted-foreground text-xs">{o.subject?.code || "Chưa có mã môn"}</p></div>
    ) },
    { key: "class", header: "Lớp hành chính", cell: (o) => (
      <div><p className="font-medium">{o.classroom?.name || "—"}</p><p className="text-muted-foreground text-xs">{o.classroom?.code || "—"}</p></div>
    ) },
    { key: "faculty", header: "Khoa", cell: (o) => o.classroom?.faculty?.name || "—" },
    { key: "code", header: "Mã phân công", cell: (o) => <Code>{o.code || `PC-${o.id}`}</Code> },
    { key: "actions", header: "", align: "right", cell: (o) => (
      <Button size="sm" variant="outline" onClick={() => setOpen(o)}><Eye /> Xem lớp</Button>
    ) },
  ];

  return (
    <>
      <PageHeader title="Lớp giảng dạy" description="Các lớp và môn học được giao cho tài khoản giảng viên của bạn." />
      <DataTable rows={rows} columns={columns} rowKey={(o) => o.id} loading={loading} error={error} onRetry={() => void load()}
        searchText={(o) => `${o.subject?.name} ${o.subject?.code} ${o.classroom?.name} ${o.classroom?.code}`} searchPlaceholder="Tìm môn hoặc lớp…" noun="lớp môn học"
        emptyTitle="Bạn chưa được phân công lớp nào" emptyDescription="Khi quản trị viên phân công, các lớp sẽ xuất hiện ở đây." />

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>{open?.subject?.name} · {open?.classroom?.name}</SheetTitle>
            <SheetDescription className="flex items-center gap-2">
              <Users className="size-4" /> {detail ? `${detail.currentCount} sinh viên` : "Đang tải…"} · GV {open?.teacher?.fullName || "—"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {detailLoading && <p className="text-muted-foreground py-8 text-center text-sm">Đang tải danh sách sinh viên…</p>}
            {detailError && <EmptyState tone="error" title="Không tải được danh sách" description={detailError} />}
            {detail && detail.students.length === 0 && <EmptyState title="Lớp chưa có sinh viên" />}
            <ul className="space-y-1.5">
              {detail?.students.map((s: Item) => (
                <li key={s.id} className="bg-secondary/40 flex items-center gap-3 rounded-xl px-3 py-2.5">
                  <UserAvatar name={s.fullName} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{s.fullName}</p><p className="text-muted-foreground font-mono text-xs">{s.code}</p></div>
                  <StatusBadge value={s.status || "STUDYING"} />
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
