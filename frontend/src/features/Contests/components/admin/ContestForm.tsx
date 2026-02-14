import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { ICreateContest } from '@/types/contest/contest';

interface ContestFormProps {
  onSubmit: (contest: ICreateContest) => void;
  isLoading?: boolean;
}

export const ContestForm = ({ onSubmit, isLoading }: ContestFormProps) => {
  const [formData, setFormData] = useState<ICreateContest>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    is_rated: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert datetime-local format to ISO 8601 with timezone
    const formattedData: ICreateContest = {
      ...formData,
      start_time: formData.start_time ? `${formData.start_time}:00Z` : '',
      end_time: formData.end_time ? `${formData.end_time}:00Z` : '',
    };
    
    onSubmit(formattedData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          Contest Title
        </Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Weekly Code Challenge #1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          placeholder="Describe the contest objectives and rules..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">
            Start Time
          </Label>
          <Input
            id="start_time"
            name="start_time"
            type="datetime-local"
            value={formData.start_time}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">
            End Time
          </Label>
          <Input
            id="end_time"
            name="end_time"
            type="datetime-local"
            value={formData.end_time}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Switch
          id="is_rated"
          checked={formData.is_rated}
          onCheckedChange={(checked: boolean) =>
            setFormData((prev) => ({ ...prev, is_rated: checked }))
          }
        />
        <Label htmlFor="is_rated" className="cursor-pointer">
          Rated Contest (affects global leaderboard)
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Creating Contest...' : 'Create Contest'}
      </Button>
    </form>
  );
};
