import { useState, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from "react-map-gl/mapbox";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGetTasks } from "@workspace/api-client-react";
import { Task } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, DollarSign, MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
  const { data: tasksData, isLoading } = useGetTasks({ status: 'open' });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Default to Pictou County NS center
  const [viewState, setViewState] = useState({
    longitude: -62.7082,
    latitude: 45.6830,
    zoom: 10
  });

  const validTasks = useMemo(() => {
    return tasksData?.tasks.filter(t => t.lat != null && t.lng != null) || [];
  }, [tasksData]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-border shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Map Unavailable</h2>
          <p className="text-muted-foreground">
            A valid Mapbox token is required to view the interactive map. Please add <code className="bg-secondary px-1 py-0.5 rounded text-sm">VITE_MAPBOX_TOKEN</code> to your environment variables.
          </p>
          <Link href="/dashboard">
            <Button className="w-full mt-4">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-secondary">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="animate-pulse flex flex-col items-center">
            <MapIcon className="w-10 h-10 text-primary mb-4 opacity-50" />
            <p className="font-semibold text-primary">Loading community map...</p>
          </div>
        </div>
      )}
      
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <GeolocateControl position="top-right" />
        <NavigationControl position="top-right" />

        {validTasks.map(task => (
          <Marker
            key={task.id}
            longitude={task.lng!}
            latitude={task.lat!}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedTask(task);
            }}
          >
            <div className="group cursor-pointer transform hover:scale-110 transition-transform origin-bottom">
              <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg border-2 border-white shadow-black/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 transform origin-center border-r-2 border-b-2 border-primary" />
            </div>
          </Marker>
        ))}

        {selectedTask && (
          <Popup
            anchor="top"
            longitude={selectedTask.lng!}
            latitude={selectedTask.lat!}
            onClose={() => setSelectedTask(null)}
            className="rounded-2xl overflow-hidden z-50 p-0"
            closeButton={false}
            maxWidth="300px"
          >
            <div className="p-4 bg-card rounded-2xl shadow-xl border border-border w-full">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{selectedTask.category}</span>
                <span className="flex items-center text-sm font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  <DollarSign className="w-3 h-3" />{selectedTask.pay.toFixed(2)}
                </span>
              </div>
              <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{selectedTask.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{selectedTask.description}</p>
              
              <Link href={`/tasks/${selectedTask.id}`}>
                <Button size="sm" className="w-full shadow-md hover:shadow-lg transition-all">
                  View Task Details
                </Button>
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Floating Info Card */}
      <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-border/50 max-w-xs hidden sm:block">
        <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-primary" />
          Community Map
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore {validTasks.length} open microtasks around Pictou County. Click any pin to see details.
        </p>
      </div>
    </div>
  );
}
