import { ReactNode, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  defaultTab?: string;
  showSocialLogin?: boolean;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  defaultTab = "login",
  showSocialLogin = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-4 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">{APP_NAME}</h1>
            <p className="text-gray-600 mt-2">{subtitle}</p>
          </div>

          {children}

          {showSocialLogin && (
            <>
              <div className="relative flex items-center justify-center mt-6">
                <Separator className="flex-grow" />
                <span className="px-2 text-sm text-gray-500">Or continue with</span>
                <Separator className="flex-grow" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  type="button"
                >
                  <FaGoogle className="text-red-500 mr-2" />
                  <span className="text-sm">Google</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  type="button"
                >
                  <FaGithub className="text-gray-800 mr-2" />
                  <span className="text-sm">GitHub</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
