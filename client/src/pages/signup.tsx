import { useEffect } from "react";
import { useLocation } from "wouter";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { APP_NAME } from "@/lib/constants";

export default function Signup() {
  const [_, setLocation] = useLocation();
  const { user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  // Handle navigation to login page
  const navigateToLogin = () => {
    setLocation("/login");
  };

  return (
    <AuthLayout 
      title="Create Account"
      subtitle={`Join ${APP_NAME} for personalized news`}
      showSocialLogin={false}
    >
      <SignupForm />
      
      <div className="text-center text-gray-600 text-sm mt-4">
        Already have an account?{" "}
        <Button variant="link" className="p-0" onClick={navigateToLogin}>
          Sign in
        </Button>
      </div>
    </AuthLayout>
  );
}
