"use client";

import * as React from "react";
import { CheckCircle2, Download, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { downloadFile, upload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { InlineError } from "./shared";

type Preview = {
  total: number;
  valid: number;
  invalid: number;
  rows: { row: number; code: string; fullName: string; valid: boolean; errors: string[] }[];
};

/** Excel import for students: download template -> choose file -> validate -> confirm. */
export function StudentImport({ onImported }: { onImported: () => void }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const choose = (f: File | null) => {
    setFile(f);
    setPreview(null);
    setError("");
  };

  async function check() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setPreview(await upload<Preview>("/api/admin/import/students/preview", file));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const r = await upload<{ message?: string; imported?: number }>("/api/admin/import/students/confirm", file);
      toast.success(r.imported ? `Đã nhập ${r.imported} sinh viên.` : r.message || "Đã nhập dữ liệu sinh viên.");
      onImported();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-secondary/40 flex items-center justify-between gap-3 rounded-xl border p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Bước 1 · Tải file mẫu</p>
          <p className="text-muted-foreground text-xs">Điền từ dòng 2, giữ nguyên tên và thứ tự các cột.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadFile("/api/admin/import/students/template", "student-import-template.xlsx").catch((e) => toast.error(e.message))}>
          <Download /> Tải mẫu
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Bước 2 · Chọn file và kiểm tra</p>
        <Dropzone file={file} onFile={choose} disabled={busy} hint="chỉ nhận file .xlsx" />
        {file && !preview && (
          <Button onClick={check} disabled={busy} className="w-full">
            {busy ? <><Loader2 className="animate-spin" /> Đang kiểm tra…</> : "Kiểm tra dữ liệu"}
          </Button>
        )}
      </div>

      {error && <InlineError message={error} />}

      {preview && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Bước 3 · Xác nhận nhập</p>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              ["Tổng dòng", preview.total, "bg-secondary"],
              ["Hợp lệ", preview.valid, "bg-success/15 text-success"],
              ["Có lỗi", preview.invalid, "bg-destructive/15 text-destructive"],
            ].map(([l, v, c]) => (
              <div key={l as string} className={`rounded-xl p-3 ${c}`}>
                <p className="text-xs opacity-80">{l}</p>
                <p className="text-xl font-bold tabular-nums">{v}</p>
              </div>
            ))}
          </div>
          {preview.invalid > 0 && (
            <>
              <ul className="max-h-52 space-y-1.5 overflow-y-auto">
                {preview.rows.filter((r) => !r.valid).map((r) => (
                  <li key={r.row} className="border-destructive/30 bg-destructive/10 rounded-lg border px-3 py-2 text-xs">
                    <span className="font-semibold">Dòng {r.row}</span> {r.code && <span className="font-mono">· {r.code}</span>}
                    <span className="text-destructive block">{r.errors.join("; ")}</span>
                  </li>
                ))}
              </ul>
              <p className="text-warning flex items-start gap-2 text-xs">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" /> Sửa các dòng lỗi trong Excel, chọn lại file rồi kiểm tra lại.
              </p>
            </>
          )}
          {preview.invalid === 0 && (
            <p className="text-success flex items-center gap-2 text-sm"><CheckCircle2 className="size-4" /> Toàn bộ {preview.valid} dòng hợp lệ.</p>
          )}
          <Button onClick={confirm} disabled={busy || preview.invalid > 0 || preview.valid === 0} className="w-full">
            {busy ? <><Loader2 className="animate-spin" /> Đang nhập…</> : `Nhập ${preview.valid} sinh viên`}
          </Button>
        </div>
      )}
    </div>
  );
}
