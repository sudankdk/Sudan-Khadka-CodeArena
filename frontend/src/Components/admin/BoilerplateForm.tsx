import Editor from "@monaco-editor/react";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { IBoilerplate } from '@/types/problemstest/problemtest';

interface BoilerplateFormProps {
  boilerplates: IBoilerplate[];
  onBoilerplateChange: (index: number, field: keyof IBoilerplate, value: string) => void;
  onAddBoilerplate: () => void;
  onRemoveBoilerplate: (index: number) => void;
}

const SUPPORTED_LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "go", label: "Go" },
];

export const BoilerplateForm = ({
  boilerplates,
  onBoilerplateChange,
  onAddBoilerplate,
  onRemoveBoilerplate
}: BoilerplateFormProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>Boilerplates</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAddBoilerplate}>
          + Add Boilerplate
        </Button>
      </div>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {boilerplates.map((boilerplate, index) => (
          <div key={index} className="p-3 border rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Boilerplate {index + 1}</span>
              {boilerplates.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveBoilerplate(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>
            <div>
              <Label htmlFor={`language-${index}`}>Language</Label>
              <select
                id={`language-${index}`}
                value={boilerplate.Language}
                onChange={(e) => onBoilerplateChange(index, "Language", e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Language</option>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`code-${index}`}>Code</Label>
              <Editor
                height="300px"
                language={boilerplate.Language === "go" ? "go" : boilerplate.Language === "python" ? "python" : "javascript"}
                value={boilerplate.code}
                theme="vs-dark"
                onChange={(value) => onBoilerplateChange(index, "code", value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};