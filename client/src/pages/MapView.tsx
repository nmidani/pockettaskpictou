import { useState, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTasks } from "@/hooks/use-tasks";
import { Link } from "wouter";
import { MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Center of Pictou County
const DEFAULT_VIEW_STATE = {
  longitude: -62.7082,
  latitude: 45.6830,
  zoom: 10
};

export default function MapView() {
  const { data: tasks } = useTasks({ status: "open" });
  const [popupInfo, setPopupInfo] = useState<any>(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Generate slight random offsets for tasks without exact lat/lng but with towns
  const mapTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.map(task => {
      if (task.lat && task.lng) return task;
      // Fake coordinates near Pictou County if none provided (for demo/visuals)
      const offsetLat = (Math.random() - 0.5) * 0.1;
      const offsetLng = (Math.random() - 0.5) * 0.1;
      return { ...task, lat: 45.6830 + offsetLat, lng: -62.7082 + offsetLng };
    });
  }, [tasks]);

  if (!mapboxToken) {
    return (
      <div className="p-8 text-center mt-20">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Map Unavailable</h2>
        <p className="text-muted-foreground">Mapbox token is missing in environment variables.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen w-full relative animate-fade-in">
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-border/50 max-w-xs pointer-events-none">
        <h1 className="font-display font-bold text-2xl text-foreground">Live Map</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Showing {tasks?.length || 0} open tasks in Pictou County
        </p>
      </div>

      <Map
        initialViewState={DEFAULT_VIEW_STATE}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={mapboxToken}
      >
        <NavigationControl position="top-right" />
        
        {mapTasks.map((task) => (
          <Marker
            key={task.id}
            longitude={task.lng!}
            latitude={task.lat!}
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo(task);
            }}
          >
            <div className="cursor-pointer group relative">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-white group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45 border-r-2 border-b-2 border-white" />
            </div>
          </Marker>
        ))}

        {popupInfo && (
          <Popup
            anchor="bottom"
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            offset={24}
          >
            <div className="w-64">
              <div className="bg-primary px-4 py-3 text-primary-foreground">
                <h3 className="font-display font-bold truncate">{popupInfo.title}</h3>
                <span className="font-bold text-lg">{formatCurrency(popupInfo.pay)}</span>
              </div>
              <div className="p-4 bg-card">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{popupInfo.description}</p>
                <Link href={`/tasks/${popupInfo.id}`}>
                  <button className="w-full bg-secondary text-secondary-foreground font-bold py-2 rounded-xl text-sm hover:bg-secondary/90 transition-colors">
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
