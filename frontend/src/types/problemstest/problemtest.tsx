export interface IProblemTest {
  id?: string;
  main_heading: string;
  slug: string;
  description: string;
  tag: string;
  difficulty: "easy" | "medium" | "hard";
  test_cases: ITestCase[];
  boilerplates: IBoilerplate[];
  acceptance?: string;
  status?: string | null;
}


export interface ITestCase {
  input: string;
  expected: string;
}

export interface IBoilerplate {
  code: string;
  language: string;
}

//  "main_heading": "Two Sum",
//   "slug": "two-sum",
//   "description": "Find indices of two numbers that add up to target",
//   "tag": "arrays",
//   "difficulty": "easy",
//   "test_cases": [
//     {"input": "[2,7,11,15], 9", "expected": "[0,1]"},
//     {"input": "[3,2,4], 6", "expected": "[1,2]"}