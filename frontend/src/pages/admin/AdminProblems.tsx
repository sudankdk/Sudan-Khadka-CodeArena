import AdminDashboardLayout from "../../Components/AdminDashboardLayout";
import { Button } from "@/Components/ui/button";
import { ProblemsTable } from "@/Components/admin/ProblemsTable";
import { CreateProblemDialog } from "@/Components/admin/CreateProblemDialog";
import { Pagination } from "@/Components/ui/pagination";
import { useProblems } from "@/hooks/useProblems";

const AdminProblems = () => {
  const {
    problems,
    isDialogOpen,
    setIsDialogOpen,
    loading,
    formData,
    handleInputChange,
    handleTestCaseChange,
    addTestCase,
    removeTestCase,
    handleSubmit,
    currentPage,
    pageSize,
    total,
    totalPages,
    handlePageChange
  } = useProblems();

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
          <ProblemsTable problems={problems} loading={loading} />
          {!loading && problems.length > 0 && (
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
          loading={loading}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onTestCaseChange={handleTestCaseChange}
          onAddTestCase={addTestCase}
          onRemoveTestCase={removeTestCase}
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminProblems;
