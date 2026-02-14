import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { IAddProblemToContest } from '@/types/contest/contest';
import { useQuery } from '@tanstack/react-query';
import { getProblemTests } from '@/services/auth/api/problemtest';

interface AddProblemFormProps {
  onSubmit: (problem: IAddProblemToContest) => void;
  isLoading?: boolean;
}

export const AddProblemForm = ({ onSubmit, isLoading }: AddProblemFormProps) => {
  const [formData, setFormData] = useState<IAddProblemToContest>({
    problem_title: '',
    max_points: 100,
    time_penalty_minutes: 5,
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Fetch problems for suggestions
  const { data: problemsData } = useQuery({
    queryKey: ['problems-search', debouncedSearch],
    queryFn: () => getProblemTests(1, 10, debouncedSearch),
    enabled: debouncedSearch.length > 0,
  });
  
  const suggestions = problemsData?.problems || [];
  
  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form after submission
    setFormData({
      problem_title: '',
      max_points: 100,
      time_penalty_minutes: 5,
    });
    setSearchTerm('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'problem_title' ? value : Number(value),
    }));
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFormData((prev) => ({ ...prev, problem_title: value }));
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };
  
  const handleSelectSuggestion = (title: string) => {
    setFormData((prev) => ({ ...prev, problem_title: title }));
    setSearchTerm(title);
    setShowSuggestions(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex].main_heading);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2 relative">
        <Label htmlFor="problem_title">
          Problem Title
        </Label>
        <Input
          id="problem_title"
          name="problem_title"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          required
          placeholder="Type to search problems..."
          autoComplete="off"
        />
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((problem, index) => (
              <button
                key={problem.id}
                type="button"
                onClick={() => handleSelectSuggestion(problem.main_heading)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-0 transition-colors ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {problem.main_heading}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    problem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {problem.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {showSuggestions && debouncedSearch && suggestions.length === 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500"
          >
            No problems found
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_points">
            Max Points
          </Label>
          <Input
            id="max_points"
            name="max_points"
            type="number"
            min="1"
            value={formData.max_points}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time_penalty_minutes">
            Time Penalty (min)
          </Label>
          <Input
            id="time_penalty_minutes"
            name="time_penalty_minutes"
            type="number"
            min="0"
            value={formData.time_penalty_minutes}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Adding Problem...' : 'Add Problem'}
      </Button>
    </form>
  );
};
