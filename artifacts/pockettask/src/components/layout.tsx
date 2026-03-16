import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Home, Map as MapIcon, PlusCircle, User, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home, show: isAuthenticated },
    { label: "Map", href: "/map", icon: MapIcon, show: true },
    { label: "Post Task", href: "/post-task", icon: PlusCircle, show: isAuthenticated },
    { label: "Profile", href: "/profile", icon: User, show: isAuthenticated },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 pt-0 md:pt-16">
      {/* Desktop Navigation */}
      <header className="hidden md:flex fixed top-0 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src={`${import.meta.env.BASE_URL}images/logo.png`} 
              alt="PocketTask Logo" 
              className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="font-display font-bold text-xl text-primary tracking-tight">PocketTask</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.filter(i => i.show).map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={`
                  flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200
                  ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}
                `}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="w-9 h-9 border-2 border-primary/20">
                  <AvatarImage src={user?.profileImage || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">{user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          ) : (
            <Button onClick={login} className="rounded-full shadow-lg shadow-primary/20 px-6">
              Log in / Sign up
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-background border-b border-border sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="PocketTask Logo" className="w-7 h-7" />
          <span className="font-display font-bold text-lg text-primary tracking-tight">PocketTask</span>
        </Link>
        {!isLoading && !isAuthenticated && (
          <Button onClick={login} size="sm" className="rounded-full">Log in</Button>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-background/90 backdrop-blur-lg border-t border-border z-50 flex items-center justify-around px-2 pb-safe">
        {navItems.filter(i => i.show).map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`
              flex flex-col items-center justify-center w-full h-full gap-1
              ${isActive ? 'text-primary' : 'text-muted-foreground'}
            `}>
              <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
