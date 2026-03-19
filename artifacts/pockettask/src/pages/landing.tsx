import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useEffect } from "react";
import { ArrowRight, CheckCircle2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOWNS = ["New Glasgow", "Stellarton", "Trenton", "Westville", "Pictou", "River John", "Abercrombie", "Scotsburn"];

const PREVIEW_TASKS = [
  { title: "Lawn Mowing", pay: "$25", town: "New Glasgow", category: "Yard Work", icon: "🌿" },
  { title: "Dog Walking", pay: "$15", town: "Stellarton", category: "Dog Walking", icon: "🐕" },
  { title: "Grocery Pickup", pay: "$20", town: "Trenton", category: "Grocery Pickup", icon: "🛒" },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Post a task", desc: "Describe what you need done and set your price." },
  { step: 2, title: "Find a task nearby", desc: "Task Takers see your job on the map and task list." },
  { step: 3, title: "Complete the job", desc: "First to claim it gets the work — fast and simple." },
  { step: 4, title: "Get paid", desc: "Pay by cash or eTransfer when the job is done." },
];

export default function Landing() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation("/dashboard");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1B2A4A] text-white">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-20 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now live in Pictou County, NS
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5 tracking-tight">
            Earn Money Helping<br />
            <span className="text-[#F5A623]">Your Neighbours</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-xl mb-10 leading-relaxed">
            PocketTask connects students and locals in Pictou County with nearby small jobs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button onClick={login} size="lg" className="flex-1 bg-[#F5A623] hover:bg-[#F5A623]/90 text-white rounded-2xl text-base font-bold shadow-lg shadow-[#F5A623]/30 h-13">
              Post a Task <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button onClick={login} size="lg" variant="outline" className="flex-1 rounded-2xl text-base font-bold h-13 border-white/30 text-white hover:bg-white/10 bg-transparent">
              Find Work
            </Button>
          </div>
        </div>
        {/* decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40H1440V20C1200 0 960 40 720 20C480 0 240 40 0 20V40Z" fill="#F9F7F4" />
          </svg>
        </div>
      </section>

      {/* Town badges */}
      <section className="py-8 px-6 bg-[#F9F7F4]">
        <p className="text-center text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4">Serving these communities</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TOWNS.map((town) => (
            <span key={town} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
              <MapPin className="w-3 h-3 text-[#F5A623]" />{town}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#1B2A4A] text-center mb-3">How It Works</h2>
          <p className="text-center text-gray-500 mb-10">Simple, fast, and built on trust.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#1B2A4A] text-white font-extrabold text-xl flex items-center justify-center mb-4 shadow-md">
                  {s.step}
                </div>
                <h3 className="font-bold text-[#1B2A4A] mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample tasks */}
      <section className="py-14 px-6 bg-[#F9F7F4]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#1B2A4A] text-center mb-2">Tasks Near You</h2>
          <p className="text-center text-gray-500 mb-8">Real jobs posted by your neighbours.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PREVIEW_TASKS.map((task) => (
              <div key={task.title} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{task.icon}</div>
                <span className="text-xs font-semibold text-[#F5A623] uppercase tracking-wider">{task.category}</span>
                <h3 className="font-bold text-lg text-[#1B2A4A] mt-1 mb-2">{task.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{task.town}</span>
                  <span className="text-base font-extrabold text-green-600">{task.pay}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button onClick={login} size="lg" className="rounded-2xl bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 px-8 font-bold">
              See All Tasks <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Trust footer */}
      <section className="py-10 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["🧑‍🎓","👩‍🦳","🧒"].map((e, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-sm">{e}</div>
              ))}
            </div>
            <p className="text-sm text-gray-600 font-medium">Trusted by locals across Pictou County</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            <span className="text-gray-600 text-sm ml-1 font-medium">5.0 avg rating</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 bg-[#1B2A4A] text-white/60 text-sm text-center">
        <p>© 2025 PocketTask · Pictou County, Nova Scotia · <Link href="/guidelines" className="underline hover:text-white">Community Guidelines</Link></p>
      </footer>
    </div>
  );
}
