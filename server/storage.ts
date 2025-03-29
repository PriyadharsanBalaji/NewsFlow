import { 
  users, type User, type InsertUser, type CreateUser,
  interests, type Interest, type InsertInterest,
  apiKeys, type ApiKey, type InsertApiKey,
  savedArticles, type SavedArticle, type InsertSavedArticle,
  adminLogs, type AdminLog, type InsertAdminLog
} from "@shared/schema";
import session from "express-session";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseId: string): Promise<User | undefined>;
  createUser(user: CreateUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Interest operations
  getInterests(userId: number): Promise<Interest | undefined>;
  createInterests(interest: InsertInterest): Promise<Interest>;
  updateInterests(userId: number, categories: any): Promise<Interest | undefined>;

  // API key operations
  getApiKey(userId: number): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(userId: number, geminiKey: string): Promise<ApiKey | undefined>;

  // Saved article operations
  getSavedArticles(userId: number): Promise<SavedArticle[]>;
  getSavedArticle(userId: number, articleId: string): Promise<SavedArticle | undefined>;
  createSavedArticle(article: InsertSavedArticle): Promise<SavedArticle>;
  deleteSavedArticle(userId: number, articleId: string): Promise<boolean>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllSavedArticles(): Promise<SavedArticle[]>;
  setUserAdminStatus(userId: number, isAdmin: boolean): Promise<User | undefined>;
  deleteUser(userId: number): Promise<boolean>;
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(): Promise<AdminLog[]>;
  
  // Session store
  sessionStore: session.Store;
}

import MemoryStore from "memorystore";

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private interests: Map<number, Interest>;
  private apiKeys: Map<number, ApiKey>;
  private savedArticles: Map<number, SavedArticle>;
  private currentUserId: number;
  private currentInterestId: number;
  private currentApiKeyId: number;
  private currentSavedArticleId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.interests = new Map();
    this.apiKeys = new Map();
    this.savedArticles = new Map();
    this.currentUserId = 1;
    this.currentInterestId = 1;
    this.currentApiKeyId = 1;
    this.currentSavedArticleId = 1;
    
    // Initialize memory store for sessions
    const MemoryStoreSession = MemoryStore(session);
    this.sessionStore = new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.supabase_id === supabaseId,
    );
  }

  async createUser(insertUser: CreateUser): Promise<User> {
    const id = this.currentUserId++;
    const created_at = new Date();
    // Cast to ensure type safety
    const user: User = { 
      ...insertUser, 
      id, 
      created_at, 
      supabase_id: insertUser.supabase_id || null,
      first_name: insertUser.first_name || null,
      last_name: insertUser.last_name || null,
      is_admin: insertUser.is_admin || false
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Interest operations
  async getInterests(userId: number): Promise<Interest | undefined> {
    return Array.from(this.interests.values()).find(
      (interest) => interest.user_id === userId,
    );
  }

  async createInterests(interest: InsertInterest): Promise<Interest> {
    const id = this.currentInterestId++;
    // Ensure user_id is not undefined
    const newInterest: Interest = { 
      ...interest, 
      id,
      user_id: interest.user_id || null 
    };
    this.interests.set(id, newInterest);
    return newInterest;
  }

  async updateInterests(userId: number, categories: any): Promise<Interest | undefined> {
    const interest = await this.getInterests(userId);
    if (!interest) return undefined;
    
    const updatedInterest = { ...interest, categories };
    this.interests.set(interest.id, updatedInterest);
    return updatedInterest;
  }

  // API key operations
  async getApiKey(userId: number): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find(
      (apiKey) => apiKey.user_id === userId,
    );
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const id = this.currentApiKeyId++;
    // Ensure user_id and gemini_key are not undefined
    const newApiKey: ApiKey = { 
      ...apiKey, 
      id,
      user_id: apiKey.user_id || null,
      gemini_key: apiKey.gemini_key || null
    };
    this.apiKeys.set(id, newApiKey);
    return newApiKey;
  }

  async updateApiKey(userId: number, geminiKey: string): Promise<ApiKey | undefined> {
    const apiKey = await this.getApiKey(userId);
    if (!apiKey) return undefined;
    
    const updatedApiKey = { ...apiKey, gemini_key: geminiKey };
    this.apiKeys.set(apiKey.id, updatedApiKey);
    return updatedApiKey;
  }

  // Saved article operations
  async getSavedArticles(userId: number): Promise<SavedArticle[]> {
    return Array.from(this.savedArticles.values()).filter(
      (article) => article.user_id === userId,
    );
  }

  async getSavedArticle(userId: number, articleId: string): Promise<SavedArticle | undefined> {
    return Array.from(this.savedArticles.values()).find(
      (article) => article.user_id === userId && article.article_id === articleId,
    );
  }

  async createSavedArticle(article: InsertSavedArticle): Promise<SavedArticle> {
    const id = this.currentSavedArticleId++;
    const saved_at = new Date();
    
    // Create a properly typed SavedArticle object
    const newArticle: SavedArticle = {
      id,
      user_id: article.user_id || null,
      article_id: article.article_id,
      title: article.title,
      description: article.description || null,
      url: article.url,
      image_url: article.image_url || null,
      source: article.source || null,
      category: article.category || null,
      published_at: article.published_at || null,
      saved_at
    };
    
    this.savedArticles.set(id, newArticle);
    return newArticle;
  }

  async deleteSavedArticle(userId: number, articleId: string): Promise<boolean> {
    const article = await this.getSavedArticle(userId, articleId);
    if (!article) return false;
    
    return this.savedArticles.delete(article.id);
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllSavedArticles(): Promise<SavedArticle[]> {
    return Array.from(this.savedArticles.values());
  }

  async setUserAdminStatus(userId: number, isAdmin: boolean): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, is_admin: isAdmin };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: number): Promise<boolean> {
    // Delete all related data first
    const interests = await this.getInterests(userId);
    if (interests) this.interests.delete(interests.id);
    
    const apiKey = await this.getApiKey(userId);
    if (apiKey) this.apiKeys.delete(apiKey.id);
    
    const savedArticles = await this.getSavedArticles(userId);
    for (const article of savedArticles) {
      this.savedArticles.delete(article.id);
    }
    
    // Finally delete the user
    return this.users.delete(userId);
  }

  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const id = 1; // For memory storage implementation, we'll use a simple ID
    const created_at = new Date();
    
    // Create a properly typed AdminLog object
    const newLog: AdminLog = {
      id,
      admin_id: log.admin_id || 0, // Ensure we have a number
      action: log.action,
      target_type: log.target_type,
      target_id: log.target_id,
      details: log.details || null,
      created_at
    };
    
    return newLog;
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    return []; // For memory storage, we won't actually store logs
  }
}

import { createClient } from "@supabase/supabase-js";
import pg from 'pg';
const { Pool } = pg;

import connectPgSimple from "connect-pg-simple";

export class PostgreSQLStorage implements IStorage {
  private pool: pg.Pool;
  public sessionStore: session.Store;

  constructor() {
    console.log('Initializing PostgreSQL storage');
    
    // Initialize database connection using environment variables
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Verify connection
    this.pool.query('SELECT NOW()')
      .then(() => console.log('PostgreSQL connection successful'))
      .catch(error => console.error('PostgreSQL connection error:', error));
    
    // Create PostgreSQL session store
    const PgSessionStore = connectPgSimple(session);
    this.sessionStore = new PgSessionStore({
      pool: this.pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
    
    console.log('PostgreSQL storage initialized');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.pool.query<User>('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.pool.query<User>('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await this.pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    try {
      const result = await this.pool.query<User>('SELECT * FROM users WHERE supabase_id = $1', [supabaseId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting user by Supabase ID:', error);
      return undefined;
    }
  }

  async createUser(user: CreateUser): Promise<User> {
    try {
      const result = await this.pool.query(
        'INSERT INTO users (username, email, password, first_name, last_name, supabase_id, is_admin) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
          user.username, 
          user.email, 
          user.password, 
          user.first_name || null, 
          user.last_name || null, 
          user.supabase_id || null,
          user.is_admin || false
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      // Build the SET clause dynamically based on provided updates
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (updates.username) {
        fields.push(`username = $${paramIndex++}`);
        values.push(updates.username);
      }
      
      if (updates.email) {
        fields.push(`email = $${paramIndex++}`);
        values.push(updates.email);
      }
      
      if (updates.password) {
        fields.push(`password = $${paramIndex++}`);
        values.push(updates.password);
      }
      
      if (updates.first_name !== undefined) {
        fields.push(`first_name = $${paramIndex++}`);
        values.push(updates.first_name);
      }
      
      if (updates.last_name !== undefined) {
        fields.push(`last_name = $${paramIndex++}`);
        values.push(updates.last_name);
      }
      
      if (updates.is_admin !== undefined) {
        fields.push(`is_admin = $${paramIndex++}`);
        values.push(updates.is_admin);
      }
      
      if (fields.length === 0) {
        return await this.getUser(id); // No updates to make
      }
      
      // Add the id as the last parameter
      values.push(id);
      
      const result = await this.pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Interest operations
  async getInterests(userId: number): Promise<Interest | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM interests WHERE user_id = $1', [userId]);
      if (result.rows.length === 0) {
        return undefined;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error getting interests:', error);
      return undefined;
    }
  }

  async createInterests(interest: InsertInterest): Promise<Interest> {
    try {
      // Convert categories array to a proper JSON object with an array property
      const categoriesJson = JSON.stringify({ categories: interest.categories });
      
      const result = await this.pool.query(
        'INSERT INTO interests (user_id, categories) VALUES ($1, $2::jsonb) RETURNING *',
        [interest.user_id, categoriesJson]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating interests:', error);
      throw new Error(`Failed to create interests: ${error}`);
    }
  }

  async updateInterests(userId: number, categories: any): Promise<Interest | undefined> {
    try {
      // Convert categories array to a proper JSON object with an array property
      const categoriesJson = JSON.stringify({ categories: categories });
      
      const result = await this.pool.query(
        'UPDATE interests SET categories = $1::jsonb WHERE user_id = $2 RETURNING *',
        [categoriesJson, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating interests:', error);
      return undefined;
    }
  }

  // API key operations
  async getApiKey(userId: number): Promise<ApiKey | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM api_keys WHERE user_id = $1', [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting API key:', error);
      return undefined;
    }
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    try {
      const result = await this.pool.query(
        'INSERT INTO api_keys (user_id, gemini_key) VALUES ($1, $2) RETURNING *',
        [apiKey.user_id, apiKey.gemini_key || null]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating API key:', error);
      throw new Error(`Failed to create API key: ${error}`);
    }
  }

  async updateApiKey(userId: number, geminiKey: string): Promise<ApiKey | undefined> {
    try {
      const result = await this.pool.query(
        'UPDATE api_keys SET gemini_key = $1 WHERE user_id = $2 RETURNING *',
        [geminiKey, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating API key:', error);
      return undefined;
    }
  }

  // Saved article operations
  async getSavedArticles(userId: number): Promise<SavedArticle[]> {
    try {
      const result = await this.pool.query('SELECT * FROM saved_articles WHERE user_id = $1', [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting saved articles:', error);
      return [];
    }
  }

  async getSavedArticle(userId: number, articleId: string): Promise<SavedArticle | undefined> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM saved_articles WHERE user_id = $1 AND article_id = $2',
        [userId, articleId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting saved article:', error);
      return undefined;
    }
  }

  async createSavedArticle(article: InsertSavedArticle): Promise<SavedArticle> {
    try {
      const result = await this.pool.query(
        `INSERT INTO saved_articles (
          user_id, article_id, title, description, url, image_url, source, category, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          article.user_id,
          article.article_id,
          article.title,
          article.description || null,
          article.url,
          article.image_url || null,
          article.source || null,
          article.category || null,
          article.published_at || null
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating saved article:', error);
      throw new Error(`Failed to save article: ${error}`);
    }
  }

  async deleteSavedArticle(userId: number, articleId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'DELETE FROM saved_articles WHERE user_id = $1 AND article_id = $2',
        [userId, articleId]
      );
      
      // Handle the case where rowCount could be null
      const rowCount = result.rowCount || 0;
      return rowCount > 0;
    } catch (error) {
      console.error('Error deleting saved article:', error);
      return false;
    }
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.pool.query('SELECT * FROM users');
      return result.rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getAllSavedArticles(): Promise<SavedArticle[]> {
    try {
      const result = await this.pool.query('SELECT * FROM saved_articles');
      return result.rows;
    } catch (error) {
      console.error('Error getting all saved articles:', error);
      return [];
    }
  }

  async setUserAdminStatus(userId: number, isAdmin: boolean): Promise<User | undefined> {
    try {
      const result = await this.pool.query(
        'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING *',
        [isAdmin, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user admin status:', error);
      return undefined;
    }
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      // Use a transaction to ensure all related data is deleted properly
      await this.pool.query('BEGIN');
      
      // Delete all related data
      await this.pool.query('DELETE FROM interests WHERE user_id = $1', [userId]);
      await this.pool.query('DELETE FROM api_keys WHERE user_id = $1', [userId]);
      await this.pool.query('DELETE FROM saved_articles WHERE user_id = $1', [userId]);
      await this.pool.query('DELETE FROM admin_logs WHERE admin_id = $1', [userId]);
      
      // Delete the user
      const result = await this.pool.query('DELETE FROM users WHERE id = $1', [userId]);
      
      await this.pool.query('COMMIT');
      
      // Handle the case where rowCount could be null
      const rowCount = result.rowCount || 0;
      return rowCount > 0;
    } catch (error) {
      await this.pool.query('ROLLBACK');
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    try {
      const result = await this.pool.query(
        `INSERT INTO admin_logs (
          admin_id, action, target_type, target_id, details
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          log.admin_id,
          log.action,
          log.target_type,
          log.target_id,
          log.details || null
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating admin log:', error);
      throw new Error(`Failed to create admin log: ${error}`);
    }
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    try {
      const result = await this.pool.query('SELECT * FROM admin_logs ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      console.error('Error getting admin logs:', error);
      return [];
    }
  }
}

// Keeping Supabase as the authentication provider, but using PostgreSQL for storage
export class SupabaseAuthProvider {
  private supabase;

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://qyamtbxvgaecrqlfuqhh.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5YW10Ynh2Z2FlY3JxbGZ1cWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDI3MTgsImV4cCI6MjA1ODgxODcxOH0.NhWYnlAnu0S6F25MdLXlXB9UGtWqwGOz_26QmGIUaxk';
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase auth provider initialized');
  }

  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({
      email,
      password
    });
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async getSession() {
    return await this.supabase.auth.getSession();
  }
}

// Export a PostgreSQLStorage instance for the application to use
export const storage = new PostgreSQLStorage();
export const authProvider = new SupabaseAuthProvider();
