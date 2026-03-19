import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Home, Map as MapIcon, PlusCircle, User, LogOut, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthModal } from "@/components/auth-modal";

const PICTOU_BOUNDS = { latMin: 45.4, latMax: 45.9, lngMin: -63.2, lngMax: -62.2 };
function isInPictouCounty(lat: number, lng: number) {
  return lat >= PICTOU_BOUNDS.latMin && lat <= PICTOU_BOUNDS.latMax &&
    lng >= PICTOU_BOUNDS.lngMin && lng <= PICTOU_BOUNDS.lngMax;
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  const [geoRestricted, setGeoRestricted] = useState(false);
  const [geoDismissed, setGeoDismissed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (geoDismissed) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      if (!isInPictouCounty(pos.coords.latitude, pos.coords.longitude)) {
        setGeoRestricted(true);
      }
    }, () => {}, { timeout: 6000 });
  }, [geoDismissed]);

  const navItems = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Map", href: "/map", icon: MapIcon },
    { label: "Post", href: "/post-task", icon: PlusCircle },
    { label: "Messages", href: "/messages", icon: MessageCircle },
    { label: "Profile", href: "/profile", icon: User },
  ];

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : user?.username?.substring(0, 2).toUpperCase() ?? "PT";

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 md:pt-16">

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} mode="signin" />}

      {/* Geo restriction overlay */}
      {geoRestricted && !geoDismissed && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Outside Service Area</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              PocketTask currently operates only in <strong>Pictou County, Nova Scotia</strong>. Expansion coming soon!
            </p>
            <Button onClick={() => setGeoDismissed(true)} className="w-full rounded-2xl bg-[#1B2A4A]">
              Got it, continue browsing
            </Button>
          </div>
        </div>
      )}

      {/* Desktop top nav */}
      <header className="hidden md:flex fixed top-0 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-8">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1B2A4A] rounded-lg flex items-center justify-center text-white font-bold text-sm">PT</div>
            <span className="font-bold text-xl text-[#1B2A4A] tracking-tight">PocketTask</span>
          </Link>
          {isAuthenticated && (
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm ${isActive ? "bg-[#1B2A4A]/10 text-[#1B2A4A]" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}>
                    <Icon className="w-4 h-4" />{item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            : isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-red-600 text-sm">
                  <LogOut className="w-4 h-4 mr-1.5" />Log out
                </Button>
                <Link href="/profile">
                  <Avatar className="w-9 h-9 border-2 border-[#1B2A4A]/20 cursor-pointer hover:opacity-80">
                    <AvatarImage src={user?.profileImage ?? undefined} />
                    <AvatarFallback className="bg-[#1B2A4A]/10 text-[#1B2A4A] text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} className="rounded-full bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 px-5">
                Log in / Sign up
              </Button>
            )}
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-background border-b border-border sticky top-0 z-40">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1B2A4A] rounded-lg flex items-center justify-center text-white font-bold text-xs">PT</div>
          <span className="font-bold text-lg text-[#1B2A4A]">PocketTask</span>
        </Link>
        {!isLoading && (
          isAuthenticated ? (
            <Link href="/profile">
              <Avatar className="w-8 h-8 border-2 border-[#1B2A4A]/20">
                <AvatarImage src={user?.profileImage ?? undefined} />
                <AvatarFallback className="bg-[#1B2A4A]/10 text-[#1B2A4A] text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button onClick={() => setShowAuthModal(true)} size="sm" className="rounded-full bg-[#1B2A4A] text-xs px-3 h-8">Log in</Button>
          )
        )}
      </header>

      <main className="w-full">{children}</main>

      {/* Mobile bottom nav */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 w-full h-16 bg-background/95 backdrop-blur-lg border-t border-border z-50 flex items-center justify-around px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            const isPost = item.href === "/post-task";
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative">
                {isPost ? (
                  <div className="w-11 h-11 rounded-2xl bg-[#F5A623] flex items-center justify-center shadow-lg shadow-[#F5A623]/30 -mt-2">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <>
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-[#1B2A4A]/10" : ""}`}>
                      <Icon className={`w-5 h-5 ${isActive ? "text-[#1B2A4A]" : "text-gray-400"}`} />
                    </div>
                    <span className={`text-[9px] font-semibold ${isActive ? "text-[#1B2A4A]" : "text-gray-400"}`}>{item.label}</span>
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
