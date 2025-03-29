import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  createUserSchema,
  insertInterestSchema, 
  insertApiKeySchema, 
  insertSavedArticleSchema,
  categorySchema 
} from "@shared/schema";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { setupAuth } from "./auth";

// Import NEWS_CATEGORIES for category validation
const NEWS_CATEGORIES = [
  { id: "technology" },
  { id: "business" },
  { id: "science" },
  { id: "health" },
  { id: "entertainment" },
  { id: "sports" },
  { id: "politics" },
  { id: "environment" },
  { id: "finance" },
  { id: "general" }
];

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Set up auth with Passport and sessions
  setupAuth(app);

  // News API
  const NEWS_API_KEY = process.env.NEWS_API_KEY || "";
  const NEWS_API_URL = "https://newsapi.org/v2";

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // User Routes
  app.get("/api/user", isAuthenticated, (req, res) => {
    try {
      // User is already attached to req by Passport
      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = req.user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Interest Routes
  app.post("/api/interests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { categories } = req.body;
      
      // Validate categories
      if (!Array.isArray(categories)) {
        return res.status(400).json({ message: "Categories must be an array" });
      }

      // Check if user already has interests
      const existingInterests = await storage.getInterests(userId);
      
      if (existingInterests) {
        // Update existing interests
        const updated = await storage.updateInterests(userId, categories);
        return res.status(200).json(updated);
      } else {
        // Create new interests
        const interest = await storage.createInterests({
          user_id: userId,
          categories: categories
        });
        
        return res.status(201).json(interest);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to save interests" });
    }
  });
  
  // PUT endpoint to handle interest updates, including custom categories
  app.put("/api/interests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { categories } = req.body;
      
      // Validate categories
      if (!Array.isArray(categories)) {
        return res.status(400).json({ message: "Categories must be an array" });
      }
      
      // Check if user already has interests
      const existingInterests = await storage.getInterests(userId);
      
      if (!existingInterests) {
        // Create new interests if they don't exist
        const interest = await storage.createInterests({
          user_id: userId,
          categories: categories
        });
        
        return res.status(201).json(interest);
      }
      
      // Update existing interests
      const updated = await storage.updateInterests(userId, categories);
      return res.status(200).json(updated);
    } catch (error) {
      console.error("Error updating interests:", error);
      res.status(500).json({ message: "Failed to update interests" });
    }
  });

  app.get("/api/interests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const interests = await storage.getInterests(userId);
      
      if (!interests) {
        return res.status(404).json({ message: "Interests not found" });
      }
      
      // Extract categories array from the JSONB object
      const categoriesObj = interests.categories as any;
      const categories = categoriesObj?.categories || [];
      
      // Return a more client-friendly format
      res.status(200).json({
        ...interests,
        categories: categories
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get interests" });
    }
  });

  // API Key Routes
  app.post("/api/gemini-key", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { gemini_key } = req.body;
      
      // Check if user already has an API key
      const existingKey = await storage.getApiKey(userId);
      
      if (existingKey) {
        // Update existing key
        const updated = await storage.updateApiKey(userId, gemini_key);
        return res.status(200).json(updated);
      } else {
        // Create new API key
        const apiKey = await storage.createApiKey({
          user_id: userId,
          gemini_key
        });
        
        return res.status(201).json(apiKey);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to save API key" });
    }
  });

  app.get("/api/gemini-key", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const apiKey = await storage.getApiKey(userId);
      
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      res.status(200).json(apiKey);
    } catch (error) {
      res.status(500).json({ message: "Failed to get API key" });
    }
  });

  // News Routes
  app.get("/api/news", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { category } = req.query;
      
      // Get user interests
      const userInterests = await storage.getInterests(userId);
      
      if (!userInterests) {
        return res.status(400).json({ message: "Please set your interests first" });
      }

      // Get news based on category or all interests
      let newsCategory = category as string;
      if (!newsCategory) {
        // Use first category from user interests if none specified
        const categoriesObj = userInterests.categories as any;
        const categories = categoriesObj?.categories || [];
        if (categories && categories.length > 0) {
          newsCategory = categories[0];
        } else {
          newsCategory = "general";
        }
      }

      // Fetch news from API
      const response = await axios.get(`${NEWS_API_URL}/top-headlines`, {
        params: {
          apiKey: NEWS_API_KEY,
          category: newsCategory,
          language: "en",
          pageSize: 20  // Increased from 10 to 20
        }
      });

      const articles = response.data.articles || [];
      
      res.status(200).json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.get("/api/news/personalized", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get user interests
      const userInterests = await storage.getInterests(userId);
      
      if (!userInterests) {
        return res.status(400).json({ message: "Please set your interests first" });
      }

      // Get user's Gemini API key
      const apiKeyData = await storage.getApiKey(userId);
      
      if (!apiKeyData || !apiKeyData.gemini_key) {
        return res.status(400).json({ message: "Gemini API key not found. Please set it in your profile." });
      }

      const geminiApiKey = apiKeyData.gemini_key;
      
      // Get categories
      const categoriesObj = userInterests.categories as any;
      const categories = categoriesObj?.categories || [];
      
      if (!categories || categories.length === 0) {
        return res.status(400).json({ message: "No interests found" });
      }

      // Separate standard categories and custom interests
      const standardCategories = NEWS_CATEGORIES.map((cat: { id: string }) => cat.id);
      const userStandardCategories = categories.filter((cat: string) => standardCategories.includes(cat));
      const userCustomCategories = categories.filter((cat: string) => !standardCategories.includes(cat));
      
      // Fetch news for standard categories
      const allArticles = [];
      
      // Handle standard categories first
      for (const category of userStandardCategories.slice(0, 3)) { // Limit to top 3 standard categories
        try {
          const response = await axios.get(`${NEWS_API_URL}/top-headlines`, {
            params: {
              apiKey: NEWS_API_KEY,
              category,
              language: "en",
              pageSize: 10
            }
          });
          
          if (response.data.articles) {
            // Add category to each article
            const articlesWithCategory = response.data.articles.map((article: any) => ({
              ...article,
              category
            }));
            allArticles.push(...articlesWithCategory);
          }
        } catch (err) {
          console.error(`Error fetching news for category ${category}:`, err);
          // Continue with other categories even if one fails
        }
      }
      
      // Handle custom interests by searching for them
      for (const customTopic of userCustomCategories.slice(0, 3)) { // Limit to top 3 custom interests
        try {
          // Use "everything" endpoint with the custom topic as a query
          const response = await axios.get(`${NEWS_API_URL}/everything`, {
            params: {
              apiKey: NEWS_API_KEY,
              q: customTopic,
              language: "en",
              sortBy: "relevancy",
              pageSize: 10
            }
          });
          
          if (response.data.articles) {
            // Add custom category to each article
            const articlesWithCategory = response.data.articles.map((article: any) => ({
              ...article,
              category: customTopic
            }));
            allArticles.push(...articlesWithCategory);
          }
        } catch (err) {
          console.error(`Error fetching news for custom topic ${customTopic}:`, err);
          // Continue with other topics even if one fails
        }
      }

      // Skip AI filtering if no articles
      if (allArticles.length === 0) {
        return res.status(200).json([]);
      }

      // Shuffle and limit articles
      const shuffledArticles = allArticles.sort(() => 0.5 - Math.random());
      const articles = shuffledArticles.slice(0, 20);
      
      // Add AI reason to each article
      const articlesWithReason = articles.map(article => ({
        ...article,
        ai_reason: `Selected based on your interest in ${article.category || 'news'}`
      }));
      
      return res.status(200).json(articlesWithReason);
    } catch (error) {
      console.error("Personalized news error:", error);
      res.status(500).json({ message: "Failed to fetch personalized news" });
    }
  });

  // Saved Articles Routes
  app.post("/api/saved-articles", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const articleData = insertSavedArticleSchema.parse({
        ...req.body,
        user_id: userId
      });
      
      // Check if article is already saved
      const existingArticle = await storage.getSavedArticle(userId, articleData.article_id);
      
      if (existingArticle) {
        return res.status(400).json({ message: "Article already saved" });
      }
      
      const savedArticle = await storage.createSavedArticle(articleData);
      res.status(201).json(savedArticle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to save article" });
    }
  });

  app.get("/api/saved-articles", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const articles = await storage.getSavedArticles(userId);
      res.status(200).json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get saved articles" });
    }
  });

  app.delete("/api/saved-articles/:articleId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { articleId } = req.params;
      
      const result = await storage.deleteSavedArticle(userId, articleId);
      
      if (!result) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.status(200).json({ message: "Article removed from saved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete saved article" });
    }
  });
  
  // Admin middleware - check if user is an admin
  const isAdmin = async (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user has admin privileges
    if (!req.user.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    return next();
  };
  
  // Admin Routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  app.get("/api/admin/saved-articles", isAdmin, async (req, res) => {
    try {
      const articles = await storage.getAllSavedArticles();
      res.status(200).json(articles);
    } catch (error) {
      console.error("Error getting all saved articles:", error);
      res.status(500).json({ message: "Failed to get saved articles" });
    }
  });
  
  app.put("/api/admin/users/:userId/admin-status", isAdmin, async (req, res) => {
    try {
      const adminId = req.user!.id;
      const userId = parseInt(req.params.userId);
      const { isAdmin } = req.body;
      
      if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({ message: "isAdmin must be a boolean" });
      }
      
      // Cannot change own admin status
      if (userId === adminId) {
        return res.status(400).json({ message: "Cannot change your own admin status" });
      }
      
      const updatedUser = await storage.setUserAdminStatus(userId, isAdmin);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log admin action
      await storage.createAdminLog({
        admin_id: adminId,
        action: isAdmin ? 'GRANT_ADMIN' : 'REVOKE_ADMIN',
        target_type: 'USER',
        target_id: userId.toString(),
        details: `${isAdmin ? 'Granted' : 'Revoked'} admin privileges for user ID ${userId}`
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user admin status:", error);
      res.status(500).json({ message: "Failed to update user admin status" });
    }
  });
  
  app.delete("/api/admin/users/:userId", isAdmin, async (req, res) => {
    try {
      const adminId = req.user!.id;
      const userId = parseInt(req.params.userId);
      
      // Cannot delete own account
      if (userId === adminId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Get user before deletion to log details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const result = await storage.deleteUser(userId);
      
      if (!result) {
        return res.status(404).json({ message: "User not found or deletion failed" });
      }
      
      // Log admin action
      await storage.createAdminLog({
        admin_id: adminId,
        action: 'DELETE_USER',
        target_type: 'USER',
        target_id: userId.toString(),
        details: `Deleted user account: ${user.username} (${user.email})`
      });
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  app.get("/api/admin/logs", isAdmin, async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      res.status(200).json(logs);
    } catch (error) {
      console.error("Error getting admin logs:", error);
      res.status(500).json({ message: "Failed to get admin logs" });
    }
  });
  
  app.post("/api/admin/logs", isAdmin, async (req, res) => {
    try {
      const adminId = req.user!.id;
      const { action, target_type, target_id, details } = req.body;
      
      if (!action || !target_type || !target_id) {
        return res.status(400).json({ message: "action, target_type, and target_id are required" });
      }
      
      const log = await storage.createAdminLog({
        admin_id: adminId,
        action,
        target_type,
        target_id,
        details
      });
      
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating admin log:", error);
      res.status(500).json({ message: "Failed to create admin log" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
