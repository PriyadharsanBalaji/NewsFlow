import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Share2, Eye, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { saveArticle, removeSavedArticle } from "@/lib/newsapi";
import { useQueryClient } from "@tanstack/react-query";
import { Article } from "@/types";
import { NEWS_CATEGORIES, DEFAULT_NEWS_IMAGE } from "@/lib/constants";
import { ArticleDetail } from "./article-detail";

interface NewsCardProps {
  article: Article;
  isFullWidth?: boolean;
  isSaved?: boolean;
}

export function NewsCard({ article, isFullWidth = false, isSaved = false }: NewsCardProps) {
  const [saving, setSaving] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all standard category IDs
  const standardCategoryIds = NEWS_CATEGORIES.map(cat => cat.id);
  
  // Check if this is a custom category
  const isCustomCategory = article.category && !standardCategoryIds.includes(article.category);
  
  // Find category color and background
  const category = article.category && !isCustomCategory
    ? NEWS_CATEGORIES.find(c => c.id === article.category) 
    : NEWS_CATEGORIES.find(c => c.id === "general");
  
  // Default colors for standard categories
  let bgColor = category?.bgColor || "bg-gray-100";
  let textColor = category?.textColor || "text-gray-800";
  
  // Special colors for custom categories
  if (isCustomCategory) {
    bgColor = "bg-indigo-100";
    textColor = "text-indigo-800";
  }
  
  // Format the published date
  const publishedDate = article.publishedAt 
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
    : "";
  
  // Handle saving/unsaving article
  const handleSaveToggle = async () => {
    try {
      setSaving(true);
      
      if (isSaved) {
        await removeSavedArticle(article.url);
        toast({
          title: "Article removed",
          description: "Article removed from your saved list",
        });
      } else {
        await saveArticle(article);
        toast({
          title: "Article saved",
          description: "Article saved to your list",
        });
      }
      
      // Invalidate saved articles query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/saved-articles"] });
    } catch (error) {
      toast({
        title: "Action failed",
        description: "Could not process your request",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle sharing article
  const handleShare = () => {
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
  const handleView = () => {
    window.open(article.url, "_blank", "noopener,noreferrer");
  };

  // Open article detail
  const openArticleDetail = (e: React.MouseEvent) => {
    // Don't open if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDetailOpen(true);
  };
  
  // Close article detail
  const closeArticleDetail = () => {
    setIsDetailOpen(false);
  };

  if (isFullWidth) {
    return (
      <>
        <Card 
          className="overflow-hidden card-hover cursor-pointer transition-all hover:shadow-md"
          onClick={openArticleDetail}
        >
          <div className="md:flex">
            <div className="md:shrink-0">
              <img
                className="h-48 w-full md:h-full md:w-48 object-cover"
                src={article.urlToImage || DEFAULT_NEWS_IMAGE}
                alt={article.title}
                onError={(e) => (e.currentTarget.src = DEFAULT_NEWS_IMAGE)}
              />
            </div>
            <CardContent className="p-6">
              <div className="flex items-center mb-2">
                <span className={`px-2 py-1 text-xs font-medium ${bgColor} ${textColor} rounded-full`}>
                  {article.category || "General"}
                </span>
                <span className="ml-2 text-xs text-gray-500">{publishedDate}</span>
              </div>
              <h3 className="font-bold text-xl mb-2">{article.title}</h3>
              <p className="text-gray-600 mb-4">{article.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">
                    {article.source?.name || "Unknown Source"}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 z-10"
                    disabled={saving}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveToggle();
                    }}
                  >
                    <Bookmark 
                      className={`h-5 w-5 ${isSaved ? "fill-current text-primary" : "text-gray-400 hover:text-gray-600"}`} 
                    />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                  >
                    <Share2 className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView();
                    }}
                  >
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </Button>
                </div>
              </div>
              
              {/* AI reasoning if available */}
              {article.ai_reason && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <p><span className="font-medium">AI Analysis:</span> {article.ai_reason}</p>
                </div>
              )}
              
              <div className="absolute bottom-4 right-4 text-primary opacity-60">
                <ChevronRight className="h-5 w-5" />
              </div>
            </CardContent>
          </div>
        </Card>
        
        {/* Article Detail Dialog */}
        <ArticleDetail 
          article={article}
          isOpen={isDetailOpen}
          isSaved={isSaved}
          onClose={closeArticleDetail}
        />
      </>
    );
  }

  return (
    <>
      <Card 
        className="overflow-hidden card-hover cursor-pointer transition-all hover:shadow-md"
        onClick={openArticleDetail}
      >
        <img
          className="h-48 w-full object-cover"
          src={article.urlToImage || DEFAULT_NEWS_IMAGE}
          alt={article.title}
          onError={(e) => (e.currentTarget.src = DEFAULT_NEWS_IMAGE)}
        />
        <CardContent className="p-4">
          <div className="flex items-center mb-2">
            <span className={`px-2 py-1 text-xs font-medium ${bgColor} ${textColor} rounded-full`}>
              {article.category || "General"}
            </span>
            <span className="ml-2 text-xs text-gray-500">{publishedDate}</span>
          </div>
          <h3 className="font-bold text-lg mb-2">{article.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{article.source?.name || "Unknown Source"}</span>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 w-7 p-0 z-10"
                disabled={saving}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveToggle();
                }}
              >
                <Bookmark 
                  className={`h-4 w-4 ${isSaved ? "fill-current text-primary" : "text-gray-400 hover:text-gray-600"}`} 
                />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 w-7 p-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
              >
                <Share2 className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Article Detail Dialog */}
      <ArticleDetail 
        article={article}
        isOpen={isDetailOpen}
        isSaved={isSaved}
        onClose={closeArticleDetail}
      />
    </>
  );
}
