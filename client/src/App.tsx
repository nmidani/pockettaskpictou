import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect, Component, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(err: Error) { return { error: err.message }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F7F4] p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">Something went wrong</h1>
            <p className="text-gray-500 text-sm mb-4">{this.state.error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#1B2A4A] text-white rounded-xl text-sm">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Layout } from "./components/layout";
import Landing from "./pages/landing";
import Dashboard from "./pages/dashboard";
import MapView from "./pages/map-view";
import PostTask from "./pages/post-task";
import TaskDetails from "./pages/task-details";
import Profile from "./pages/profile";
import Messages from "./pages/messages";
import Guidelines from "./pages/guidelines";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#1B2A4A]" />
      </div>
    );
  }
  return isAuthenticated ? <Component /> : null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/map" component={MapView} />
        <Route path="/tasks/:id" component={TaskDetails} />
        <Route path="/guidelines" component={Guidelines} />
        <Route path="/post-task">{() => <ProtectedRoute component={PostTask} />}</Route>
        <Route path="/profile">{() => <ProtectedRoute component={Profile} />}</Route>
        <Route path="/messages">{() => <ProtectedRoute component={Messages} />}</Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter>
              <Router />
            </WouterRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
