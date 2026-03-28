import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGetTasks } from "@/lib/hooks";
import { Task } from "@/lib/hooks";
import { Link } from "wouter";
import { MapPin, Loader2, Navigation, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix Leaflet default marker icons broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Pictou County bounds
const PICTOU_CENTER: [number, number] = [45.683, -62.7082];
const PICTOU_BOUNDS = L.latLngBounds(
  L.latLng(45.4, -63.2),
  L.latLng(45.9, -62.2)
);

// Custom amber marker icon
function makeTaskIcon(pay: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        background:#F5A623;
        color:#fff;
        border:2.5px solid #fff;
        border-radius:50% 50% 50% 0;
        width:36px;height:36px;
        display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:11px;font-family:sans-serif;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        transform:rotate(-45deg);
      ">
        <span style="transform:rotate(45deg)">$${pay % 1 === 0 ? pay : pay.toFixed(0)}</span>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

// User location marker
const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;
    background:#1B2A4A;border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 0 0 4px rgba(27,42,74,0.25);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Component that flies to user location
function LocateMe({ userPos }: { userPos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (userPos) map.flyTo(userPos, 13, { duration: 1.2 });
  }, [userPos, map]);
  return null;
}

type FilterType = "all" | "open" | "claimed";

export default function MapView() {
  const { data: tasksData, isLoading } = useGetTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    const tasks = tasksData?.tasks.filter(t => t.lat != null && t.lng != null) ?? [];
    if (filter === "open") return tasks.filter(t => t.status === "open");
    if (filter === "claimed") return tasks.filter(t => t.status === "claimed");
    return tasks;
  }, [tasksData, filter]);

  function handleLocate() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setGeoError("Could not get your location.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  const filters: { label: string; value: FilterType }[] = [
    { label: "All Tasks", value: "all" },
    { label: "Open Only", value: "open" },
    { label: "Claimed", value: "claimed" },
  ];

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Filter + Locate bar */}
      <div className="absolute top-3 left-0 right-0 z-[1000] flex items-center justify-between gap-2 px-3 pointer-events-none">
        {/* Filter pills */}
        <div className="flex gap-1.5 bg-white/90 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-gray-200 pointer-events-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                filter === f.value
                  ? "bg-[#1B2A4A] text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Locate me button */}
        <button
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 text-xs font-semibold text-[#1B2A4A] shadow-lg border border-gray-200 hover:bg-white transition-all pointer-events-auto"
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          {locating ? "Locating…" : "My Location"}
        </button>
      </div>

      {/* Task count badge */}
      <div className="absolute bottom-20 left-3 z-[1000] bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 shadow border border-gray-200 text-xs text-gray-700 font-medium pointer-events-none">
        <MapPin className="inline w-3 h-3 mr-1 text-[#F5A623]" />
        {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} shown
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B2A4A]" />
            <p className="text-sm font-medium text-gray-600">Loading tasks…</p>
          </div>
        </div>
      )}

      {/* Geo error toast */}
      {geoError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1001] bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-full shadow-lg">
          {geoError}
        </div>
      )}

      <MapContainer
        center={PICTOU_CENTER}
        zoom={11}
        minZoom={9}
        maxBounds={L.latLngBounds(L.latLng(44.8, -64.0), L.latLng(46.5, -61.0))}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Fly to user position */}
        <LocateMe userPos={userPos} />

        {/* User location dot */}
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <div className="text-xs font-semibold text-gray-700">You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Task markers */}
        {filteredTasks.map((task) => (
          <Marker
            key={task.id}
            position={[task.lat!, task.lng!]}
            icon={makeTaskIcon(task.pay)}
            eventHandlers={{ click: () => setSelectedTask(task) }}
          >
            <Popup maxWidth={260} className="leaflet-popup-pockettask">
              <div style={{ fontFamily: "inherit", minWidth: 220 }}>
                <div className="flex items-center justify-between mb-1">
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#F5A623",
                    }}
                  >
                    {task.category}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#16a34a",
                      background: "#dcfce7",
                      padding: "1px 8px",
                      borderRadius: 99,
                    }}
                  >
                    ${task.pay.toFixed(2)}
                  </span>
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, margin: "4px 0 6px", lineHeight: 1.3 }}>
                  {task.title}
                </p>
                {task.town && (
                  <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
                    📍 {task.town}
                  </p>
                )}
                <div
                  style={{
                    display: "inline-block",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    marginBottom: 10,
                    background: task.status === "open" ? "#dcfce7" : "#fee2e2",
                    color: task.status === "open" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {task.status === "open" ? "Open" : task.status === "claimed" ? "Already taken" : task.status}
                </div>
                <a
                  href={`${import.meta.env.BASE_URL}tasks/${task.id}`.replace("//", "/")}
                  style={{
                    display: "block",
                    background: "#1B2A4A",
                    color: "#fff",
                    textAlign: "center",
                    padding: "8px",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  View &amp; Apply →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
