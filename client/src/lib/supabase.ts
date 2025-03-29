import { createClient } from "@supabase/supabase-js";
import { apiRequest } from "./queryClient";

// Supabase configuration - using actual values for development
const supabaseUrl = "https://qyamtbxvgaecrqlfuqhh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5YW10Ynh2Z2FlY3JxbGZ1cWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDI3MTgsImV4cCI6MjA1ODgxODcxOH0.NhWYnlAnu0S6F25MdLXlXB9UGtWqwGOz_26QmGIUaxk";

console.log("Initializing Supabase with URL:", supabaseUrl);

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase auth functions
export async function registerUser(userData: { 
  email: string; 
  password: string; 
  username: string;
  first_name?: string;
  last_name?: string;
}) {
  try {
    // Register with our API (which will also create Supabase user)
    const response = await apiRequest("POST", "/api/auth/signup", userData);
    const user = await response.json();
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function loginUser(credentials: { email: string; password: string }) {
  try {
    // Login with our API (which handles Supabase auth)
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const user = await response.json();
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function logoutUser() {
  try {
    // Logout from our API (which will destroy the session)
    await apiRequest("POST", "/api/auth/logout");
    
    // Also sign out from Supabase
    await supabase.auth.signOut();
    
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getCurrentUser() {
  try {
    // Get current user from our API
    const response = await apiRequest("GET", "/api/user");
    const user = await response.json();
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : String(error) };
  }
}
