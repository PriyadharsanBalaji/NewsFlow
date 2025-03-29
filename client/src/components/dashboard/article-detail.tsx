import { useState, useEffect } from "react";
import { Article } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bookmark, Share2, Eye, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { saveArticle, removeSavedArticle } from "@/lib/newsapi";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { summarizeArticle } from "@/lib/gemini";

interface ArticleDetailProps {
  article: Article | null;
  isOpen: boolean;
  isSaved: boolean;
  onClose: () => void;
}

export function ArticleDetail({ article, isOpen, isSaved, onClose }: ArticleDetailProps) {
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle saving/unsaving article
  const handleSaveToggle = async () => {
    if (!article) return;

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
    if (!article) return;
    
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

  // Handle view original article
  const handleViewOriginal = () => {
    if (!article) return;
    window.open(article.url, "_blank", "noopener,noreferrer");
  };

  // Get AI-generated content for article
  const getAiContent = async () => {
    if (!article) return;
    
    setIsLoadingContent(true);
    setErrorMessage(null);
    
    try {
      const summary = await summarizeArticle(article);
      setAiContent(summary);
    } catch (error: any) {
      console.error("Error generating content:", error);
      setErrorMessage(error.message || "Failed to generate article content. Please try again.");
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Refresh AI content
  const refreshContent = () => {
    setAiContent(null);
    getAiContent();
  };

  // Load AI content when dialog opens
  useEffect(() => {
    if (isOpen && article && !aiContent && !isLoadingContent) {
      getAiContent();
    }
  }, [isOpen, article]);

  if (!article) return null;

  // Format the published date
  const publishedDate = article.publishedAt 
    ? new Date(article.publishedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            {article.category && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {article.category}
              </Badge>
            )}
            {article.source?.name && (
              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                {article.source.name}
              </Badge>
            )}
            {publishedDate && (
              <span className="text-sm text-gray-500">{publishedDate}</span>
            )}
          </div>
          <DialogTitle className="text-xl md:text-2xl font-bold">{article.title}</DialogTitle>
          {article.description && (
            <DialogDescription className="text-base text-gray-700 mt-2">
              {article.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Article Image */}
        {article.urlToImage && (
          <div className="rounded-lg overflow-hidden my-4">
            <img 
              src={article.urlToImage} 
              alt={article.title} 
              className="w-full object-cover max-h-80" 
            />
          </div>
        )}

        {/* AI-Generated Content */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">AI-Generated Content</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshContent}
                disabled={isLoadingContent}
              >
                {isLoadingContent ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
            
            {isLoadingContent ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-gray-500 mt-4">Generating article content...</p>
              </div>
            ) : errorMessage ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-md">
                {errorMessage}
              </div>
            ) : aiContent ? (
              <div className="prose prose-sm md:prose-base max-w-none">
                {aiContent.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-500">No content available. Please refresh.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleViewOriginal}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Original
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant={isSaved ? "default" : "outline"}
              onClick={handleSaveToggle}
              disabled={saving}
            >
              <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "" : "fill-none"}`} />
              {isSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}