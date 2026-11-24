"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type SelectOption = { value: string; label: string; hint?: string; disabled?: boolean };

type SelectProps = {
  value: string | undefined | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Show a search box. Defaults to true when there are more than 7 options. */
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

/** Custom select (Popover + Command). Replaces the native <select>. */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Chọn…",
  searchPlaceholder = "Tìm kiếm…",
  emptyText = "Không tìm thấy kết quả",
  searchable,
  clearable,
  disabled,
  invalid,
  id,
  className,
  ...rest
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === String(value ?? ""));
  const showSearch = searchable ?? options.length > 7;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-label={rest["aria-label"]}
          disabled={disabled}
          className={cn(
            "border-input bg-secondary/40 hover:bg-secondary/70 data-[state=open]:border-ring flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive ring-destructive/30",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {clearable && selected && !disabled && (
              <span
                role="button"
                aria-label="Bỏ chọn"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="text-muted-foreground hover:text-foreground rounded p-0.5"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronsUpDown className="text-muted-foreground size-4" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-52 p-0"
      >
        <Command>
          {showSearch && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList onWheel={(e) => e.stopPropagation()} className="max-h-64">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.hint ?? ""} ${o.value}`}
                  disabled={o.disabled}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{o.label}</p>
                    {o.hint && <p className="text-muted-foreground truncate text-xs">{o.hint}</p>}
                  </div>
                  <Check
                    className={cn("size-4", o.value === String(value ?? "") ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
