import { GoogleGenerativeAI } from "@google/generative-ai";
import { apiRequest } from "./queryClient";

// Function to get the user's Gemini API key
export async function getGeminiApiKey() {
  try {
    const response = await apiRequest("GET", "/api/gemini-key");
    const data = await response.json();
    return data.gemini_key;
  } catch (error) {
    console.error("Failed to fetch Gemini API key:", error);
    return null;
  }
}

// Function to set the user's Gemini API key
export async function setGeminiApiKey(apiKey: string) {
  try {
    const response = await apiRequest("POST", "/api/gemini-key", {
      gemini_key: apiKey
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to save Gemini API key:", error);
    throw error;
  }
}

// Initialize Gemini client with the provided API key
export function initializeGemini(apiKey: string) {
  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }

  // Initialize with API key
  const genAI = new GoogleGenerativeAI(apiKey);
  
  return genAI;
}

// Generate full article content using Gemini AI
export async function summarizeArticle(article: { title: string; description?: string; content?: string; url?: string }) {
  try {
    // Get the user's API key
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("No Gemini API key found. Please set your API key in the profile settings.");
    }
    
    const genAI = initializeGemini(apiKey);
    // Use the latest model name with the gemini-1.5-pro or gemini-1.0-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are an expert journalist. Based on the title, description, and any available content provided,
      write a well-structured, detailed, and informative news article.
      
      Create a full article with a proper introduction, body, and conclusion. Include analysis and context around the topic.
      Make the content engaging, factual, and in a journalistic style.
      
      Article should be at least 5-6 paragraphs to fully cover the topic. Avoid making up specific facts, quotes, 
      or statistics that aren't clearly implied by the provided information.
      
      Title: ${article.title}
      Description: ${article.description || ""}
      Content: ${article.content || ""}
      URL: ${article.url || ""}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Failed to generate article content:", error);
    throw error;
  }
}

// Check if an API key is valid
export async function validateApiKey(apiKey: string) {
  // Check if the key is empty
  if (!apiKey || apiKey.trim() === '') {
    console.error("API key is empty");
    return false;
  }

  // Google/Gemini API keys typically start with "AIza"
  if (apiKey.startsWith("AIza")) {
    try {
      console.log("Validating Gemini API key...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Simple test prompt with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (increased)
      
      try {
        // Simpler prompt that's less likely to be filtered
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: "Hello" }] }],
        }, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        console.log("API key validation successful");
        return true;
      } catch (genError: any) {
        clearTimeout(timeoutId);
        // Log the complete error for debugging
        console.error("Complete error during API key validation:", genError);
        
        // Some errors might be due to model safety features, not invalid keys
        // Check for safety/blocked errors which happen with valid keys
        if (genError.message && (
            genError.message.includes("safety") || 
            genError.message.includes("blocked") ||
            genError.message.includes("not available") ||
            genError.message.includes("rate limit")
        )) {
          // These errors occur with valid keys but due to content issues
          console.log("API key appears valid but content was filtered");
          return true;
        }
        
        // Check for specific invalid key errors
        if (genError.message && (
            genError.message.includes("API key") || 
            genError.message.includes("invalid") || 
            genError.message.includes("authentication") ||
            genError.message.includes("unauthorized") ||
            genError.message.includes("unauthenticated")
        )) {
          console.error("API key validation failed: Invalid API key", genError);
          return false;
        }
        
        // Network or other errors might not be key-related - assume valid for better UX
        console.error("API key validation error (might be network):", genError);
        return true;
      }
    } catch (error: any) {
      console.error("API key validation error:", error);
      // For serious errors, still allow the key if it starts with AIza
      return true;
    }
  } else {
    console.error("API key doesn't match expected format for Google API keys");
    return false;
  }
}
