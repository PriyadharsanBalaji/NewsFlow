import { apiRequest } from "./queryClient";
import { type Article } from "../types";

// Get regular news articles
export async function getNews(category?: string): Promise<Article[]> {
  try {
    const url = category 
      ? `/api/news?category=${category}`
      : `/api/news`;
    
    const response = await apiRequest("GET", url);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch news:", error);
    throw error;
  }
}

// Get AI-personalized news articles
export async function getPersonalizedNews(): Promise<Article[]> {
  try {
    const response = await apiRequest("GET", "/api/news/personalized");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch personalized news:", error);
    throw error;
  }
}

// Save an article
export async function saveArticle(article: Article) {
  try {
    const response = await apiRequest("POST", "/api/saved-articles", {
      article_id: article.url, // Using URL as unique ID
      title: article.title,
      description: article.description || "",
      url: article.url,
      image_url: article.urlToImage || "",
      source: article.source?.name || "",
      category: article.category || "general",
      published_at: article.publishedAt || new Date().toISOString()
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to save article:", error);
    throw error;
  }
}

// Remove a saved article
export async function removeSavedArticle(articleId: string) {
  try {
    await apiRequest("DELETE", `/api/saved-articles/${articleId}`);
    return true;
  } catch (error) {
    console.error("Failed to remove saved article:", error);
    throw error;
  }
}

// Get all saved articles
export async function getSavedArticles() {
  try {
    const response = await apiRequest("GET", "/api/saved-articles");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch saved articles:", error);
    throw error;
  }
}
