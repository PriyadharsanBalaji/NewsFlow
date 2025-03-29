import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { NewsCard } from "./news-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPersonalizedNews } from "@/lib/newsapi";
import { Article } from "@/types";
import { Settings2 } from "lucide-react";

interface PersonalizedFeedProps {
  savedArticleIds: string[];
  onOpenSettings: () => void;
}

export function PersonalizedFeed({ savedArticleIds, onOpenSettings }: PersonalizedFeedProps) {
  const [visibleArticles, setVisibleArticles] = useState(3);
  
  // Fetch personalized news articles
  const { data: articles, isLoading, error } = useQuery({
    queryKey: ["/api/news/personalized"],
    queryFn: getPersonalizedNews,
  });

  // Check if an article is saved
  const isArticleSaved = (url: string) => {
    return savedArticleIds.includes(url);
  };

  // Load more articles
  const loadMore = () => {
    if (articles) {
      setVisibleArticles(Math.min(visibleArticles + 3, articles.length));
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Personalized Feed</h2>
          <Button variant="ghost" size="sm" onClick={onOpenSettings}>
            <Settings2 className="mr-1 h-4 w-4" />
            <span>Adjust Preferences</span>
          </Button>
        </div>
        
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="md:flex">
                <Skeleton className="h-48 w-full md:h-full md:w-48" />
                <div className="p-6 w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-7 w-full mb-2" />
                  <Skeleton className="h-7 w-5/6 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Personalized Feed</h2>
          <Button variant="ghost" size="sm" onClick={onOpenSettings}>
            <Settings2 className="mr-1 h-4 w-4" />
            <span>Adjust Preferences</span>
          </Button>
        </div>
        
        <div className="bg-red-50 text-red-500 p-6 rounded-md">
          <p className="font-medium">Failed to load personalized news.</p>
          <p className="mt-2">
            This could be due to an invalid Gemini API key or network issue. 
            Please check your API key in settings.
          </p>
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Personalized Feed</h2>
          <Button variant="ghost" size="sm" onClick={onOpenSettings}>
            <Settings2 className="mr-1 h-4 w-4" />
            <span>Adjust Preferences</span>
          </Button>
        </div>
        
        <div className="bg-gray-50 p-8 rounded-xl text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Personalized Articles Yet</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any personalized news articles for your interests.
            Try selecting more categories in your preferences.
          </p>
          <Button onClick={onOpenSettings}>
            Update Preferences
          </Button>
        </div>
      </div>
    );
  }

  const displayedArticles = articles.slice(0, visibleArticles);
  const hasMoreToLoad = articles.length > visibleArticles;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Personalized Feed</h2>
        <Button variant="ghost" size="sm" onClick={onOpenSettings}>
          <Settings2 className="mr-1 h-4 w-4" />
          <span>Adjust Preferences</span>
        </Button>
      </div>
      
      <div className="space-y-6">
        {displayedArticles.map((article: Article) => (
          <NewsCard 
            key={article.url} 
            article={article}
            isFullWidth={true}
            isSaved={isArticleSaved(article.url)}
          />
        ))}
        
        {hasMoreToLoad && (
          <div className="text-center py-4">
            <Button 
              variant="outline"
              onClick={loadMore}
            >
              Load More News
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
