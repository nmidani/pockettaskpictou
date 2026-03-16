import * as React from "react";
import { Link, useLocation } from "wouter";
import { Home, Compass, Map as MapIcon, MessageCircle, User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, login } = useAuth();

  const navItems = [
    { label: "Home", href: "/", icon: Home, showAlways: true },
    { label: "Browse", href: "/dashboard", icon: Compass, showAlways: true },
    { label: "Map", href: "/map", icon: MapIcon, showAlways: true },
    { label: "Messages", href: "/messages", icon: MessageCircle, requireAuth: true },
    { label: "Profile", href: "/profile", icon: User, requireAuth: true },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64 flex flex-col">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-card border-r border-border/50 shadow-xl shadow-black/5 z-40">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-display font-bold text-xl group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
              P
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-primary">PocketTask</span>
          </Link>
        </div>
        
        <div className="px-4 pb-4">
          <Link href="/post-task" className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all shadow-md",
            "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-lg hover:-translate-y-0.5"
          )}>
            <PlusCircle className="w-5 h-5" />
            Post a Task
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            if (item.requireAuth && !user) return null;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary font-bold" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {!user && (
          <div className="p-4 border-t border-border/50">
            <button
              onClick={login}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              Sign In / Join
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/80 backdrop-blur-xl border-t border-border/50 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            if (item.requireAuth && !user) return null;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn("w-6 h-6 mb-1 transition-transform duration-300", isActive ? "scale-110 stroke-[2.5px]" : "scale-100")} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile FAB */}
      <Link 
        href="/post-task"
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center shadow-lg shadow-secondary/30 hover:scale-105 active:scale-95 transition-all z-50"
      >
        <PlusCircle className="w-6 h-6" />
      </Link>
    </div>
  );
}
