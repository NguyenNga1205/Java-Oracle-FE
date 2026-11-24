"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, GraduationCap, LogOut, Menu, UserRound } from "lucide-react";
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
import { allowedPaths, navFor, titleFor } from "./nav";
import { homeFor, useAuth } from "./auth";
import { UserAvatar } from "./shared";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2">
      <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-xl">
        <GraduationCap className="size-5" />
      </span>
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
    const allowed = allowedPaths(user.role);
    if (!allowed.includes(top)) router.replace(homeFor(user.role));
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

  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors outline-none focus-visible:ring-2">
          <UserAvatar name={user.username} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold">{user.username}</span>
            <span className="text-muted-foreground block text-xs">{roleLabels[user.role]}</span>
          </span>
          <ChevronsUpDown className="text-muted-foreground size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
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
  );

  return (
    <div className="min-h-screen">
      <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
        <div className="p-4 pb-3"><Brand /></div>
        <ScrollArea className="flex-1 px-3 py-2"><NavList /></ScrollArea>
        <div className="border-sidebar-border border-t p-3">{profileMenu}</div>
      </aside>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="bg-sidebar flex w-72 flex-col gap-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Điều hướng chính</SheetDescription>
          <div className="p-4 pb-3"><Brand /></div>
          <ScrollArea className="flex-1 px-3 py-2"><NavList onNavigate={() => setMenu(false)} /></ScrollArea>
          <div className="border-sidebar-border border-t p-3">{profileMenu}</div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" aria-label="Mở menu" onClick={() => setMenu(true)}>
            <Menu className="size-5" />
          </Button>
          <span className="font-semibold">{titleFor(pathname)}</span>
        </header>
        <main className="bg-glow mx-auto min-h-screen max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8 lg:min-h-screen">{children}</main>
      </div>
    </div>
  );
}
