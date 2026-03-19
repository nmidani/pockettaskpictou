import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth-modal";

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
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation("/dashboard");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || isAuthenticated) return null;

  function openSignUp() { setModalMode("signup"); setShowModal(true); }
  function openSignIn() { setModalMode("signin"); setShowModal(true); }

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {showModal && <AuthModal onClose={() => setShowModal(false)} mode={modalMode} />}

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
          <p className="text-lg md:text-xl text-white/70 max-w-xl mb-8 leading-relaxed">
            PocketTask connects students and locals in Pictou County with nearby small jobs.
          </p>

          {/* Auth buttons in hero */}
          <div className="w-full max-w-xs space-y-3 mb-4">
            <button
              onClick={openSignUp}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white hover:bg-gray-50 transition-all font-bold text-gray-800 text-sm shadow-lg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>
            <button
              onClick={openSignUp}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-black hover:bg-gray-900 transition-all font-bold text-white text-sm shadow-lg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Sign up with Apple
            </button>
            <p className="text-white/50 text-xs text-center">
              Already have an account?{" "}
              <button onClick={openSignIn} className="text-white/80 font-semibold hover:text-white underline">
                Sign in
              </button>
            </p>
          </div>

          <div className="flex gap-3 mt-1">
            <Button onClick={openSignUp} size="sm" variant="ghost" className="text-white/60 hover:text-white text-xs rounded-full">
              Post a Task <ArrowRight className="ml-1 w-3 h-3" />
            </Button>
            <Button onClick={openSignUp} size="sm" variant="ghost" className="text-white/60 hover:text-white text-xs rounded-full">
              Find Work <ArrowRight className="ml-1 w-3 h-3" />
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
            <Button onClick={openSignUp} size="lg" className="rounded-2xl bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 px-8 font-bold">
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
