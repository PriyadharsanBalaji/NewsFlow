// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  supabase_id?: string;
  created_at?: string;
  is_admin?: boolean;
}

// News article type
export interface Article {
  source?: {
    id?: string;
    name: string;
  };
  author?: string;
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt?: string;
  content?: string;
  category?: string;
  ai_reason?: string; // For AI-filtered content
}

// Saved article type
export interface SavedArticle {
  id: number;
  user_id: number;
  article_id: string; // URL used as ID
  title: string;
  description?: string;
  url: string;
  image_url?: string;
  source?: string;
  category?: string;
  published_at?: string;
  saved_at: string;
}

// User interests type
export interface Interest {
  id: number;
  user_id: number;
  categories: string[];
}

// API key type
export interface ApiKey {
  id: number;
  user_id: number;
  gemini_key?: string;
}

// News category type
export interface NewsCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
}
