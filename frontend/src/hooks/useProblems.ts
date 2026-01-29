import { useState, useEffect } from "react";
import { getProblemTests, createProblemTest, filteredProblemsByDifficulty } from "@/services/auth/api/problemtest";
import type { IProblemTest, ITestCase, IBoilerplate } from "@/Interfaces/problemstest/problemtest";

const initialFormData: IProblemTest = {
  main_heading: "",
  slug: "",
  description: "",
  tag: "",
  difficulty: "easy",
  test_cases: [{ input: "", expected: "" }],
  boilerplate: [{ code: "", Language: "" }]
};



export const useProblems = () => {
  const [problems, setProblems] = useState<IProblemTest[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IProblemTest>(initialFormData);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(3);
  const [total, setTotal] = useState(0);
  const [totalEasy, setTotalEasy] = useState(0);
  const [totalMedium, setTotalMedium] = useState(0);
  const [totalHard, setTotalHard] = useState(0);

  useEffect(() => {
    fetchProblems();
    CountProblemsByDifficulty();
  }, [currentPage]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await getProblemTests(currentPage, pageSize);
      console.log("Fetched data:", response);
      setProblems(response.problems);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching problems:", error);
      setProblems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const CountProblemsByDifficulty = async () => {
    try {
      const easyProblems = await filteredProblemsByDifficulty("easy");
      setTotalEasy(easyProblems.data.total);
      const mediumProblems = await filteredProblemsByDifficulty("medium");
      setTotalMedium(mediumProblems.data.total);
      const hardProblems = await filteredProblemsByDifficulty("hard");
      setTotalHard(hardProblems.data.total);
    } catch (error) {
      console.error("Error counting problems by difficulty:", error);
      setTotalEasy(0);
      setTotalMedium(0);
      setTotalHard(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTestCaseChange = (index: number, field: keyof ITestCase, value: string) => {
    const newTestCases = [...formData.test_cases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setFormData(prev => ({ ...prev, test_cases: newTestCases }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      test_cases: [...prev.test_cases, { input: "", expected: "" }]
    }));
  };

  const removeTestCase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      test_cases: prev.test_cases.filter((_, i) => i !== index)
    }));
  };

  const handleBoilerplateChange = (index: number, field: keyof IBoilerplate, value: string) => {
    const newBoilerplates = [...formData.boilerplate];
    newBoilerplates[index] = { ...newBoilerplates[index], [field]: value };
    setFormData(prev => ({ ...prev, boilerplate: newBoilerplates }));
  };

  const addBoilerplate = () => {
    setFormData(prev => ({
      ...prev,
      boilerplate: [...prev.boilerplate, { code: "", Language: "" }]
    }));
  };

  const removeBoilerplate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      boilerplate: prev.boilerplate.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProblemTest(formData);
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setCurrentPage(1);
      fetchProblems();
    } catch (error) {
      console.error("Error creating problem:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(total / pageSize);

  return {
    problems,
    isDialogOpen,
    setIsDialogOpen,
    loading,
    formData,
    handleInputChange,
    handleTestCaseChange,
    addTestCase,
    removeTestCase,
    handleBoilerplateChange,
    addBoilerplate,
    removeBoilerplate,
    handleSubmit,
    currentPage,
    pageSize,
    total,
    totalPages,
    totalEasy,
    totalMedium,
    totalHard,
    handlePageChange
  };
};


