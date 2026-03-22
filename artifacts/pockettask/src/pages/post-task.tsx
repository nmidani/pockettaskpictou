import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Loader2, MapPin, Banknote, Smartphone, Clock, ShieldCheck, XCircle, ChevronDown, ChevronUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Category data ────────────────────────────────────────────────────────────

type CategoryDef = {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  examples: string[];
  more: string[];
};

const CATEGORY_DEFS: CategoryDef[] = [
  {
    id: "Home Help",
    emoji: "🏠",
    title: "Home Help",
    tagline: "Indoor fixes & household tasks",
    examples: ["Fix a leaky faucet", "Replace a light bulb", "Assemble flat-pack furniture", "Hang shelves or pictures"],
    more: ["Paint a room", "Repair a door hinge", "Caulk a bathtub", "Install a curtain rod"],
  },
  {
    id: "Outdoor & Yard",
    emoji: "🌿",
    title: "Outdoor & Yard",
    tagline: "Lawn care, snow shoveling, garden work",
    examples: ["Mow the front lawn", "Shovel snow from driveway", "Rake leaves", "Weed flower beds"],
    more: ["Trim hedges", "Spread mulch", "Clean eavestroughs", "Pressure wash the deck"],
  },
  {
    id: "Moving & Heavy Help",
    emoji: "📦",
    title: "Moving & Heavy Help",
    tagline: "Lifting, hauling, and moving assistance",
    examples: ["Help load a moving truck", "Carry furniture upstairs", "Haul junk to the dump", "Move a heavy appliance"],
    more: ["Unpack and arrange boxes", "Disassemble old furniture", "Help move a shed", "Stack firewood"],
  },
  {
    id: "Cleaning & Tidying",
    emoji: "✨",
    title: "Cleaning & Tidying",
    tagline: "House cleaning and organizing",
    examples: ["Deep clean a kitchen", "Organize a cluttered basement", "Clean windows inside & out", "Vacuum and mop floors"],
    more: ["Clean bathrooms", "Declutter a garage", "Laundry folding", "Post-reno cleanup"],
  },
  {
    id: "Errands & Pickups",
    emoji: "🛒",
    title: "Errands & Pickups",
    tagline: "Grocery runs, pickups, and local deliveries",
    examples: ["Pick up groceries", "Return items to a store", "Pickup a prescription", "Drop off a package"],
    more: ["Collect a Facebook Marketplace buy", "Pick up takeout", "Post office run", "Bank deposit"],
  },
  {
    id: "Tech Help",
    emoji: "💻",
    title: "Tech Help",
    tagline: "Computers, phones, and WiFi issues",
    examples: ["Set up a new laptop", "Fix slow WiFi", "Transfer photos off a phone", "Install a printer"],
    more: ["Set up a smart TV", "Recover a forgotten password", "Scan old photos", "Teach basic smartphone use"],
  },
  {
    id: "Pet Help",
    emoji: "🐾",
    title: "Pet Help",
    tagline: "Dog walking, pet sitting, and feeding",
    examples: ["Walk a dog daily", "Pet sit while away", "Feed and check on cats", "Clean a fish tank"],
    more: ["Bathe a dog", "Drive a pet to the vet", "Clean a litter box", "Groom a small dog"],
  },
  {
    id: "Elderly Support",
    emoji: "💛",
    title: "Elderly Support",
    tagline: "Companionship and light assistance",
    examples: ["Drive to a doctor's appointment", "Help with grocery shopping", "Assist with medication reminders", "Friendly companionship visit"],
    more: ["Help write a letter or email", "Light housework assistance", "Read aloud or play cards", "Help with phone or tablet"],
  },
  {
    id: "Event & Occasion Help",
    emoji: "🎉",
    title: "Event Help",
    tagline: "Party setup, decor, and event tasks",
    examples: ["Set up chairs and tables", "Decorate for a birthday", "Help serve food at a party", "Clean up after an event"],
    more: ["Assemble a tent or gazebo", "Help with yard sale setup", "Pick up event supplies", "Run errands day-of"],
  },
  {
    id: "Quick Tasks",
    emoji: "⚡",
    title: "Quick Tasks",
    tagline: "Small one-off jobs under an hour",
    examples: ["Change a car tire", "Jump-start a battery", "Wait for a delivery", "Read a meter"],
    more: ["Hold a ladder", "Help move one heavy item", "Take photos of a property", "Quick errand nearby"],
  },
  {
    id: "Student & Everyday Support",
    emoji: "🎓",
    title: "Student Support",
    tagline: "Tutoring, studying, and everyday help",
    examples: ["Math or science tutoring", "Proofread an essay", "Help with a school project", "Study buddy session"],
    more: ["Resume help", "Practice a language", "Help with a job application", "Teach a skill or hobby"],
  },
  {
    id: "Other",
    emoji: "💬",
    title: "Other",
    tagline: "Anything not listed above",
    examples: ["Unique or custom task", "Something seasonal", "Local service not listed", "Ask — anything goes"],
    more: [],
  },
];

const POPULAR = [
  { label: "Snow shoveling", categoryId: "Outdoor & Yard" },
  { label: "Moving help", categoryId: "Moving & Heavy Help" },
  { label: "Grocery pickup", categoryId: "Errands & Pickups" },
  { label: "Yard cleanup", categoryId: "Outdoor & Yard" },
  { label: "Tech help", categoryId: "Tech Help" },
];

// ─── CategoryPicker sub-component ────────────────────────────────────────────

function CategoryPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const selectedDef = CATEGORY_DEFS.find((c) => c.id === selected);

  // Reset "show more" when category changes
  function pickCategory(id: string) {
    setShowMore(false);
    onSelect(id);
  }

  const displayExamples = showMore
    ? [...(selectedDef?.examples ?? []), ...(selectedDef?.more ?? [])]
    : (selectedDef?.examples ?? []);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-gray-700 mb-0.5">Category</p>
        <p className="text-xs text-gray-500">
          Choose the category that best matches your task. You can explain the details in the next step.
        </p>
      </div>

      {/* Popular in Pictou County */}
      <div className="bg-[#FFF8EE] border border-[#F5A623]/30 rounded-xl px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Flame className="w-3.5 h-3.5 text-[#F5A623]" />
          <span className="text-xs font-bold text-[#B8760A] uppercase tracking-wider">Popular in Pictou County</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => pickCategory(p.categoryId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selected === p.categoryId
                  ? "bg-[#F5A623] text-white border-[#F5A623]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#F5A623]/60 hover:text-[#B8760A]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-2">
        {CATEGORY_DEFS.map((cat) => {
          const isSelected = selected === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => pickCategory(cat.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? "bg-[#1B2A4A] border-[#1B2A4A] text-white shadow-md"
                  : "bg-white border-gray-200 text-gray-700 hover:border-[#1B2A4A]/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg leading-none">{cat.emoji}</span>
                <span className={`text-sm font-bold leading-tight ${isSelected ? "text-white" : "text-[#1B2A4A]"}`}>
                  {cat.title}
                </span>
              </div>
              <p className={`text-[11px] leading-snug ${isSelected ? "text-white/70" : "text-gray-500"}`}>
                {cat.tagline}
              </p>
            </button>
          );
        })}
      </div>

      {/* Example tasks for selected category */}
      {selectedDef && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Example tasks — {selectedDef.title}
          </p>
          <ul className="space-y-1.5">
            {displayExamples.map((ex) => (
              <li key={ex} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F5A623] shrink-0" />
                {ex}
              </li>
            ))}
          </ul>
          {selectedDef.more.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#1B2A4A] hover:underline"
            >
              {showMore ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Show fewer examples</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Show more examples</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Form constants ───────────────────────────────────────────────────────────

const TOWNS = ["New Glasgow", "Stellarton", "Trenton", "Westville", "Pictou", "River John", "Abercrombie", "Scotsburn"];
const DURATIONS = [
  { label: "Under 1 hour", value: 0.5 },
  { label: "1–2 hours", value: 1.5 },
  { label: "2–4 hours", value: 3 },
  { label: "Half day", value: 4 },
  { label: "Full day", value: 8 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    category: CATEGORY_DEFS[0].id,
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

  const isAdmin = user?.role === "admin";

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

    const body = {
      title: form.title,
      description: form.description,
      category: form.category,
      pay: payNum,
      paymentMethod: form.paymentMethod,
      estimatedHours: form.estimatedHours,
      town: form.town,
      locationName: form.locationName || null,
    };

    try {
      if (isAdmin) {
        const res = await fetch("/api/admin-create-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not create task. Please try again.");
          return;
        }
        setLocation(`/tasks/${data.taskId}?from=payment`);
      } else {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not start checkout. Please try again.");
          return;
        }
        setRedirecting(true);
        window.location.href = data.url;
      }
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

        {/* Category picker */}
        <CategoryPicker
          selected={form.category}
          onSelect={(id) => set("category", id)}
        />

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
        {isAdmin ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">Admin — no posting fee. Task goes live instantly.</p>
          </div>
        ) : (
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
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-[#1B2A4A]">
                  <span>Due today</span>
                  <span>${totalDue} CAD</span>
                </div>
              )}
            </div>
            <div className="bg-[#1B2A4A]/5 border-t border-gray-200 px-4 py-2.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1B2A4A]/60 shrink-0" />
              <p className="text-xs text-gray-500">A small fee helps keep PocketTask safe and spam-free.</p>
            </div>
          </div>
        )}

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
          ) : isAdmin ? (
            "Post Task →"
          ) : (
            "Continue to Payment →"
          )}
        </Button>
      </form>
    </div>
  );
}
