"use client";

import * as React from "react";
import { CheckCircle2, Download, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { downloadFile, upload } from "@/lib/api";
import { InlineError, PageHeader } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Preview = {
  total: number;
  valid: number;
  invalid: number;
  rows: { row: number; code: string; fullName: string; valid: boolean; errors: string[] }[];
};

const steps = ["Tải file mẫu", "Chọn file & kiểm tra", "Xác nhận nhập"];

export default function ImportPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState("");

  const step = preview ? 2 : file ? 1 : 0;

  async function check() {
    if (!file) return;
    setBusy(true); setError(""); setDone("");
    try { setPreview(await upload<Preview>("/api/admin/import/students/preview", file)); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function confirm() {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const r = await upload<{ message?: string }>("/api/admin/import/students/confirm", file);
      const msg = r.message || "Đã nhập dữ liệu sinh viên thành công.";
      toast.success(msg);
      setDone(msg); setPreview(null); setFile(null);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Nhập sinh viên từ Excel" description="Tải file mẫu, điền thông tin rồi tải lên. Hệ thống sẽ kiểm tra từng dòng trước khi lưu." />

      <ol className="mb-6 flex flex-wrap gap-3">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm ${i === step ? "border-primary bg-primary/10 font-semibold" : i < step ? "text-muted-foreground" : "text-muted-foreground"}`}>
            <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${i <= step ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="bg-card space-y-5 rounded-2xl border p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">1. File mẫu</h2>
              <p className="text-muted-foreground mt-1 text-sm">Giữ nguyên tên các cột trong file mẫu.</p>
            </div>
            <Button variant="outline" onClick={() => downloadFile("/api/admin/import/students/template", "student-import-template.xlsx").catch((e) => toast.error(e.message))}>
              <Download /> Tải mẫu
            </Button>
          </div>
          <h2 className="font-semibold">2. Tải file lên</h2>
          <Dropzone file={file} onFile={(f) => { setFile(f); setPreview(null); setError(""); setDone(""); }} disabled={busy} hint="chỉ nhận file .xlsx" />
          <Button disabled={!file || busy} onClick={check} className="h-10 w-full rounded-lg">
            {busy && !preview ? <><Loader2 className="animate-spin" /> Đang kiểm tra…</> : "Kiểm tra dữ liệu"}
          </Button>
          {error && <InlineError message={error} />}
          {done && (
            <p role="status" className="bg-success/10 text-success flex items-center gap-2 rounded-xl px-4 py-3 text-sm"><CheckCircle2 className="size-4" /> {done}</p>
          )}
        </section>

        <section className="bg-card rounded-2xl border p-6">
          <h2 className="font-semibold">3. Kết quả kiểm tra</h2>
          {!preview ? (
            <p className="text-muted-foreground py-16 text-center text-sm">Kết quả sẽ hiển thị ở đây sau khi bạn kiểm tra file.</p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["Tổng dòng", preview.total, "bg-secondary"],
                  ["Hợp lệ", preview.valid, "bg-success/15 text-success"],
                  ["Có lỗi", preview.invalid, "bg-destructive/15 text-destructive"],
                ].map(([l, v, c]) => (
                  <div key={l as string} className={`rounded-xl p-3 ${c}`}>
                    <p className="text-xs opacity-80">{l}</p>
                    <p className="mt-0.5 text-2xl font-bold tabular-nums">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 max-h-80 overflow-auto rounded-xl border">
                <Table>
                  <TableHeader><TableRow><TableHead>Dòng</TableHead><TableHead>Mã SV</TableHead><TableHead>Họ tên</TableHead><TableHead>Kết quả</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {preview.rows.map((r) => (
                      <TableRow key={r.row}>
                        <TableCell className="tabular-nums">{r.row}</TableCell>
                        <TableCell className="font-mono text-xs">{r.code || "—"}</TableCell>
                        <TableCell>{r.fullName || "—"}</TableCell>
                        <TableCell className="whitespace-normal">{r.valid ? <span className="text-success">Hợp lệ</span> : <span className="text-destructive">{r.errors.join("; ")}</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.invalid > 0 && (
                <p className="text-warning mt-3 flex items-start gap-2 text-sm"><ShieldAlert className="mt-0.5 size-4 shrink-0" /> Hãy sửa các dòng lỗi trong Excel, chọn lại file rồi kiểm tra lại trước khi nhập.</p>
              )}
              <Button disabled={busy || preview.invalid > 0 || preview.valid === 0} onClick={confirm} className="mt-5 h-10 rounded-lg">
                {busy ? <><Loader2 className="animate-spin" /> Đang nhập…</> : `Xác nhận nhập ${preview.valid} sinh viên`}
              </Button>
            </>
          )}
        </section>
      </div>
    </>
  );
}
