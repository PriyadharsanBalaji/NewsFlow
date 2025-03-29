import { useState } from "react";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { CategoryFilter } from "@/components/dashboard/category-filter";
import { TopStories } from "@/components/dashboard/top-stories";
import { PersonalizedFeed } from "@/components/dashboard/personalized-feed";
import { SettingsModal } from "@/components/modals/settings-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getSavedArticles } from "@/lib/newsapi";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user interests
  const { data: interests } = useQuery({
    queryKey: ["/api/interests"],
    queryFn: async () => {
      const response = await fetch("/api/interests", {
        credentials: 'include'
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.categories as string[];
    },
    staleTime: Infinity,
  });

  // Fetch saved articles to check what's already saved
  const { data: savedArticles = [] } = useQuery({
    queryKey: ["/api/saved-articles"],
    queryFn: getSavedArticles,
  });

  // Get all saved article IDs (URLs) for checking
  const savedArticleIds = savedArticles.map((article: any) => article.article_id);

  // Handle category filter change
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  // Handle feed refresh
  const handleRefreshFeed = async () => {
    setIsRefreshing(true);
    
    try {
      // Invalidate all news queries to refresh the data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/news"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/news/personalized"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/saved-articles"] })
      ]);
      
      // Fetch the data immediately
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/news"] }),
        queryClient.refetchQueries({ queryKey: ["/api/news/personalized"] }),
        queryClient.refetchQueries({ queryKey: ["/api/saved-articles"] })
      ]);
    } catch (error) {
      console.error("Error refreshing feeds:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle settings modal
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenSettings={toggleSettings} />
      
      <main className="flex-grow bg-gray-50 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <WelcomeBanner 
            firstName={user?.first_name || user?.username?.split(" ")[0]} 
            onRefresh={handleRefreshFeed}
            isRefreshing={isRefreshing}
          />
          
          <CategoryFilter 
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            userCategories={interests || []}
          />
          
          <TopStories 
            category={selectedCategory} 
            savedArticleIds={savedArticleIds}
          />
          
          <PersonalizedFeed 
            savedArticleIds={savedArticleIds}
            onOpenSettings={toggleSettings}
          />
        </div>
      </main>
      
      <MobileNav />
      
      <SettingsModal 
        open={isSettingsOpen} 
        onClose={toggleSettings}
      />
    </div>
  );
}
