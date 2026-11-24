"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, type Item } from "@/lib/api";
import type { EntityDef, FieldDef } from "@/lib/entities";
import { genderCode, statusLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, PencilLine } from "lucide-react";
import { StudentImport } from "./student-import";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Field } from "./shared";

type Props = {
  def: EntityDef;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Item | null;
  lookup: Record<string, Item[]>;
  onSaved: () => void;
};

const genderOptions: SelectOption[] = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];
const statusOptions: SelectOption[] = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

function toForm(def: EntityDef, row: Item | null): Item {
  if (!row) return def.slug === "students" ? { status: "STUDYING" } : {};
  const d: Item = { ...row };
  for (const k of ["courseYear", "faculty", "classroom", "teacher", "subject", "classSubject"]) if (row[k]) d[k + "Id"] = row[k].id;
  if (d.gender) d.gender = genderCode[d.gender] || d.gender;
  return d;
}

export function EntityFormDialog({ def, open, onOpenChange, editing, lookup, onSaved }: Props) {
  const [form, setForm] = React.useState<Item>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [serverError, setServerError] = React.useState("");

  const hasCode = def.slug === "students" || def.slug === "teachers";
  React.useEffect(() => {
    if (!open) return;
    setForm(toForm(def, editing));
    setErrors({});
    setServerError("");
    if (hasCode && !editing) {
      let alive = true;
      api<{ code: string }>("/api/catalog/next-code/" + def.slug)
        .then((r) => alive && setForm((f) => (f.code ? f : { ...f, code: r.code })))
        .catch(() => {});
      return () => { alive = false; };
    }
  }, [open, editing, def, hasCode]);

  const set = (patch: Item) => setForm((f) => ({ ...f, ...patch }));

  function lookupOptions(field: FieldDef): SelectOption[] {
    const list = lookup[field.lookup!] ?? [];
    const classFaculty = (id: unknown) => lookup.classes?.find((c) => String(c.id) === String(id))?.faculty?.id;
    let filtered = list;
    if (field.lookup === "teachers" && (def.slug === "classes" || def.slug === "class-subjects")) {
      const fid = def.slug === "classes" ? form.facultyId : classFaculty(form.classroomId);
      if (fid) filtered = list.filter((x) => String(x.faculty?.id) === String(fid));
    }
    if (field.lookup === "subjects" && def.slug === "class-subjects") {
      const fid = classFaculty(form.classroomId);
      if (fid) filtered = list.filter((x) => String(x.faculty?.id) === String(fid));
    }
    return filtered.map((x) => ({ value: String(x.id), label: x.name || x.fullName || String(x.id), hint: x.code }));
  }

  function validate() {
    const next: Record<string, string> = {};
    for (const f of def.fields) {
      const v = form[f.key];
      if (f.key === "code" && hasCode && v) {
        const taken = (lookup[def.slug] ?? []).some((x) => x.id !== editing?.id && String(x.code).toLowerCase() === String(v).trim().toLowerCase());
        if (taken) { next[f.key] = "Mã này đã tồn tại, hãy chọn mã khác"; continue; }
      }
      if (f.required && (v === undefined || v === null || String(v).trim() === "")) next[f.key] = "Vui lòng nhập thông tin này";
      else if (f.type === "email" && v && !/^\S+@\S+\.\S+$/.test(String(v))) next[f.key] = "Email chưa đúng định dạng";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setServerError("");
    try {
      const saved = await api(`/api/catalog/${def.slug}${editing ? "/" + editing.id : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      if (def.slug === "classes") {
        const teacherId = Number(form.teacherId);
        const classId = Number(saved?.id ?? editing?.id);
        const persisted = (await api<Item[]>("/api/catalog/classes")).find((c) => Number(c.id) === classId);
        if (!teacherId || Number(saved?.teacher?.id) !== teacherId || Number(persisted?.teacher?.id) !== teacherId) {
          throw new Error("Backend chưa xác nhận lưu giảng viên cho lớp. Vui lòng kiểm tra lại dữ liệu.");
        }
      }
      toast.success(editing ? "Đã cập nhật " + def.singular + "." : "Đã thêm " + def.singular + " mới.");
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function renderControl(f: FieldDef) {
    const id = "f-" + f.key;
    const invalid = !!errors[f.key];
    switch (f.type) {
      case "gender":
        return <Select id={id} value={form[f.key]} onChange={(v) => set({ [f.key]: v })} options={genderOptions} placeholder="Chọn giới tính" />;
      case "status":
        return <Select id={id} value={form[f.key] || "STUDYING"} onChange={(v) => set({ [f.key]: v })} options={statusOptions} />;
      case "date":
        return <DatePicker id={id} value={form[f.key]} onChange={(v) => set({ [f.key]: v })} placeholder="Chọn ngày sinh" clearable toYear={new Date().getFullYear()} />;
      case "lookup": {
        const depends = def.slug === "classes" && f.key === "teacherId" && !form.facultyId;
        return (
          <Select
            id={id}
            invalid={invalid}
            value={form[f.key] ? String(form[f.key]) : ""}
            disabled={depends}
            placeholder={depends ? "Chọn khoa trước" : `Chọn ${f.label.toLowerCase()}`}
            options={lookupOptions(f)}
            searchable
            onChange={(v) => {
              const value = Number(v);
              set({
                [f.key]: value,
                ...(def.slug === "classes" && f.key === "facultyId" ? { teacherId: undefined } : {}),
                ...(def.slug === "class-subjects" && f.key === "classroomId" ? { subjectId: undefined, teacherId: undefined } : {}),
              });
            }}
          />
        );
      }
      default:
        return (
          <Input
            id={id}
            type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
            inputMode={f.type === "number" ? "numeric" : undefined}
            aria-invalid={invalid || undefined}
            placeholder={f.placeholder}
            value={form[f.key] ?? ""}
            onChange={(e) => set({ [f.key]: e.target.value })}
            className="h-10 rounded-lg"
          />
        );
    }
  }

  const [mode, setMode] = React.useState<"manual" | "excel">("manual");
  React.useEffect(() => { if (open) setMode("manual"); }, [open]);
  const canImport = def.slug === "students" && !editing;
  const wide = def.fields.length <= 3;

  const manualForm = (
    <form id="entity-form" onSubmit={submit} noValidate className="space-y-4">
      <div className={wide ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        {def.fields.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={"f-" + f.key} required={f.required} error={errors[f.key]} hint={f.key === "code" && hasCode && !editing ? "Tự động tạo, bạn có thể sửa" : undefined}>
            {renderControl(f)}
          </Field>
        ))}
      </div>
      {serverError && <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2.5 text-sm">{serverError}</p>}
    </form>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="border-b">
          <SheetTitle>{def.slug === "classes" && editing ? "Phân công giảng viên" : `${editing ? "Cập nhật" : "Thêm"} ${def.singular}`}</SheetTitle>
          <SheetDescription>
            {def.slug === "classes" ? "Giảng viên phụ trách phải thuộc cùng khoa với lớp." : canImport ? "Thêm từng sinh viên hoặc nhập hàng loạt từ file Excel." : "Điền thông tin bên dưới rồi bấm Lưu."}
          </SheetDescription>
        </SheetHeader>
        {canImport && (
          <div className="border-b px-4 pt-3 pb-3">
            <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <TabsList className="w-full">
                <TabsTrigger value="manual" className="flex-1 gap-2"><PencilLine className="size-4" /> Thêm thủ công</TabsTrigger>
                <TabsTrigger value="excel" className="flex-1 gap-2"><FileSpreadsheet className="size-4" /> Tải lên Excel</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === "excel" && canImport ? (
            <StudentImport onImported={() => { onOpenChange(false); onSaved(); }} />
          ) : manualForm}
        </div>
        {!(mode === "excel" && canImport) && (
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Hủy</Button>
            <Button type="submit" form="entity-form" disabled={busy}>{busy && <Loader2 className="animate-spin" />} {busy ? "Đang lưu…" : "Lưu"}</Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
