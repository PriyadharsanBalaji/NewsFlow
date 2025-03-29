import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SettingsModal } from "@/components/modals/settings-modal";
import { useQuery } from "@tanstack/react-query";
import { NEWS_CATEGORIES, DEFAULT_NEWS_IMAGE } from "@/lib/constants";
import { getNews, getSavedArticles } from "@/lib/newsapi";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NewsCard } from "@/components/dashboard/news-card";
import { Article } from "@/types";
import { Search } from "lucide-react";

export default function Discover() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch news for the selected category
  const { data: news, isLoading } = useQuery({
    queryKey: ["/api/news", selectedTab !== "all" ? selectedTab : null],
    queryFn: () => getNews(selectedTab !== "all" ? selectedTab : undefined),
  });

  // Fetch saved articles to check what's already saved
  const { data: savedArticles = [] } = useQuery({
    queryKey: ["/api/saved-articles"],
    queryFn: getSavedArticles,
  });

  // Get all saved article IDs (URLs) for checking
  const savedArticleIds = savedArticles.map((article: any) => article.article_id);

  // Filter articles based on search query
  const filteredArticles = news?.filter((article: Article) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title?.toLowerCase().includes(query) ||
      article.description?.toLowerCase().includes(query) ||
      article.source?.name?.toLowerCase().includes(query)
    );
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setSearchQuery(""); // Reset search when changing tabs
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
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Discover News</h1>
            
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <Tabs defaultValue="all" value={selectedTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-4 md:grid-cols-10 h-auto mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                {NEWS_CATEGORIES.slice(0, 9).map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={selectedTab} className="pt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
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
                ) : !filteredArticles || filteredArticles.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    {searchQuery ? (
                      <>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">No matching articles found</h3>
                        <p className="text-gray-600 mb-4">
                          We couldn't find any articles matching "{searchQuery}".
                        </p>
                        <Button variant="outline" onClick={() => setSearchQuery("")}>
                          Clear Search
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">No Articles Available</h3>
                        <p className="text-gray-600 mb-4">
                          We couldn't find any articles in this category at the moment.
                        </p>
                        <Button onClick={() => handleTabChange("all")}>
                          Browse All News
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map((article: Article) => (
                      <NewsCard 
                        key={article.url} 
                        article={{
                          ...article,
                          category: selectedTab !== "all" ? selectedTab : article.category,
                        }}
                        isSaved={savedArticleIds.includes(article.url)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
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
