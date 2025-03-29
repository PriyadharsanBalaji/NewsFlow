import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NEWS_CATEGORIES } from "@/lib/constants";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterestSelectionProps {
  selectedInterests: string[];
  onInterestSelect: (interests: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function InterestSelection({
  selectedInterests,
  onInterestSelect,
  onNext,
  onPrev,
}: InterestSelectionProps) {
  const [interests, setInterests] = useState<string[]>(selectedInterests);
  const { toast } = useToast();

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setInterests((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      } else {
        return [...current, categoryId];
      }
    });
  };

  // Handle continue button click
  const handleContinue = () => {
    if (interests.length === 0) {
      toast({
        title: "Select at least one interest",
        description: "Please select at least one category that interests you",
        variant: "destructive",
      });
      return;
    }

    onInterestSelect(interests);
    onNext();
  };

  return (
    <div className="flex-grow flex flex-col p-4">
      <div className="max-w-4xl w-full mx-auto space-y-6 py-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">What are you interested in?</h2>
          <p className="text-lg text-gray-600 mt-2">
            Select topics that matter to you. We'll use these to personalize your news feed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {NEWS_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                interests.includes(category.id) 
                  ? "border-primary bg-blue-50" 
                  : "border-gray-200 hover:border-primary hover:bg-blue-50"
              }`}
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <i className={`fas fa-${category.icon} ${category.color} text-xl`}></i>
                  <h3 className="text-lg font-medium text-gray-800 ml-3">
                    {category.name}
                  </h3>
                </div>
                <div className={`h-5 w-5 border-2 rounded-md flex items-center justify-center ${
                  interests.includes(category.id) 
                    ? "border-primary" 
                    : "border-gray-300"
                }`}>
                  {interests.includes(category.id) && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={onPrev}
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
