import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MapPin, DollarSign } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { isAuthenticated, login } = useAuth();

  const features = [
    {
      title: "Find Tasks Nearby",
      description: "Browse the local map to find microtasks happening right in your neighborhood.",
      icon: MapPin,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
      title: "Earn Extra Cash",
      description: "Help out your community with yard work, errands, or tech help and get paid.",
      icon: DollarSign,
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
    },
    {
      title: "Trusted Neighbors",
      description: "Build a strong community network where neighbors support each other safely.",
      icon: CheckCircle2,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden py-12 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left space-y-8"
          >
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Now live in Pictou County, NS
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Neighbors helping neighbors, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">getting things done.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              PocketTask is the hyper-local microtask platform where you can post small jobs or accept them to earn extra money and build community.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              {isAuthenticated ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-full text-lg px-8 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                    Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button size="lg" onClick={login} className="w-full sm:w-auto rounded-full text-lg px-8 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                    Get Started <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Link href="/map" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full text-lg px-8 border-2">
                      Browse Map
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[3rem] blur-3xl -z-10 transform rotate-6" />
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-community.png`}
              alt="Community helping each other"
              className="w-full max-w-lg object-contain drop-shadow-2xl rounded-3xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card py-20 px-4 sm:px-6 lg:px-8 border-y border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">How PocketTask Works</h2>
            <p className="text-lg text-muted-foreground">It's incredibly simple to get help or offer your skills in the community.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex flex-col items-center text-center p-6 rounded-3xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold">Popular Community Tasks</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["Yard Work", "Snow Removal", "Moving Help", "Grocery Runs", "Pet Care", "Tech Setup", "Cleaning", "Tutoring"].map(cat => (
              <span key={cat} className="px-5 py-2.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm font-medium hover:bg-primary-foreground/20 transition-colors cursor-pointer">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
