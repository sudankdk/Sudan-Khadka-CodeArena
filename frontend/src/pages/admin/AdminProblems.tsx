import AdminDashboardLayout from '../../components/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { ProblemsTable } from '@/components/admin/ProblemsTable';
import { CreateProblemDialog } from '@/components/admin/CreateProblemDialog';
import { Pagination } from '@/components/ui/pagination';
import { useState } from "react";
import { useProblem } from "@/features/Problems/hooks/useProblem";
import { useCreateProblem } from "@/features/Problems/hooks/useCreateProblem";
import { useDeleteProblem } from "@/features/Problems/hooks/useDeleteProblem";
import { useUpdateProblem } from "@/features/Problems/hooks/useUpdateProblem";
import { useProblemCounts } from "@/features/Problems/hooks/useProblemCounts";
import type { IBoilerplate, IProblemTest, ITestCase } from '@/types/problemstest/problemtest';

const initialFormData: IProblemTest = {
  main_heading: "",
  slug: "",
  description: "",
  tag: "",
  difficulty: "easy",
  test_cases: [{ input: "", expected: "" }],
  boilerplates: [{ code: "", language: "" }]
};

const AdminProblems = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState("");

  //local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingProblem, setEditingProblem] = useState<IProblemTest | null>(null);


  //server state
  const { data, isLoading } = useProblem(currentPage, pageSize)
  const createProblemMutation = useCreateProblem();
  const deleteProblemMutation = useDeleteProblem();
  const updateProblemMutation = useUpdateProblem();
  const countsQuery = useProblemCounts();

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);
  const problems = data?.problems || [];

  console.log("Fetched problems:", problems);
  console.log("First problem boilerplates:", problems[0]?.boilerplates);

  // Filter problems based on search query
  const filteredProblems = problems.filter(problem =>
    problem.main_heading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    const newBoilerplates = [...formData.boilerplates];
    newBoilerplates[index] = { ...newBoilerplates[index], [field]: value };
    setFormData(prev => ({ ...prev, boilerplates: newBoilerplates }));
  };

  const addBoilerplate = () => {
    setFormData(prev => ({
      ...prev,
      boilerplates: [...prev.boilerplates, { code: "", language: "" }]
    }));
  };

  const removeBoilerplate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      boilerplates: prev.boilerplates.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProblem && editingProblem.id) {
      // Update existing problem
      updateProblemMutation.mutate(
        { id: editingProblem.id, data: formData },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setFormData(initialFormData);
            setEditingProblem(null);
          }
        }
      );
    } else {
      // Create new problem
      createProblemMutation.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData(initialFormData);
          setCurrentPage(1);
        }
      });
    }
  };

  const handleDelete = async (id: string) => {
    deleteProblemMutation.mutate(id);
  };

  const handleEdit = (problem: IProblemTest) => {
    console.log("Editing problem:", problem);
    console.log("Boilerplates:", problem.boilerplates);
    setEditingProblem(problem);
    setFormData({
      main_heading: problem.main_heading,
      slug: problem.slug,
      description: problem.description,
      tag: problem.tag,
      difficulty: problem.difficulty,
      test_cases: problem.test_cases || [{ input: "", expected: "" }],
      boilerplates: problem.boilerplates || [{ code: "", language: "" }]
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingProblem(null);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <AdminDashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Problem Management
              </h1>
              <p className="text-gray-600">Create, manage, and organize coding challenges</p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-lg font-semibold"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Problem
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Problems</p>
                  <p className="text-3xl font-bold text-gray-900">{total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Easy</p>
                  <p className="text-3xl font-bold text-green-600">{countsQuery.data?.easy || 0}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Medium</p>
                  <p className="text-3xl font-bold text-yellow-600">{countsQuery.data?.medium || 0}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hard</p>
                  <p className="text-3xl font-bold text-red-600">{countsQuery.data?.hard || 0}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search problems by title, slug, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Problems Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <ProblemsTable 
            problems={filteredProblems} 
            loading={isLoading}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
          {!isLoading && total > 0 && (
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
          onClose={handleCloseDialog}
          formData={formData}
          loading={isLoading || createProblemMutation.isPending || updateProblemMutation.isPending}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onTestCaseChange={handleTestCaseChange}
          onAddTestCase={addTestCase}
          onRemoveTestCase={removeTestCase}
          onBoilerplateChange={handleBoilerplateChange}
          onAddBoilerplate={addBoilerplate}
          onRemoveBoilerplate={removeBoilerplate}
          isEditing={!!editingProblem}
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminProblems;
