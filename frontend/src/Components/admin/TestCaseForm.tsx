import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import type { ITestCase } from "@/Interfaces/problemstest/problemtest";

interface TestCaseFormProps {
  testCases: ITestCase[];
  onTestCaseChange: (index: number, field: keyof ITestCase, value: string) => void;
  onAddTestCase: () => void;
  onRemoveTestCase: (index: number) => void;
}

export const TestCaseForm = ({ 
  testCases, 
  onTestCaseChange, 
  onAddTestCase, 
  onRemoveTestCase 
}: TestCaseFormProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>Test Cases</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAddTestCase}>
          + Add Test Case
        </Button>
      </div>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {testCases.map((testCase, index) => (
          <div key={index} className="p-3 border rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Test Case {index + 1}</span>
              {testCases.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveTestCase(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>
            <Input
              placeholder="Input (e.g., [2,7,11,15], 9)"
              value={testCase.input}
              onChange={(e) => onTestCaseChange(index, "input", e.target.value)}
              required
            />
            <Input
              placeholder="Expected output (e.g., [0,1])"
              value={testCase.expected}
              onChange={(e) => onTestCaseChange(index, "expected", e.target.value)}
              required
            />
          </div>
        ))}
      </div>
    </div>
  );
};
