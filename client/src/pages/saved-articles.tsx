import { useState } from "react";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SettingsModal } from "@/components/modals/settings-modal";
import { useQuery } from "@tanstack/react-query";
import { getSavedArticles, removeSavedArticle } from "@/lib/newsapi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, Share2, Eye, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { DEFAULT_NEWS_IMAGE } from "@/lib/constants";

export default function SavedArticles() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch saved articles
  const { data: savedArticles = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/saved-articles"],
    queryFn: getSavedArticles,
  });

  // Handle search
  const filteredArticles = savedArticles.filter((article: any) => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Remove an article from saved list
  const handleRemoveArticle = async (articleId: string) => {
    try {
      await removeSavedArticle(articleId);
      toast({
        title: "Article removed",
        description: "The article has been removed from your saved list",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Removal failed",
        description: "Failed to remove the article. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle share article
  const handleShare = (article: any) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: article.url,
      }).catch((error) => console.error("Error sharing:", error));
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(article.url);
      toast({
        title: "Link copied",
        description: "Article link copied to clipboard",
      });
    }
  };

  // Handle view article
  const handleView = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
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
            <h1 className="text-3xl font-bold text-gray-800">Saved Articles</h1>
            
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search saved articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="md:flex">
                    <Skeleton className="h-48 w-full md:h-full md:w-48" />
                    <CardContent className="p-6 w-full">
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
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No matching articles found</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any saved articles matching "{searchQuery}".
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Saved Articles Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Articles you save will appear here for easy access.
                  </p>
                  <Button onClick={() => window.location.href = "/dashboard"}>
                    Browse News
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredArticles.map((article: any) => (
                <Card key={article.article_id} className="overflow-hidden card-hover">
                  <div className="md:flex">
                    <div className="md:shrink-0">
                      <img
                        className="h-48 w-full md:h-full md:w-48 object-cover"
                        src={article.image_url || DEFAULT_NEWS_IMAGE}
                        alt={article.title}
                        onError={(e) => (e.currentTarget.src = DEFAULT_NEWS_IMAGE)}
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-2">
                        <span className={`px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full`}>
                          {article.category || "General"}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : ""}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl mb-2">{article.title}</h3>
                      <p className="text-gray-600 mb-4">{article.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-700">
                            {article.source || "Unknown Source"}
                          </span>
                        </div>
                        <div className="flex space-x-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveArticle(article.article_id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleShare(article)}
                          >
                            <Share2 className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleView(article.url)}
                          >
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
