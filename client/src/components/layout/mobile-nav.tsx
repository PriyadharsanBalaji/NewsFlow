import { useLocation } from "wouter";
import { Home, Bookmark, Compass, User } from "lucide-react";

export function MobileNav() {
  const [location, navigate] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="md:hidden fixed bottom-0 w-full border-t border-gray-200 bg-white">
      <div className="grid grid-cols-4 h-16">
        <button
          className={`flex flex-col items-center justify-center ${
            isActive("/dashboard") ? "text-primary" : "text-gray-500"
          }`}
          onClick={() => navigate("/dashboard")}
        >
          <Home className={`${isActive("/dashboard") ? "text-primary" : "text-gray-500"} h-5 w-5`} />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center ${
            isActive("/saved-articles") ? "text-primary" : "text-gray-500"
          }`}
          onClick={() => navigate("/saved-articles")}
        >
          <Bookmark className={`${isActive("/saved-articles") ? "text-primary" : "text-gray-500"} h-5 w-5`} />
          <span className="text-xs mt-1">Saved</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center ${
            isActive("/discover") ? "text-primary" : "text-gray-500"
          }`}
          onClick={() => navigate("/discover")}
        >
          <Compass className={`${isActive("/discover") ? "text-primary" : "text-gray-500"} h-5 w-5`} />
          <span className="text-xs mt-1">Discover</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center ${
            isActive("/profile") ? "text-primary" : "text-gray-500"
          }`}
          onClick={() => navigate("/profile")}
        >
          <User className={`${isActive("/profile") ? "text-primary" : "text-gray-500"} h-5 w-5`} />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
}
