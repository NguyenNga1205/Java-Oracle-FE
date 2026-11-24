"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { vi } from "react-day-picker/locale";
import { cn } from "@/lib/utils";
import { isoDate, parseIso } from "@/lib/labels";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerProps = {
  /** ISO date string yyyy-MM-dd */
  value: string | undefined | null;
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
  /** Earliest / latest selectable year in the quick year grid */
  fromYear?: number;
  toYear?: number;
};

const MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

/** Custom date picker with day / month / year views. Replaces <input type="date">. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  clearable,
  disabled,
  invalid,
  id,
  className,
  fromYear = 1960,
  toYear = new Date().getFullYear() + 10,
}: DatePickerProps) {
  const selected = parseIso(value);
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(selected ?? new Date());
  const [view, setView] = React.useState<"day" | "month" | "year">("day");

  React.useEffect(() => {
    if (open) {
      setMonth(selected ?? new Date());
      setView("day");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = toYear; y >= fromYear; y--) list.push(y);
    return list;
  }, [fromYear, toYear]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            "border-input bg-secondary/40 hover:bg-secondary/70 data-[state=open]:border-ring flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : placeholder}
          </span>
          <span className="flex items-center gap-1">
            {clearable && selected && !disabled && (
              <span
                role="button"
                aria-label="Xóa ngày"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="text-muted-foreground hover:text-foreground rounded p-0.5"
              >
                <X className="size-3.5" />
              </span>
            )}
            <CalendarDays className="text-muted-foreground size-4" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[17.5rem] p-0">
        <div className="flex items-center justify-between gap-1 px-3 pt-3">
          <button
            type="button"
            aria-label="Tháng trước"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-8 place-items-center rounded-md"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setView(view === "month" ? "day" : "month")}
              className="hover:bg-accent rounded-md px-2 py-1 text-sm font-semibold"
            >
              {MONTHS[month.getMonth()]}
            </button>
            <button
              type="button"
              onClick={() => setView(view === "year" ? "day" : "year")}
              className="hover:bg-accent rounded-md px-2 py-1 text-sm font-semibold"
            >
              {month.getFullYear()}
            </button>
          </div>
          <button
            type="button"
            aria-label="Tháng sau"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-8 place-items-center rounded-md"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {view === "day" && (
          <Calendar
            mode="single"
            locale={vi}
            weekStartsOn={1}
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={(d) => {
              if (!d) return;
              onChange(isoDate(d));
              setOpen(false);
            }}
            showOutsideDays
            formatters={{ formatWeekdayName: (d) => ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()] }}
            classNames={{ month_caption: "hidden", nav: "hidden" }}
            className="p-3 pt-1"
          />
        )}
        {view === "month" && (
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMonth(new Date(month.getFullYear(), i, 1));
                  setView("day");
                }}
                className={cn(
                  "hover:bg-accent rounded-md py-2 text-sm",
                  i === month.getMonth() && "bg-primary text-primary-foreground hover:bg-primary font-semibold",
                )}
              >
                {m.replace("Tháng ", "T")}
              </button>
            ))}
          </div>
        )}
        {view === "year" && (
          <div
            className="grid max-h-60 grid-cols-4 gap-1.5 overflow-y-auto p-3"
            onWheel={(e) => e.stopPropagation()}
          >
            {years.map((y) => (
              <button
                key={y}
                type="button"
                ref={(el) => {
                  if (el && y === month.getFullYear()) el.scrollIntoView({ block: "center" });
                }}
                onClick={() => {
                  setMonth(new Date(y, month.getMonth(), 1));
                  setView("month");
                }}
                className={cn(
                  "hover:bg-accent rounded-md py-2 text-sm",
                  y === month.getFullYear() && "bg-primary text-primary-foreground hover:bg-primary font-semibold",
                )}
              >
                {y}
              </button>
            ))}
          </div>
        )}
        <div className="border-t px-3 py-2">
          <button
            type="button"
            onClick={() => {
              onChange(isoDate(new Date()));
              setOpen(false);
            }}
            className="text-primary text-xs font-semibold hover:underline"
          >
            Hôm nay
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
