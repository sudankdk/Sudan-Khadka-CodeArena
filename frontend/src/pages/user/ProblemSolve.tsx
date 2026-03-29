import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { getProblemTestBySlug } from "@/services/auth/api/problemtest";
import { useExecuteCode } from "@/features/Problems/hooks/useExecute";
import { useCreateSubmission } from "@/hooks/useSubmissions";
import { useHint } from "@/hooks/useHint";
import { SubmissionStatus } from "@/types/submission/submission";

const ProblemSolve = () => {
  const { id, contestId } = useParams();
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(defaultCode["python"]);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [problem, setProblem] = useState<any>(null);
  const [hintLevel, setHintLevel] = useState(0);

  const languages = [
    { id: "python", name: "python" },
    { id: "javascript", name: "js" },
    { id: "go", name: "go" },
  ];

  const executeMutation = useExecuteCode();
  const createSubmissionMutation = useCreateSubmission();
  const hintMutation = useHint();

  const testCases =
    problem?.test_cases?.length
      ? problem.test_cases
      : problem?.testcases?.length
        ? problem.testcases
        : fallbackTestCases;

  const currentTestCase = testCases[activeTestCase] || testCases[0];

  const getApiLanguage = (lang: string) => {
    if (lang === 'python') return 'python';
    if (lang === 'javascript') return 'js';
    return lang; // go remains go
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const apiLang = getApiLanguage(lang);
    const boilerplate = problem?.boilerplates?.find((b: any) => b.language === apiLang);
    setCode(boilerplate?.[0]?.code || defaultCode[lang as keyof typeof defaultCode] || "");
  };

  const getExpectedValue = (testCase: any) =>
    testCase?.expected ?? testCase?.output ?? testCase?.expected_output ?? testCase?.output_expected ?? "";

  const loadProblem = async () => {
    if (!id) return;
    try {
      const result = await getProblemTestBySlug(id);
      setProblem(result);
      const apiLang = getApiLanguage(language);
      console.log(apiLang)
      const boilerplate = result?.boilerplates?.find((b: any) => b.language === apiLang);
      if (boilerplate?.code) {
        console.log("Setting boilerplate code for language:", boilerplate.code);
        setCode(boilerplate.code);
      }
    } catch (error) {
      setOutput("Failed to load problem. Please try again.");
    }
  };

  useEffect(() => {
    loadProblem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!problem) return;
    const apiLang = getApiLanguage(language);
    const boilerplate = problem?.boilerplates?.find((b: any) => b.language === apiLang);
    setCode(boilerplate?.code || defaultCode[language as keyof typeof defaultCode] || "");
  }, [problem, language]);

  const handleGetHint = async () => {
    if (!problem?.id) {
      setOutput("ERROR: Problem data not loaded");
      return;
    }
    
    const nextLevel = hintLevel + 1;
    if (nextLevel > 3) {
      setOutput("⚠️ No more hints available for this problem");
      return;
    }

    try {
      setIsRunning(true);
      const result = await hintMutation.mutateAsync({
        problem_title: problem.main_heading || "",
        problem_desc: problem.description || "",
        difficulty: problem.difficulty || "medium",
        user_code: code,
        hint_level: nextLevel,
      });
      
      setHintLevel(nextLevel);
      setOutput(`💡 HINT (Level ${nextLevel})\n\n${result.hint}`);
    } catch (error: any) {
      if (error.message.includes("rate limit") || error.message.includes("cooldown")) {
        setOutput(`⏱️ ${error.message}`);
      } else {
        setOutput("ERROR: Failed to generate hint. Please try again.");
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem?.id) {
      setOutput("ERROR: Problem data not loaded");
      return;
    }

    if (!testCases.length) {
      setOutput("ERROR: No test cases available to submit.");
      return;
    }

    setIsRunning(true);
    
    try {
      let passedCount = 0;
      let failedTestCase = -1;
      let executionTime = 0;
      let memoryUsed = 0;

      // Run all test cases
      for (let i = 0; i < testCases.length; i++) {
        const result = await executeMutation.mutateAsync({
          language,
          code,
          stdin: testCases[i].input ?? testCases[i].stdin ?? ""
        });
        
        // Use Judge0 metrics if available, fallback to manual if none
        executionTime += result.time || 0;
        memoryUsed = Math.max(memoryUsed, result.memory || 0);

        if (result.stderr && result.stderr.trim()) {
          throw new Error(`Runtime error in test case ${i + 1}: ${result.stderr}`);
        }

        const trimmedStdout = result.stdout.trim();
        const trimmedExpected = getExpectedValue(testCases[i]).trim();
        
        if (trimmedStdout === trimmedExpected) {
          passedCount++;
        } else {
          if (failedTestCase === -1) failedTestCase = i;
        }
      }

      const totalTestCases = testCases.length;
      const allPassed = passedCount === totalTestCases;
      const status = allPassed ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;

      const submissionResult = await createSubmissionMutation.mutateAsync({
        problem_id: problem.id,
        contest_id: contestId || null,
        language: language === 'python' ? 'py' : language === 'javascript' ? 'js' : language,
        code,
        status,
        execution_time: Math.round(executionTime),
        memory_used: Math.round(memoryUsed),
        test_cases_passed: passedCount,
        total_test_cases: totalTestCases,
      });

      if (allPassed) {
        const points = submissionResult?.points_earned;
        const resultMessage = [
          "✓ ACCEPTED",
          `All ${totalTestCases} test cases passed!`,
          `Execution Time: ${Math.round(executionTime)}ms`,
          memoryUsed > 0 ? `Memory: ${Math.round(memoryUsed)} KB` : "",
          points !== undefined ? `Points Earned: ${points}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");
        setOutput(resultMessage);
      } else {
        setOutput(`✗ WRONG ANSWER\n\nPassed: ${passedCount}/${totalTestCases} test cases\n\nFailed at test case ${failedTestCase + 1}`);
      }
    } catch (error: any) {
      if (problem?.id) {
        await createSubmissionMutation.mutateAsync({
          problem_id: problem.id,
          contest_id: contestId || null,
          language: language === 'python' ? 'py' : language === 'javascript' ? 'js' : language,
          code,
          status: SubmissionStatus.RUNTIME_ERROR,
          test_cases_passed: 0,
          total_test_cases: testCases.length,
          error_message: error.message,
        });
      }
      setOutput("ERROR: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] text-gray-100 p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2 border-b border-[#333] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/problems" className="text-sm text-gray-400 hover:text-white transition-colors">← Back</Link>
            <span className="text-[#F7D046] font-bold tracking-wider">CODE<span className="text-[#E54B4B]">ARENA</span></span>
          </div>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                className={`px-3 py-1 text-[10px] font-mono tracking-widest transition-all ${language === lang.id
                  ? "bg-[#4ECDC4] text-black"
                  : "text-gray-400 border border-[#333] hover:border-[#4ECDC4]"
                  }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">{problem?.main_heading || "Loading problem..."}</h1>
          <p className="text-sm text-gray-400 whitespace-pre-line mt-1">{problem?.description || ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[70vh]">
        <div className="flex flex-col border border-dashed border-[#333] rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-dashed border-[#333]">
            <span className="text-[10px] tracking-widest text-gray-400">TEST CASES</span>
            <div className="flex gap-2">
              {testCases.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestCase(idx)}
                  className={`px-3 py-1 text-[10px] font-mono tracking-widest transition-all ${activeTestCase === idx
                    ? "bg-[#F7D046] text-black"
                    : "text-gray-400 border border-[#333] hover:border-[#F7D046]"
                    }`}
                >
                  CASE {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-3 space-y-3 overflow-y-auto">
            <div>
              <p className="text-[10px] text-gray-500 tracking-widest mb-1">INPUT</p>
              <textarea
                value={currentTestCase?.input ?? currentTestCase?.stdin ?? ""}
                readOnly
                className="w-full bg-[#1a1a1a] border border-[#333] p-3 text-[#4ECDC4] text-sm font-mono resize-none h-28"
              />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 tracking-widest mb-1">EXPECTED</p>
              <textarea
                value={getExpectedValue(currentTestCase)}
                readOnly
                className="w-full bg-[#1a1a1a] border border-[#333] p-3 text-gray-200 text-sm font-mono resize-none h-24"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col border border-dashed border-[#333] rounded-md min-h-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-dashed border-[#333]">
            <span className="text-[10px] tracking-widest text-gray-400">EDITOR</span>
            <div className="flex gap-2">
              <button
                onClick={handleGetHint}
                disabled={isRunning || hintLevel >= 3}
                title={hintLevel >= 3 ? "No more hints available" : "Get an AI hint"}
                className="px-4 py-1 border border-[#E54B4B] text-[#E54B4B] text-[10px] tracking-widest hover:bg-[#E54B4B] hover:text-black transition-colors disabled:opacity-50"
              >
                {isRunning ? "WAITING..." : `💡 HINT (${hintLevel}/3)`}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning}
                className="px-4 py-1 bg-[#F7D046] text-black text-[10px] font-bold tracking-widest hover:bg-[#f5c518] transition-colors disabled:opacity-50"
              >
                {isRunning ? "SUBMITTING..." : "SUBMIT"}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language}
              value={code || ""}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "JetBrains Mono, Fira Code, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbers: "on",
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: "line",
                cursorBlinking: "smooth",
                automaticLayout: true,
              }}
            />
          </div>

          <div className="h-40 border-t border-dashed border-[#333] p-3 overflow-y-auto bg-[#0f0f0f]">
            {isRunning ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-xs tracking-widest">EXECUTING...</p>
              </div>
            ) : output ? (
              <pre className={`text-sm font-mono whitespace-pre-wrap ${output.includes("ACCEPTED") ? "text-[#4ECDC4]" : "text-gray-200"}`}>
                {output}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-xs tracking-widest">Run your code to see output</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Default code templates
const defaultCode: Record<string, string> = {
  python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # YOUR CODE HERE ♛
        # "I START A PICTURE AND I FINISH IT"
        
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        
        return []
`,
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // YOUR CODE HERE ♛
    // "I START A PICTURE AND I FINISH IT"
    
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    
    return [];
};
`,
  go: `func twoSum(nums []int, target int) []int {
    // YOUR CODE HERE ♛
    // "I START A PICTURE AND I FINISH IT"
    
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    
    return []int{}
}
`,
  cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
      // YOUR CODE HERE ♛
      // "I START A PICTURE AND I FINISH IT"
        
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        
        return {};
    }
};
`,
};

const fallbackTestCases = [
  { input: "[2,7,11,15]\n9", expected: "[0,1]" },
  { input: "[3,2,4]\n6", expected: "[1,2]" },
  { input: "[3,3]\n6", expected: "[0,1]" },
];

export default ProblemSolve;
