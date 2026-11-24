"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type TimePickerProps = {
  /** HH:mm */
  value: string;
  onChange: (value: string) => void;
  minuteStep?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Custom time picker with hour / minute columns. Replaces <input type="time">. */
export function TimePicker({ value, onChange, minuteStep = 5, disabled, id, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [h, m] = (value || "07:00").split(":").map(Number);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
  if (!minutes.includes(m)) minutes.push(m);
  minutes.sort((a, b) => a - b);

  const column = (items: number[], current: number, set: (n: number) => void, label: string) => (
    <div
      className="flex max-h-56 w-16 flex-col gap-0.5 overflow-y-auto p-1.5"
      role="listbox"
      aria-label={label}
      onWheel={(e) => e.stopPropagation()}
    >
      {items.map((n) => (
        <button
          key={n}
          type="button"
          role="option"
          aria-selected={n === current}
          ref={(el) => {
            if (el && n === current && open) el.scrollIntoView({ block: "center" });
          }}
          onClick={() => set(n)}
          className={cn(
            "hover:bg-accent rounded-md py-1.5 text-center font-mono text-sm",
            n === current && "bg-primary text-primary-foreground hover:bg-primary font-semibold",
          )}
        >
          {pad(n)}
        </button>
      ))}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "border-input bg-secondary/40 hover:bg-secondary/70 data-[state=open]:border-ring flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left font-mono text-sm transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] disabled:opacity-50",
            className,
          )}
        >
          <span>{value || "--:--"}</span>
          <Clock className="text-muted-foreground size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex divide-x">
          {column(hours, h, (n) => onChange(`${pad(n)}:${pad(m)}`), "Giờ")}
          {column(minutes, m, (n) => onChange(`${pad(h)}:${pad(n)}`), "Phút")}
        </div>
        <div className="border-t px-3 py-2 text-right">
          <button type="button" onClick={() => setOpen(false)} className="text-primary text-xs font-semibold hover:underline">
            Xong
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
