import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { NEWS_CATEGORIES } from "@/lib/constants";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  userCategories: string[];
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  userCategories,
}: CategoryFilterProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all standard categories from constants
  const standardCategories = NEWS_CATEGORIES.map(category => category.id);
  
  // Split user categories into standard and custom
  const userStandardCategories = userCategories.filter(cat => standardCategories.includes(cat));
  const userCustomCategories = userCategories.filter(cat => !standardCategories.includes(cat));
  
  // Get displayed standard categories
  const displayedStandardCategories = NEWS_CATEGORIES.filter(
    (category) => userStandardCategories.includes(category.id)
  );

  // Add custom category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Add the new category to the user's interests
      const updatedCategories = [...userCategories, newCategory.toLowerCase()];
      
      await apiRequest("PUT", "/api/interests", {
        categories: updatedCategories
      });
      
      // Refresh interests data
      queryClient.invalidateQueries({ queryKey: ["/api/interests"] });
      
      toast({
        title: "Custom interest added",
        description: `Added "${newCategory}" to your interests`,
      });
      
      // Close dialog and reset state
      setNewCategory("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to add custom interest:", error);
      toast({
        title: "Failed to add interest",
        description: "Could not add custom interest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-500">Filter by category</h3>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary/80"
          onClick={() => setIsDialogOpen(true)}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Custom
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "secondary"}
          className={`rounded-full text-sm ${
            selectedCategory === null ? "" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
          }`}
          onClick={() => onCategoryChange(null)}
        >
          All
        </Button>
        
        {/* Standard Categories */}
        {displayedStandardCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "secondary"}
            className={`rounded-full text-sm ${
              selectedCategory === category.id
                ? ""
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </Button>
        ))}
        
        {/* Custom Categories */}
        {userCustomCategories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "secondary"}
            className={`rounded-full text-sm ${
              selectedCategory === category
                ? "bg-indigo-500" // Custom color for custom categories
                : "bg-indigo-100 hover:bg-indigo-200 text-indigo-800"
            }`}
            onClick={() => onCategoryChange(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>
      
      {/* Add Custom Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Interest</DialogTitle>
            <DialogDescription>
              Enter a custom topic you're interested in. This will be used to personalize your news feed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="E.g., AI, space, cybersecurity"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="mb-2"
            />
            <p className="text-xs text-gray-500">
              Custom interests help our AI find more relevant content specifically for you.
            </p>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddCategory}
              disabled={!newCategory.trim() || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Interest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
