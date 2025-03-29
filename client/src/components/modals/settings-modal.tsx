import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { NEWS_CATEGORIES } from "@/lib/constants";
import { getGeminiApiKey, setGeminiApiKey, validateApiKey } from "@/lib/gemini";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get current API key
  const { data: geminiKey, isLoading: isLoadingKey } = useQuery({
    queryKey: ["/api/gemini-key"],
    queryFn: getGeminiApiKey
  });

  // Update API key state when loaded
  useEffect(() => {
    if (geminiKey) {
      setApiKey(geminiKey);
    } else {
      setApiKey("");
    }
  }, [geminiKey]);

  // Get user interests
  const { data: interests, isLoading: isLoadingInterests } = useQuery({
    queryKey: ["/api/interests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/interests");
      const data = await response.json();
      return data.categories as string[];
    }
  });

  // Update interests state when loaded
  useEffect(() => {
    if (interests) {
      setSelectedInterests(interests);
    } else {
      setSelectedInterests([]);
    }
  }, [interests]);

  // Update API key mutation
  const updateApiKeyMutation = useMutation({
    mutationFn: (key: string) => setGeminiApiKey(key),
    onSuccess: () => {
      toast({
        title: "API key updated",
        description: "Your Gemini API key has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gemini-key"] });
    },
    onError: () => {
      toast({
        title: "Failed to update API key",
        description: "There was an error updating your API key. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update interests mutation
  const updateInterestsMutation = useMutation({
    mutationFn: (categories: string[]) => 
      apiRequest("POST", "/api/interests", { categories }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Interests updated",
        description: "Your news interests have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interests"] });
    },
    onError: () => {
      toast({
        title: "Failed to update interests",
        description: "There was an error updating your interests. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle toggle API key visibility
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  // Handle update API key
  const handleUpdateApiKey = async () => {
    if (!apiKey) {
      toast({
        title: "API key required",
        description: "Please enter a valid Gemini API key",
        variant: "destructive"
      });
      return;
    }

    // Basic format validation
    if (!apiKey.startsWith("AIza")) {
      toast({
        title: "Invalid API key format",
        description: "Google API keys typically start with 'AIza'. Please check your key.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Try to validate, but don't block on validation if format is correct
      let isValid = false;
      
      try {
        // Set a timeout to prevent hanging on validation
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error("Validation timed out")), 8000);
        });
        
        // Race between validation and timeout
        isValid = await Promise.race([
          validateApiKey(apiKey),
          timeoutPromise
        ]);
      } catch (validationError) {
        // If validation throws or times out, but the key has the correct format,
        // proceed anyway for better user experience
        console.log("Validation error in settings but continuing:", validationError);
        // If it has correct format, proceed anyway
        if (apiKey.startsWith("AIza") && apiKey.length >= 30) {
          isValid = true; 
        }
      }
      
      if (!isValid) {
        toast({
          title: "Invalid API key",
          description: "The API key provided is not valid. Please check and try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Update the API key if valid
      updateApiKeyMutation.mutate(apiKey);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update the API key. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle interest removal
  const removeInterest = (categoryId: string) => {
    setSelectedInterests(selectedInterests.filter(id => id !== categoryId));
  };

  // Handle update interests
  const handleUpdateInterests = () => {
    if (selectedInterests.length === 0) {
      toast({
        title: "Select at least one interest",
        description: "Please select at least one category that interests you",
        variant: "destructive"
      });
      return;
    }

    updateInterestsMutation.mutate(selectedInterests);
  };

  // Handle edit interests click - open interests editor
  const handleEditInterests = () => {
    // This function would typically open a modal or expand a section
    // For now, we'll just show a toast as this is part of the settings modal already
    toast({
      title: "Edit your interests",
      description: "Remove interests by clicking the X icon, or add more below",
    });
  };

  // Find category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = NEWS_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Get category color by ID
  const getCategoryColor = (categoryId: string) => {
    const category = NEWS_CATEGORIES.find(c => c.id === categoryId);
    return {
      bg: category?.bgColor || "bg-gray-100",
      text: category?.textColor || "text-gray-800"
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your preferences and account settings
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="api-key" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api-key">API Key</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
          </TabsList>
          
          {/* API Key Tab */}
          <TabsContent value="api-key" className="space-y-4 py-4">
            <div>
              <Label htmlFor="settings-api-key">Your Gemini API Key</Label>
              <div className="relative mt-1">
                <Input
                  id="settings-api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10"
                  onClick={toggleApiKeyVisibility}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={handleUpdateApiKey}
              disabled={updateApiKeyMutation.isPending}
            >
              {updateApiKeyMutation.isPending ? "Updating..." : "Update API Key"}
            </Button>
            <div className="text-center text-xs text-gray-500">
              Don't have an API key?{" "}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get one here
              </a>
            </div>
          </TabsContent>
          
          {/* Interests Tab */}
          <TabsContent value="interests" className="space-y-4 py-4">
            <div>
              <Label>Your Selected Categories</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedInterests.map((categoryId) => {
                  const colors = getCategoryColor(categoryId);
                  return (
                    <Badge 
                      key={categoryId} 
                      className={`${colors.bg} ${colors.text} gap-1`}
                    >
                      {getCategoryName(categoryId)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 rounded-full"
                        onClick={() => removeInterest(categoryId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
                {selectedInterests.length === 0 && (
                  <p className="text-sm text-gray-500">No interests selected</p>
                )}
              </div>
            </div>
            
            <div>
              <Label>Add More Categories</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {NEWS_CATEGORIES.map((category) => {
                  const isSelected = selectedInterests.includes(category.id);
                  return (
                    <Button
                      key={category.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`justify-start ${
                        isSelected ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => {
                        if (!isSelected) {
                          setSelectedInterests([...selectedInterests, category.id]);
                        }
                      }}
                      disabled={isSelected}
                    >
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleUpdateInterests}
              disabled={updateInterestsMutation.isPending}
            >
              {updateInterestsMutation.isPending ? "Updating..." : "Update Interests"}
            </Button>
          </TabsContent>
          
          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="cursor-pointer">Dark Mode</Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="compact-view" className="cursor-pointer">Compact View</Label>
              <Switch
                id="compact-view"
                checked={compactView}
                onCheckedChange={setCompactView}
              />
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Account</h3>
              <div>
                <Label htmlFor="account-email">Email Address</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
