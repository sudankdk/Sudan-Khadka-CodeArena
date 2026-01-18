import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { TestCaseForm } from "./TestCaseForm";
import { BoilerplateForm } from "./BoilerplateForm";
import type { IProblemTest, ITestCase, IBoilerplate } from "@/Interfaces/problemstest/problemtest";

interface CreateProblemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData: IProblemTest;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTestCaseChange: (index: number, field: keyof ITestCase, value: string) => void;
  onAddTestCase: () => void;
  onRemoveTestCase: (index: number) => void;
  onBoilerplateChange: (index: number, field: keyof IBoilerplate, value: string) => void;
  onAddBoilerplate: () => void;
  onRemoveBoilerplate: (index: number) => void;
}

export const CreateProblemDialog = ({
  isOpen,
  onClose,
  formData,
  loading,
  onSubmit,
  onInputChange,
  onTestCaseChange,
  onAddTestCase,
  onRemoveTestCase,
  onBoilerplateChange,
  onAddBoilerplate,
  onRemoveBoilerplate
}: CreateProblemDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Problem</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">

          <div>
            <Label htmlFor="main_heading">Problem Title</Label>
            <Input
              id="main_heading"
              name="main_heading"
              value={formData.main_heading}
              onChange={onInputChange}
              placeholder="e.g., Two Sum"
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={onInputChange}
              placeholder="e.g., two-sum"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              placeholder="Problem description..."
              rows={4}
              required
            />
          </div>

          <BoilerplateForm
            boilerplates={formData.boilerplate}
            onBoilerplateChange={onBoilerplateChange}
            onAddBoilerplate={onAddBoilerplate}
            onRemoveBoilerplate={onRemoveBoilerplate}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tag">Tag</Label>
              <Input
                id="tag"
                name="tag"
                value={formData.tag}
                onChange={onInputChange}
                placeholder="e.g., arrays"
                required
              />
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={onInputChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <TestCaseForm
            testCases={formData.test_cases}
            onTestCaseChange={onTestCaseChange}
            onAddTestCase={onAddTestCase}
            onRemoveTestCase={onRemoveTestCase}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Problem"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
