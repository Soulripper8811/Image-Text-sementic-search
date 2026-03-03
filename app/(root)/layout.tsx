"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Settings, Album, ChartArea } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Image Search", href: "/", icon: Album },
  { name: "Chatbots", href: "/chatbots", icon: ChartArea },
  { name: "Settings", href: "/dbhandler", icon: Settings },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className="h-screen overflow-hidden bg-linear-to-br from-slate-50 to-slate-200 flex">
      {/* ================= Desktop Sidebar ================= */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 bg-white/80 backdrop-blur-xl border-r shadow-lg p-6 flex-col">
        <h2 className="text-2xl font-bold tracking-tight mb-8">🚀 Dashboard</h2>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto text-xs text-muted-foreground pt-6">
          © 2026 Your App
        </div>
      </aside>

      {/* ================= Mobile Header ================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center px-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72 p-6">
            <h2 className="text-2xl font-bold mb-8">🚀 Dashboard</h2>

            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-white shadow-md"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <span className="ml-4 font-semibold text-lg">Dashboard</span>
      </div>

      {/* ================= Main Content ================= */}
      <main className="flex-1 md:ml-72 pt-24 md:pt-10 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
