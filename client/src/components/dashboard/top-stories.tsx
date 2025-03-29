import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NewsCard } from "./news-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getNews } from "@/lib/newsapi";
import { Article } from "@/types";

interface TopStoriesProps {
  category: string | null;
  savedArticleIds: string[];
}

export function TopStories({ category, savedArticleIds }: TopStoriesProps) {
  // State for visible articles
  const [visibleArticles, setVisibleArticles] = useState(6);
  
  // Fetch news articles
  const { data: articles, isLoading, error } = useQuery({
    queryKey: ["/api/news", category],
    queryFn: () => getNews(category || undefined),
  });

  // Check if an article is saved
  const isArticleSaved = (url: string) => {
    return savedArticleIds.includes(url);
  };
  
  // Handle loading more articles
  const loadMore = () => {
    if (articles) {
      setVisibleArticles(Math.min(visibleArticles + 6, articles.length));
    }
  };

  if (isLoading) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !articles) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Stories</h2>
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          Failed to load news. Please try again later.
        </div>
      </div>
    );
  }

  // Get visible articles
  const displayedArticles = articles.slice(0, visibleArticles);
  const hasMoreToLoad = articles.length > visibleArticles;

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Stories</h2>
      
      {articles.length === 0 ? (
        <div className="bg-gray-50 text-gray-500 p-4 rounded-md text-center">
          No stories found for this category.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedArticles.map((article: Article) => (
              <NewsCard 
                key={article.url} 
                article={{
                  ...article,
                  category: category || undefined
                }}
                isSaved={isArticleSaved(article.url)}
              />
            ))}
          </div>
          
          {/* Load More button */}
          {hasMoreToLoad && (
            <div className="mt-8 text-center">
              <button 
                className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors font-medium"
                onClick={loadMore}
              >
                Load More Stories
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
