"use client";

import * as React from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials, statusLabels } from "@/lib/labels";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn("size-9 rounded-xl", className)}>
      <AvatarFallback className="bg-primary/15 text-primary rounded-xl text-xs font-semibold">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

const statusTone: Record<string, string> = {
  STUDYING: "bg-success/15 text-success",
  ACTIVE: "bg-success/15 text-success",
  GRADUATED: "bg-info/15 text-info",
  RESERVED: "bg-warning/15 text-warning",
  SUSPENDED: "bg-warning/15 text-warning",
  DROPPED_OUT: "bg-destructive/15 text-destructive",
  EXPELLED: "bg-destructive/15 text-destructive",
  INACTIVE: "bg-muted text-muted-foreground",
  PRESENT: "bg-success/15 text-success",
  ABSENT: "bg-destructive/15 text-destructive",
  LATE: "bg-warning/15 text-warning",
  SCHEDULED: "bg-info/15 text-info",
  COMPLETED: "bg-success/15 text-success",
  CANCELLED: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5 border-0 font-medium", statusTone[value] ?? "bg-muted text-muted-foreground")}>
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? statusLabels[value] ?? value}
    </Badge>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 font-mono text-xs">
      {children || "—"}
    </span>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  tone = "default",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span
        className={cn(
          "grid size-12 place-items-center rounded-2xl",
          tone === "error" ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground",
        )}
      >
        {tone === "error" ? <AlertCircle className="size-6" /> : <Icon className="size-6" />}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        {description && <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[13px]">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  destructive,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? "Đang xử lý…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "success" | "warning" | "info";
}) {
  const tones = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
  };
  return (
    <div className="bg-card flex items-center gap-4 rounded-2xl border p-5">
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="size-6" />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-3xl leading-tight font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <span className="flex items-center gap-2">
        <AlertCircle className="size-4 shrink-0" /> {message}
      </span>
      {onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry} className="text-destructive hover:text-destructive">
          Thử lại
        </Button>
      )}
    </div>
  );
}
