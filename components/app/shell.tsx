"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronRight, LogOut, Menu, Moon, Sun, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { allowedPaths, breadcrumbFor, navFor } from "./nav";
import { homeFor, useAuth } from "./auth";
import { UserAvatar } from "./shared";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" className="size-9 rounded-xl" />
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-tight">UniVerse</span>
        <span className="text-muted-foreground block text-[11px]">Quản lý sinh viên</span>
      </span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;
  return (
    <nav aria-label="Điều hướng chính" className="space-y-5">
      {navFor(user.role).map((group) => (
        <div key={group.label}>
          <p className="text-muted-foreground mb-1.5 px-3 text-[11px] font-semibold tracking-wider uppercase">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className={cn("size-[18px]", active && "text-primary")} />
                    <span className="truncate">{label}</span>
                    {active && <span className="bg-primary ml-auto size-1.5 rounded-full" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = mounted ? resolvedTheme !== "light" : true;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={dark ? "Giao diện sáng" : "Giao diện tối"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground size-9 rounded-full"
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </Button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, booting, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = React.useState(false);

  React.useEffect(() => {
    if (booting) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const top = "/" + pathname.split("/")[1];
    if (!allowedPaths(user.role).includes(top)) router.replace(homeFor(user.role));
  }, [booting, user, pathname, router]);

  if (booting || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-muted-foreground flex items-center gap-3 text-sm">
          <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
          Đang tải…
        </div>
      </div>
    );
  }

  const crumb = breadcrumbFor(pathname, user.role);

  return (
    <div className="min-h-screen">
      <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
        <div className="p-4 pb-3"><Brand /></div>
        <ScrollArea className="flex-1 px-3 py-2"><NavList /></ScrollArea>
      </aside>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="bg-sidebar flex w-72 flex-col gap-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Điều hướng chính</SheetDescription>
          <div className="p-4 pb-3"><Brand /></div>
          <ScrollArea className="flex-1 px-3 py-2"><NavList onNavigate={() => setMenu(false)} /></ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="bg-glow flex min-h-screen flex-col lg:pl-64">
        <header className="bg-background/80 sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-8">
          <Button variant="ghost" size="icon" aria-label="Mở menu" onClick={() => setMenu(true)} className="lg:hidden">
            <Menu className="size-5" />
          </Button>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs font-medium tracking-wide uppercase">
            {crumb.group && (
              <>
                <span className="text-muted-foreground hidden truncate sm:inline">{crumb.group}</span>
                <ChevronRight className="text-muted-foreground hidden size-3.5 shrink-0 sm:block" />
              </>
            )}
            <span aria-current="page" className="truncate">{crumb.item}</span>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Tài khoản" className="hover:bg-accent flex items-center gap-2.5 rounded-full p-1 pr-3 transition-colors outline-none focus-visible:ring-2">
                  <UserAvatar name={user.username} className="size-8 rounded-full" />
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-sm font-semibold">{user.username}</span>
                    <span className="text-muted-foreground block text-[11px]">{roleLabels[user.role]}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold">{user.username}</p>
                  <p className="text-muted-foreground text-xs">{roleLabels[user.role]}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push("/profile")}>
                  <UserRound /> Hồ sơ của tôi
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    logout();
                    router.replace("/login");
                  }}
                >
                  <LogOut /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="w-full flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
