import { Button } from "@/components/ui/button";
import { DEFAULT_NEWS_IMAGE } from "@/lib/constants";

interface OnboardingWelcomeProps {
  onNext: () => void;
}

export function OnboardingWelcome({ onNext }: OnboardingWelcomeProps) {
  return (
    <div className="flex-grow flex items-center justify-center p-4 slide-in">
      <div className="max-w-xl w-full text-center space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">Welcome to NewsFlow!</h2>
        <p className="text-lg text-gray-600">
          Let's set up your personalized news experience in just a few steps.
        </p>
        <div className="w-full max-w-md mx-auto">
          <img
            src={DEFAULT_NEWS_IMAGE}
            alt="News Concept"
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
        </div>
        <Button
          size="lg"
          onClick={onNext}
          className="px-8"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
