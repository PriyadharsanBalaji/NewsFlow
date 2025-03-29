import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import { OnboardingWelcome } from "./onboarding-welcome";
import { InterestSelection } from "./interest-selection";
import { ApiKeySetup } from "./api-key-setup";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingFlowProps {
  userId: number;
}

export function OnboardingFlow({ userId }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [skipApiKey, setSkipApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Move to next onboarding step
  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  // Move to previous onboarding step
  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Handle interest selection
  const handleInterestSelect = (interests: string[]) => {
    setSelectedInterests(interests);
  };

  // Handle API key change
  const handleApiKeyChange = (key: string) => {
    setGeminiApiKey(key);
  };

  // Handle skipping API key
  const handleSkipApiKey = (skip: boolean) => {
    setSkipApiKey(skip);
  };

  // Complete onboarding process
  const completeOnboarding = async () => {
    setIsSubmitting(true);
    
    try {
      // Save user's interests
      if (selectedInterests.length > 0) {
        await apiRequest("POST", "/api/interests", {
          categories: selectedInterests
        });
      }

      // Save Gemini API key if provided and not skipped
      if (geminiApiKey && !skipApiKey) {
        await apiRequest("POST", "/api/gemini-key", {
          gemini_key: geminiApiKey
        });
      }

      toast({
        title: "Setup complete!",
        description: "Your personalized news experience is ready.",
      });

      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      toast({
        title: "Setup failed",
        description: "We couldn't save your preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Onboarding Header */}
      <header className="px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
          </div>
          <div className="flex items-center">
            <div className="text-sm font-medium text-gray-700">
              Step <span id="current-step">{currentStep}</span> of 3
            </div>
          </div>
        </div>
      </header>

      {/* Step 1: Welcome */}
      {currentStep === 1 && (
        <OnboardingWelcome onNext={nextStep} />
      )}

      {/* Step 2: Interest Selection */}
      {currentStep === 2 && (
        <InterestSelection 
          selectedInterests={selectedInterests}
          onInterestSelect={handleInterestSelect}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}

      {/* Step 3: API Key Setup */}
      {currentStep === 3 && (
        <ApiKeySetup 
          apiKey={geminiApiKey}
          onApiKeyChange={handleApiKeyChange}
          skipApiKey={skipApiKey}
          onSkipApiKey={handleSkipApiKey}
          onPrev={prevStep}
          onComplete={completeOnboarding}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
