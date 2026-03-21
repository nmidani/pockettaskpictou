import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Loader2, MapPin, Banknote, Smartphone, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["Yard Work", "Cleaning", "Moving Help", "Dog Walking", "Grocery Pickup", "Tech Help", "Small Repairs", "Other"];
const TOWNS = ["New Glasgow", "Stellarton", "Trenton", "Westville", "Pictou", "River John", "Abercrombie", "Scotsburn"];
const DURATIONS = [
  { label: "Under 1 hour", value: 0.5 },
  { label: "1–2 hours", value: 1.5 },
  { label: "2–4 hours", value: 3 },
  { label: "Half day", value: 4 },
  { label: "Full day", value: 8 },
];

export default function PostTask() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const wasCancelled = params.get("payment") === "cancelled";

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    pay: "",
    paymentMethod: "cash" as "cash" | "etransfer",
    estimatedHours: DURATIONS[0].value,
    town: TOWNS[0],
    locationName: "",
  });

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const payNum = Number(form.pay);
  const payValid = form.pay !== "" && !Number.isNaN(payNum) && payNum >= 1;
  const totalDue = payValid ? (payNum + 2).toFixed(2) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.pay) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!payValid) {
      setError("Payment must be at least $1.");
      return;
    }
    setLoading(true);
    setRedirecting(false);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          pay: payNum,
          paymentMethod: form.paymentMethod,
          estimatedHours: form.estimatedHours,
          town: form.town,
          locationName: form.locationName || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout. Please try again.");
        return;
      }
      setRedirecting(true);
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Post a Task</h1>
        <p className="text-gray-500 text-sm mt-1">Describe the job and set your price. Locals will see it immediately.</p>
      </div>

      {/* Cancelled notice */}
      {wasCancelled && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <XCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">Payment was cancelled — your task was not posted. Fill in the form again whenever you're ready.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Task Title <span className="text-red-500">*</span></label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Mow my front lawn"
            maxLength={100}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe what needs to be done, any special requirements…"
            rows={4}
            maxLength={490}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button type="button" key={cat} onClick={() => set("category", cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.category === cat ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Pay + method */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Pay Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input
                type="number"
                min={1}
                step={1}
                value={form.pay}
                onChange={(e) => set("pay", e.target.value)}
                placeholder="25"
                className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Payment Method</label>
            <div className="flex gap-2 h-[42px]">
              <button type="button" onClick={() => set("paymentMethod", "cash")}
                className={`flex-1 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${form.paymentMethod === "cash" ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "bg-white text-gray-600 border-gray-200"}`}>
                <Banknote className="w-3.5 h-3.5" />Cash
              </button>
              <button type="button" onClick={() => set("paymentMethod", "etransfer")}
                className={`flex-1 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${form.paymentMethod === "etransfer" ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "bg-white text-gray-600 border-gray-200"}`}>
                <Smartphone className="w-3.5 h-3.5" />eTransfer
              </button>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5"><Clock className="inline w-3.5 h-3.5 mr-1" />Estimated Duration</label>
          <select value={form.estimatedHours} onChange={(e) => set("estimatedHours", Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20">
            {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        {/* Town */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5"><MapPin className="inline w-3.5 h-3.5 mr-1" />Town</label>
          <select value={form.town} onChange={(e) => set("town", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20">
            {TOWNS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Location note */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Street / Location Note <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            value={form.locationName}
            onChange={(e) => set("locationName", e.target.value)}
            placeholder="e.g. 123 Main St or near the park"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
          />
        </div>

        {/* Fee breakdown */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Task pay for worker</span>
              <span className="font-semibold text-gray-800">
                {payValid ? `$${payNum.toFixed(2)} CAD` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>PocketTask posting fee</span>
              <span className="font-semibold text-gray-800">$2.00 CAD</span>
            </div>
            {totalDue && (
              <>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-[#1B2A4A]">
                  <span>Due today</span>
                  <span>${totalDue} CAD</span>
                </div>
              </>
            )}
          </div>
          <div className="bg-[#1B2A4A]/5 border-t border-gray-200 px-4 py-2.5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1B2A4A]/60 shrink-0" />
            <p className="text-xs text-gray-500">A small fee helps keep PocketTask safe and spam-free.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <Button
          type="submit"
          disabled={loading || redirecting}
          className="w-full h-12 rounded-2xl bg-[#F5A623] hover:bg-[#F5A623]/90 text-white font-bold text-base shadow-lg shadow-[#F5A623]/20"
        >
          {redirecting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirecting to Stripe…
            </span>
          ) : loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Continue to Payment →"
          )}
        </Button>
      </form>
    </div>
  );
}
