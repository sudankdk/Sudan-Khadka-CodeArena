import AdminDashboardLayout from "../../Components/AdminDashboardLayout";
import { Button } from "@/Components/ui/button";
import { ProblemsTable } from "@/Components/admin/ProblemsTable";
import { CreateProblemDialog } from "@/Components/admin/CreateProblemDialog";
import { Pagination } from "@/Components/ui/pagination";
import { use, useState } from "react";
import { useProblem } from "@/features/Problems/hooks/useProblem";
import { useCreateProblem } from "@/features/Problems/hooks/useCreateProblem";
import { useProblemCounts } from "@/features/Problems/hooks/useProblemCounts";
import type { IBoilerplate, IProblemTest, ITestCase } from "@/Interfaces/problemstest/problemtest";

const initialFormData: IProblemTest = {
  main_heading: "",
  slug: "",
  description: "",
  tag: "",
  difficulty: "easy",
  test_cases: [{ input: "", expected: "" }],
  boilerplate: [{ code: "", Language: "" }]
};

const AdminProblems = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

  //local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  
  //server state
  const {data,isLoading} = useProblem(currentPage, pageSize)
  const createProblemMutation = useCreateProblem(); 
 
  const total = useProblemCounts().data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);
  const problems = data?.problems || [];

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
      createProblemMutation.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData(initialFormData);
          setCurrentPage(1);
        }
      });
    };
    const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <AdminDashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Manage Problems</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            + Create Problem
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ProblemsTable problems={problems} loading={isLoading } />
          {!isLoading && problems.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        <CreateProblemDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          formData={formData}
          loading={isLoading || createProblemMutation.isLoading}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onTestCaseChange={handleTestCaseChange}
          onAddTestCase={addTestCase}
          onRemoveTestCase={removeTestCase}
          onBoilerplateChange={handleBoilerplateChange}
          onAddBoilerplate={addBoilerplate}
          onRemoveBoilerplate={removeBoilerplate}
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminProblems;
