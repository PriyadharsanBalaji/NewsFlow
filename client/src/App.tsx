import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import SavedArticles from "@/pages/saved-articles";
import Discover from "@/pages/discover";
import Profile from "@/pages/profile";
import AdminPanel from "@/pages/admin-panel";
import { ProtectedRoute, ProtectedAdminRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/onboarding" component={Onboarding} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/saved-articles" component={SavedArticles} />
      <ProtectedRoute path="/discover" component={Discover} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedAdminRoute path="/admin" component={AdminPanel} />
      
      {/* Default route */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
