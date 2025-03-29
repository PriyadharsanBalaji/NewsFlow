import { useEffect } from "react";
import { useLocation } from "wouter";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { useAuth } from "@/hooks/use-auth";

export default function Onboarding() {
  const [_, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return <OnboardingFlow userId={user.id} />;
}
