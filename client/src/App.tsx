import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useAuth } from "./hooks/use-auth";
import { AppLayout } from "./components/layout/AppLayout";

// Pages
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import PostTask from "./pages/PostTask";
import TaskDetails from "./pages/TaskDetails";
import MessagesList from "./pages/MessagesList";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  return <Component />;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/map" component={MapView} />
        <Route path="/tasks/:id" component={TaskDetails} />
        
        {/* Protected Routes */}
        <Route path="/post-task">
          <ProtectedRoute component={PostTask} />
        </Route>
        <Route path="/messages">
          <ProtectedRoute component={MessagesList} />
        </Route>
        <Route path="/chat/:id">
          <ProtectedRoute component={Chat} />
        </Route>
        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>

        <Route>
          <div className="p-12 text-center">
            <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        </Route>
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}

export default App;
