import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNews, getPersonalizedNews, getSavedArticles } from "@/lib/newsapi";
import { Article } from "@/types";

interface UseNewsOptions {
  category?: string;
  personalized?: boolean;
}

export function useNews({ category, personalized = false }: UseNewsOptions = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch news based on options
  const queryKey = personalized 
    ? ["/api/news/personalized"] 
    : ["/api/news", category];
  
  const queryFn = personalized 
    ? getPersonalizedNews 
    : () => getNews(category);

  const {
    data: articles = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Article[]>({
    queryKey,
    queryFn,
  });

  // Fetch saved articles to check what's already saved
  const { data: savedArticles = [] } = useQuery({
    queryKey: ["/api/saved-articles"],
    queryFn: getSavedArticles,
  });

  // Get all saved article IDs (URLs) for checking
  const savedArticleIds = savedArticles.map((article: any) => article.article_id);

  // Refresh news data
  const refreshNews = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      
      // Also refresh personalized news if we're refreshing regular news
      if (!personalized) {
        queryClient.invalidateQueries({ queryKey: ["/api/news/personalized"] });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if an article is saved
  const isArticleSaved = (url: string) => {
    return savedArticleIds.includes(url);
  };

  return {
    articles,
    isLoading,
    error,
    isRefreshing,
    refreshNews,
    savedArticleIds,
    isArticleSaved,
  };
}
