import { useEffect } from "react";
import { useLocation } from "wouter";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { APP_NAME } from "@/lib/constants";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  // Handle navigation to signup page
  const navigateToSignup = () => {
    setLocation("/signup");
  };

  return (
    <AuthLayout 
      title={APP_NAME}
      subtitle="Your personalized news experience"
      showSocialLogin={true}
    >
      <LoginForm />
      
      <div className="text-center text-gray-600 text-sm mt-4">
        Don't have an account?{" "}
        <Button variant="link" className="p-0" onClick={navigateToSignup}>
          Create account
        </Button>
      </div>
    </AuthLayout>
  );
}
