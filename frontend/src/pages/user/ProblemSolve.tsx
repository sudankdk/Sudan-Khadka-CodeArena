import { useEffect, useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useAuth } from "@/services/auth/hook/useAuth";
import useAuthStore from "@/services/auth/store/auth.store";
import { Icons } from '@/constants/Icons';
import { getProblemTestBySlug } from "@/services/auth/api/problemtest";
import { useExecuteCode } from "@/features/Problems/hooks/useExecute";
import { useCreateSubmission, useProblemStats, useSubmissions } from "@/hooks/useSubmissions";
import { SubmissionStatus } from "@/types/submission/submission";
import { useContestProblems } from "@/features/Contests/hooks/useContests";

const ProblemSolve = () => {
  const { id, contestId } = useParams(); // Extract both problem slug and contestId
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("DESCRIPTION");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(defaultCode["python"]);
  const [testTab, setTestTab] = useState("TESTCASE");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [data, setData] = useState<any>(null);

  // Check if this is a contest problem
  const isContestProblem = !!contestId;

  // Fetch contest problems if this is a contest problem
  const { data: contestProblems = [] } = useContestProblems(contestId || '');
  
  // Find the max points for this problem in the contest
  const contestProblem = contestProblems.find((cp: any) => cp.problem?.slug === id);
  const maxPoints = contestProblem?.max_points || 0;

  const tabs = ["DESCRIPTION", "SOLUTIONS", "SUBMISSIONS"];
  const languages = [
    { id: "python", name: "py" },
    { id: "javascript", name: "js" },
    { id: "go", name: "go" },
  ];

  const problemsTestCase = async () => {
    try {
      if (!id) return;
      const result = await getProblemTestBySlug(id);
      setData(result);
      console.log("Problem Data:", result);
    } catch (e) {
      console.error("Failed to fetch problem data:", e);
    }
  }

  // Mock problem data - replaced with API data
  // const problem = { ... };

  const testCases = data?.test_cases || [
    { input: "[2,7,11,15]\n9", expected: "[0,1]" },
    { input: "[3,2,4]\n6", expected: "[1,2]" },
    { input: "[3,3]\n6", expected: "[0,1]" },
  ];

  const getApiLanguage = (lang: string) => {
    if (lang === 'python') return 'py';
    if (lang === 'javascript') return 'js';
    return lang; // go remains go
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const apiLang = getApiLanguage(lang);
    const boilerplate = data?.boilerplates?.find((b: any) => b.language === apiLang);
    setCode(boilerplate?.code || defaultCode[lang as keyof typeof defaultCode] || "");
  };

  // const handleRun = () => {
  //   setIsRunning(true);
  //   setTestTab("OUTPUT");
  //   // Simulate running code
  //   setTimeout(() => {
  //     setOutput("Output: [0, 1]\n\nRuntime: 45ms\nMemory: 14.2 MB");
  //     setIsRunning(false);
  //   }, 1500);
  // };

  const executeMutation = useExecuteCode();
  const createSubmissionMutation = useCreateSubmission();
  const { data: problemStats } = useProblemStats(data?.id || "");
  const { data: submissionsData } = useSubmissions(1, 20, { 
    problem_id: data?.id,
    user_id: user?.id 
  });

  const handleRun = async () => {
    setIsRunning(true);
    setTestTab("OUTPUT");
    try {
      const result = await executeMutation.mutateAsync({
        language,
        code,
        stdin: testCases[activeTestCase].input
      });
      
      // Check for errors in stderr
      if (result.stderr && result.stderr.trim()) {
        setOutput(`Test Case ${activeTestCase + 1} - Error:\n\n${result.stderr}\n\nOutput:\n${result.stdout || 'No output'}`);
      } else {
        setOutput(`Test Case ${activeTestCase + 1} Output:\n\n${result.stdout}\n\nExpected:\n${testCases[activeTestCase].expected}`);
      }
    } catch (error: any) {
      setOutput("ERROR: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!data?.id) {
      setOutput("ERROR: Problem data not loaded");
      return;
    }

    setIsRunning(true);
    setTestTab("OUTPUT");
    
    try {
      let passedCount = 0;
      let failedTestCase = -1;
      let executionTime = 0;

      // Run all test cases
      for (let i = 0; i < testCases.length; i++) {
        const startTime = performance.now();
        const result = await executeMutation.mutateAsync({
          language,
          code,
          stdin: testCases[i].input
        });
        const endTime = performance.now();
        executionTime += (endTime - startTime);

        // Check for runtime errors
        if (result.stderr && result.stderr.trim()) {
          throw new Error(`Runtime error in test case ${i + 1}: ${result.stderr}`);
        }

        const trimmedStdout = result.stdout.trim();
        const trimmedExpected = testCases[i].expected.trim();
        
        if (trimmedStdout === trimmedExpected) {
          passedCount++;
        } else {
          if (failedTestCase === -1) failedTestCase = i;
        }
      }

      const totalTestCases = testCases.length;
      const allPassed = passedCount === totalTestCases;
      const status = allPassed ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;

      // Create submission record
      const submissionResult = await createSubmissionMutation.mutateAsync({
        problem_id: data.id,
        contest_id: isContestProblem ? contestId : null, // Include contest_id for contest submissions
        language: language === 'python' ? 'py' : language === 'javascript' ? 'js' : language,
        code,
        status,
        execution_time: Math.round(executionTime),
        test_cases_passed: passedCount,
        total_test_cases: totalTestCases,
      });

      // Display result
      if (allPassed) {
        let resultMessage = `✓ ACCEPTED\n\nAll ${totalTestCases} test cases passed!\n\nExecution Time: ${Math.round(executionTime)}ms`;
        
        // Show points for contest submissions
        if (isContestProblem && submissionResult?.points_earned !== undefined) {
          resultMessage += `\n\n🏆 Points Earned: ${submissionResult.points_earned}`;
        }
        
        setOutput(resultMessage);
      } else {
        setOutput(`✗ WRONG ANSWER\n\nPassed: ${passedCount}/${totalTestCases} test cases\n\nFailed at test case ${failedTestCase + 1}`);
      }
    } catch (error: any) {
      // Save failed submission
      if (data?.id) {
        await createSubmissionMutation.mutateAsync({
          problem_id: data.id,
          contest_id: isContestProblem ? contestId : null, // Include contest_id for contest submissions
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

  const getDifficultyColor = (difficulty?: string) => {
    if (difficulty === "easy") return "text-[#4ECDC4] border-[#4ECDC4]";
    if (difficulty === "medium") return "text-[#F7D046] border-[#F7D046]";
    return "text-[#E54B4B] border-[#E54B4B]";
  };

  useEffect(() => {
    problemsTestCase();
  }, [id])

  useEffect(() => {
    const apiLang = getApiLanguage(language);
    const boilerplate = data?.boilerplates?.find((b: any) => b.language === apiLang);
    if (boilerplate?.code) {
      setCode(boilerplate.code);
    }
  }, [data, language]);

  return (
    <div className="h-screen w-full bg-[#0d0d0d] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-12 bg-[#0d0d0d] border-b-2 border-dashed border-[#333] px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <NavLink to="/problems" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
            <span>←</span>
            <span className="text-[#F7D046] font-bold tracking-wider">CODE<span className="text-[#E54B4B]">ARENA</span></span>
          </NavLink>
          <div className="h-4 w-px bg-[#333]"></div>
          <NavLink to="/problems" className="text-gray-500 text-xs tracking-widest hover:text-white transition-colors">
            PROBLEMS
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-600 tracking-widest">♛ SAMO©</span>
          <div className="h-4 w-px bg-[#333]"></div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 border border-[#F7D046] flex items-center justify-center text-[#F7D046] text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-xs text-gray-400 font-mono">{user?.username || "USER"}</span>
          </div>
          <button onClick={logout} className="text-[#E54B4B] hover:text-white transition-colors">
            <Icons.Logout className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {/* Problem Header Bar */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-dashed border-[#333] flex-shrink-0">
          <div className="flex items-center gap-4">
            <NavLink 
              to={isContestProblem ? `/contests/${contestId}` : "/problems"} 
              className="text-gray-500 hover:text-white transition-colors"
            >
              ← BACK
            </NavLink>
            <div className="flex items-center gap-3">
              {/* <span className="text-gray-500 font-mono">{data?.id || '1'}.</span> */}
              <h1 className="text-white font-bold tracking-wider">{data?.main_heading || 'Loading...'}</h1>
              <span className={`px-2 py-1 text-[10px] tracking-widest border ${getDifficultyColor(data?.difficulty)}`}>
                {data?.difficulty || 'UNKNOWN'}
              </span>
              {isContestProblem && (
                <>
                  <span className="px-2 py-1 text-[10px] tracking-widest border-2 border-[#F7D046] bg-[#F7D046]/10 text-[#F7D046]">
                    CONTEST
                  </span>
                  {maxPoints > 0 && (
                    <span className="px-2 py-1 text-[10px] tracking-widest border-2 border-[#4ECDC4] bg-[#4ECDC4]/10 text-[#4ECDC4]">
                      MAX: {maxPoints} PTS
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>♥ {data?.likes || 0}</span>
              <span>|</span>
              <span>↓ {data?.dislikes || 0}</span>
              {problemStats && (
                <>
                  <span>|</span>
                  <span className="text-[#4ECDC4]">
                    {problemStats.acceptance_rate.toFixed(1)}% acceptance
                  </span>
                </>
              )}
            </div>
            <span className="text-[10px] text-gray-600 tracking-widest">© SAMO</span>
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left Panel - Problem Description */}
          <div className="w-1/2 flex flex-col border-2 border-dashed border-[#333] overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b-2 border-dashed border-[#333]">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-[10px] font-mono tracking-widest transition-all ${activeTab === tab
                    ? "bg-[#F7D046] text-black"
                    : "text-gray-500 hover:text-white"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "DESCRIPTION" && (
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                      {data?.description}
                    </p>
                  </div>

                  {/* Examples
                  <div className="space-y-4">
                    {problem.examples.map((ex, idx) => (
                      <div key={idx} className="border border-[#333] p-3">
                        <p className="text-[10px] text-gray-600 tracking-widest mb-2">EXAMPLE {idx + 1}</p>
                        <div className="space-y-2 font-mono text-sm">
                          <div>
                            <span className="text-gray-500">Input: </span>
                            <span className="text-[#4ECDC4]">{ex.input}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Output: </span>
                            <span className="text-white">{ex.output}</span>
                          </div>
                          {ex.explanation && (
                            <div>
                              <span className="text-gray-500">Explanation: </span>
                              <span className="text-gray-400">{ex.explanation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Constraints */}
                  {/* <div>
                    <p className="text-[10px] text-gray-600 tracking-widest mb-2">CONSTRAINTS ®</p>
                    <ul className="space-y-1">
                      {problem.constraints.map((c, idx) => (
                        <li key={idx} className="text-gray-400 text-sm font-mono">
                          • <code className="text-[#E54B4B]">{c}</code>
                        </li>
                      ))}
                    </ul>
                  </div> } */}

                  {/* Tags */}
                  <div>
                    <p className="text-[10px] text-gray-600 tracking-widest mb-2">TOPICS</p>
                    <div className="flex gap-2">

                      <span
                        className="px-2 py-1 border border-[#4ECDC4] text-[#4ECDC4] text-[10px] tracking-widest"
                      >
                        {data?.tag}
                      </span>

                    </div>
                  </div>

                  {/* Companies */}
                  {/* <div>
                    <p className="text-[10px] text-gray-600 tracking-widest mb-2">COMPANIES ™</p>
                    <div className="flex gap-2">
                      {problem.companies.map((company) => (
                        <span
                          key={company}
                          className="px-2 py-1 border border-[#333] text-gray-500 text-[10px] tracking-widest"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div> */}
                </div>
              )}

              {activeTab === "SOLUTIONS" && (
                <div className="text-center py-10">
                  <p className="text-4xl mb-4">📖</p>
                  <p className="text-gray-500 text-xs tracking-widest">COMMUNITY SOLUTIONS</p>
                  <p className="text-gray-600 text-[10px] mt-2">COMING SOON</p>
                </div>
              )}

              {activeTab === "SUBMISSIONS" && (
                <div>
                  {submissionsData && submissionsData.data.length > 0 ? (
                    <div className="space-y-2">
                      {submissionsData.data.map((submission) => (
                        <div
                          key={submission.id}
                          className="border border-[#333] p-3 hover:border-[#F7D046] transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`text-sm ${
                                submission.status === 'accepted' ? 'text-[#4ECDC4]' : 
                                submission.status === 'wrong_answer' ? 'text-[#E54B4B]' : 
                                'text-[#F7D046]'
                              }`}>
                                {submission.status === 'accepted' ? '✓' : 
                                 submission.status === 'wrong_answer' ? '✗' : '◐'}
                              </span>
                              <span className="text-xs text-white font-mono tracking-widest">
                                {submission.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-600">
                              {new Date(submission.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-gray-500">
                            <span>LANG: {submission.language.toUpperCase()}</span>
                            <span>|</span>
                            <span>PASSED: {submission.test_cases_passed}/{submission.total_test_cases}</span>
                            {submission.execution_time && (
                              <>
                                <span>|</span>
                                <span>{submission.execution_time}ms</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-4xl mb-4">📜</p>
                      <p className="text-gray-500 text-xs tracking-widest">YOUR SUBMISSIONS</p>
                      <p className="text-gray-600 text-[10px] mt-2">NO SUBMISSIONS YET</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="w-1/2 flex flex-col gap-4 min-h-0">
            {/* Editor Section */}
            <div className="flex-1 flex flex-col border-2 border-dashed border-[#333] min-h-0">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b-2 border-dashed border-[#333]">
                <div className="flex gap-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`px-3 py-1 text-[10px] font-mono tracking-widest transition-all ${language === lang.id
                        ? "bg-[#4ECDC4] text-black"
                        : "text-gray-500 hover:text-white border border-[#333] hover:border-[#4ECDC4]"
                        }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 text-gray-500 text-[10px] tracking-widest hover:text-white transition-colors">
                    ↻ RESET
                  </button>
                  <button className="px-2 py-1 text-gray-500 text-[10px] tracking-widest hover:text-white transition-colors">
                    ⚙ SETTINGS
                  </button>
                </div>
              </div>

              {/* Monaco Editor */}
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
            </div>

            {/* Test Cases Section */}
            <div className="h-48 flex flex-col border-2 border-dashed border-[#333]">
              {/* Test Tabs */}
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#333]">
                <div className="flex">
                  <button
                    onClick={() => setTestTab("TESTCASE")}
                    className={`px-4 py-2 text-[10px] font-mono tracking-widest transition-all ${testTab === "TESTCASE" ? "bg-[#333] text-white" : "text-gray-500 hover:text-white"
                      }`}
                  >
                    TESTCASE
                  </button>
                  <button
                    onClick={() => setTestTab("OUTPUT")}
                    className={`px-4 py-2 text-[10px] font-mono tracking-widest transition-all ${testTab === "OUTPUT" ? "bg-[#333] text-white" : "text-gray-500 hover:text-white"
                      }`}
                  >
                    OUTPUT
                  </button>
                </div>
                <div className="flex gap-2 pr-2">
                  <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="px-4 py-1 border-2 border-[#4ECDC4] text-[#4ECDC4] text-[10px] tracking-widest hover:bg-[#4ECDC4] hover:text-black transition-colors disabled:opacity-50"
                  >
                    {isRunning ? "RUNNING..." : "▶ RUN"}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isRunning}
                    className="px-4 py-1 bg-[#F7D046] text-black text-[10px] font-bold tracking-widest hover:bg-[#f5c518] transition-colors disabled:opacity-50"
                  >
                    {isRunning ? "SUBMITTING..." : "SUBMIT ⚡"}
                  </button>
                </div>
              </div>

              {/* Test Content */}
              <div className="flex-1 overflow-y-auto p-3">
                {testTab === "TESTCASE" && (
                  <div>
                    {/* Test Case Tabs */}
                    <div className="flex gap-2 mb-3">
                      {(data?.test_cases || testCases).map((_: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTestCase(idx)}
                          className={`px-3 py-1 text-[10px] font-mono tracking-widest transition-all ${activeTestCase === idx
                            ? "bg-[#F7D046] text-black"
                            : "text-gray-500 border border-[#333] hover:border-[#F7D046]"
                            }`}
                        >
                          CASE {idx + 1}
                        </button>
                      ))}
                      <button className="px-3 py-1 text-[10px] text-gray-600 border border-dashed border-[#333] hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">
                        + ADD
                      </button>
                    </div>

                    {/* Test Case Input */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] text-gray-600 tracking-widest mb-1">INPUT</p>
                        <textarea
                          value={(data?.testcases || testCases)[activeTestCase]?.input || ""}
                          readOnly
                          className="w-full bg-[#1a1a1a] border border-[#333] p-2 text-[#4ECDC4] text-sm font-mono resize-none h-16"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {testTab === "OUTPUT" && (
                  <div className="h-full">
                    {isRunning ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-[#F7D046] text-lg animate-pulse">⚡</p>
                          <p className="text-gray-500 text-xs tracking-widest mt-2">EXECUTING...</p>
                        </div>
                      </div>
                    ) : output ? (
                      <pre className={`text-sm font-mono whitespace-pre-wrap ${output.includes("ACCEPTED") ? "text-[#4ECDC4]" : "text-gray-300"}`}>
                        {output}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600 text-xs tracking-widest">RUN YOUR CODE TO SEE OUTPUT</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Basquiat Footer */}
        <div className="mt-2 text-[#222] text-[8px] font-mono flex-shrink-0">
          <span>"I DON'T THINK ABOUT ART WHEN I'M WORKING. I TRY TO THINK ABOUT LIFE." — SAMO© </span>
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
    # YOUR CODE HERE ♛
    # "I START A PICTURE AND I FINISH IT"
    
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
    # YOUR CODE HERE ♛
    # "I START A PICTURE AND I FINISH IT"
    
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
        # YOUR CODE HERE ♛
        # "I START A PICTURE AND I FINISH IT"
        
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

export default ProblemSolve;
