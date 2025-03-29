import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface WelcomeBannerProps {
  firstName?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function WelcomeBanner({
  firstName = "there",
  onRefresh,
  isRefreshing,
}: WelcomeBannerProps) {
  const currentTime = new Date();
  const hours = currentTime.getHours();
  
  // Determine greeting based on time of day
  let greeting = "Good morning";
  if (hours >= 12 && hours < 17) {
    greeting = "Good afternoon";
  } else if (hours >= 17) {
    greeting = "Good evening";
  }
  
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-md overflow-hidden mb-6">
      <div className="md:flex">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-100 font-semibold">
            Personalized for you
          </div>
          <h2 className="mt-2 text-white text-2xl font-bold">
            {greeting}, {firstName}
          </h2>
          <p className="mt-2 text-indigo-100">
            Your daily news digest is ready, filtered and prioritized by AI.
          </p>
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="mt-4 bg-white text-indigo-700 hover:bg-indigo-50 transition-colors duration-200"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span>Refresh Feed</span>
              </>
            )}
          </Button>
        </div>
        <div className="md:shrink-0 hidden md:block" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="absolute inset-0 bg-gradient-to-l from-indigo-700/40 to-transparent" />
          <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/10" width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
