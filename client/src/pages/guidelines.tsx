import { Link } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";

const RULES = [
  { emoji: "🤝", title: "Be respectful", desc: "Treat every neighbour with kindness and professionalism. Harassment or disrespectful behaviour will result in removal from the platform." },
  { emoji: "✅", title: "Only post safe and legal tasks", desc: "Tasks must be lawful and safe. Do not post anything that could put you or others at risk." },
  { emoji: "⏰", title: "Honor your commitments", desc: "If you accept a task, show up. Cancellations hurt the community. If you must cancel, notify the other party as early as possible." },
  { emoji: "💰", title: "Pay the agreed amount", desc: "Task Givers must pay the agreed amount promptly upon completion. Do not negotiate the price after work has begun." },
  { emoji: "🚫", title: "No illegal or dangerous activities", desc: "PocketTask is a community platform. Any activity that is illegal, dangerous, or harmful will result in immediate suspension." },
];

export default function Guidelines() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B2A4A] font-medium mb-6">
        <ArrowLeft className="w-4 h-4" />Back
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-[#1B2A4A] flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Community Guidelines</h1>
          <p className="text-sm text-gray-500">PocketTask is built on trust.</p>
        </div>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed my-5">
        PocketTask connects real neighbours in Pictou County. These rules exist to keep our community safe, fair, and trustworthy for everyone.
      </p>

      <div className="space-y-3 mb-8">
        {RULES.map((rule, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex gap-4">
            <div className="text-2xl shrink-0 mt-0.5">{rule.emoji}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold text-[#1B2A4A]/40 uppercase tracking-widest">Rule {i + 1}</span>
              </div>
              <h3 className="font-bold text-[#1B2A4A] mb-1">{rule.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{rule.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1B2A4A] rounded-2xl p-5 text-white text-center">
        <h3 className="font-bold text-lg mb-2">Report a Violation</h3>
        <p className="text-white/70 text-sm mb-4">
          If you experience or witness a guideline violation, use the Report button on any task or profile page.
        </p>
        <Link href="/dashboard">
          <span className="inline-block bg-[#F5A623] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#F5A623]/90 transition-colors">
            Back to Community
          </span>
        </Link>
      </div>
    </div>
  );
}
