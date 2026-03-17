import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Zap, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user, login } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary pt-16 pb-32 lg:pt-32 lg:pb-48 text-primary-foreground">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-community.png`} 
            alt="Pictou County Community" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 to-primary/95" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-slide-up">
          <Badge className="mb-6 bg-white/20 text-white border-none backdrop-blur-md px-4 py-1.5 text-sm">
            📍 Hyper-local to Pictou County, NS
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-6 drop-shadow-lg">
            Neighbors helping <br className="hidden md:block"/>
            <span className="text-secondary">neighbors.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-primary-foreground/90 mb-10 font-medium leading-relaxed">
            Need a hand? Post a small task. Looking for extra cash? Help someone nearby. 
            PocketTask connects Pictou County locals instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Button size="lg" variant="secondary" onClick={login} className="w-full sm:w-auto text-lg px-8 py-6">
                  Join the Community
                </Button>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10 hover:border-white">
                    Browse Tasks First
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Decorative divider */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-background rounded-t-[3rem] z-10" />
      </div>

      {/* Features */}
      <div className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">How PocketTask Works</h2>
            <p className="text-lg text-muted-foreground">Built exclusively for our local community to keep things safe, fast, and friendly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Zap, title: "Post Instantly", desc: "Need yard work done or a quick delivery? Post it in 60 seconds." },
              { icon: MapPin, title: "Local Only", desc: "Restricted to Pictou County. You're always helping someone nearby." },
              { icon: ShieldCheck, title: "Safe & Rated", desc: "Built-in chat, community ratings, and profile verifications." }
            ].map((feature, i) => (
              <div key={i} className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${className}`}>{children}</div>;
}
