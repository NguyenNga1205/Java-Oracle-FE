"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, RefreshCw, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "./shared";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Provide to make the column sortable */
  sortValue?: (row: T) => string | number;
  className?: string;
  align?: "right";
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  /** Text used by the search box. Omit to hide the search box. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  noun?: string;
};

const norm = (s: string) => s.toLocaleLowerCase("vi").normalize("NFD").replace(/[̀-ͯ]/g, "");

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  loading,
  error,
  onRetry,
  searchText,
  searchPlaceholder = "Tìm kiếm…",
  filters,
  toolbarRight,
  pageSize = 10,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription,
  emptyAction,
  noun = "bản ghi",
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = norm(query.trim());
    let list = q && searchText ? rows.filter((r) => norm(searchText(r)).includes(q)) : rows;
    const col = sort && columns.find((c) => c.key === sort.key);
    if (sort && col?.sortValue) {
      const get = col.sortValue;
      list = [...list].sort((a, b) => {
        const x = get(a), y = get(b);
        return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "vi")) * sort.dir;
      });
    }
    return list;
  }, [rows, query, sort, columns, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  React.useEffect(() => setPage(0), [rows, query]);

  const sortOptions = React.useMemo(
    () => [
      { value: "", label: "Mặc định" },
      ...columns.filter((x) => x.sortValue).flatMap((x) => [
        { value: `${x.key}:1`, label: `${x.header} (A → Z)` },
        { value: `${x.key}:-1`, label: `${x.header} (Z → A)` },
      ]),
    ],
    [columns],
  );

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {searchText && (
          <div className="relative w-full sm:w-80">
            <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="bg-card h-10 rounded-full pl-10 shadow-xs"
            />
          </div>
        )}
        {filters}
        {sortOptions.length > 1 && (
          <div className="w-44">
            <Select
              aria-label="Sắp xếp"
              value={sort ? `${sort.key}:${sort.dir}` : ""}
              onChange={(v) => { if (!v) setSort(null); else { const [k, d] = v.split(":"); setSort({ key: k, dir: d === "-1" ? -1 : 1 }); } }}
              options={sortOptions}
              placeholder="Sắp xếp"
              className="bg-card h-10 rounded-full"
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {toolbarRight}
          {onRetry && (
            <Button variant="outline" size="icon" aria-label="Làm mới" onClick={onRetry} disabled={loading} className="bg-card size-10 rounded-full">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>

    <div className="bg-card overflow-hidden rounded-2xl border">
      {error ? (
        <EmptyState tone="error" title="Không tải được dữ liệu" description={error} action={onRetry && <Button variant="outline" onClick={onRetry}>Thử lại</Button>} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                {columns.map((c) => (
                  <TableHead key={c.key} className={cn("text-muted-foreground h-11 text-xs font-semibold tracking-wide uppercase", c.align === "right" && "text-right", c.className)}>
                    {c.sortValue ? (
                      <button type="button" onClick={() => toggleSort(c.key)} className="hover:text-foreground inline-flex items-center gap-1 uppercase">
                        {c.header}
                        {sort?.key === c.key && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      {columns.map((c) => (
                        <TableCell key={c.key}><Skeleton className="h-5 w-full max-w-40" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : visible.map((row) => (
                    <TableRow key={rowKey(row)}>
                      {columns.map((c) => (
                        <TableCell key={c.key} className={cn("py-3", c.align === "right" && "text-right", c.className)}>
                          {c.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!loading && filtered.length === 0 &&
            (query ? (
              <EmptyState icon={SearchX} title="Không có kết quả phù hợp" description={`Không tìm thấy ${noun} nào khớp với “${query}”.`} action={<Button variant="outline" onClick={() => setQuery("")}>Xóa bộ lọc</Button>} />
            ) : (
              <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
            ))}
        </div>
      )}

      {!error && !loading && filtered.length > 0 && (
        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
          <span>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} / {filtered.length} {noun}
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" aria-label="Trang trước" className="size-8" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-2 tabular-nums">{safePage + 1} / {pages}</span>
              <Button variant="outline" size="icon" aria-label="Trang sau" className="size-8" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
