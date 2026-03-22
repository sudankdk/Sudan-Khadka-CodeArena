import React, { useEffect, useMemo, useState } from "react";
import AdminDashboardLayout from "../../components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createUser,
  fetchUserList,
  fetchUserStats,
  updateUser,
  type AdminUserPayload,
  type AdminUserStats,
} from "@/services/users/api";

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "regular";
  rating: number;
  matches_played: number;
  matches_won: number;
  solved_count: number;
  submissions_count: number;
  created_at?: string;
};

const emptyForm: AdminUserPayload = {
  username: "",
  email: "",
  password: "",
  role: "regular",
  rating: 1000,
  matches_played: 0,
  matches_won: 0,
  solved_count: 0,
  submissions_count: 0,
  bio: "",
  language_preference: "python",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AdminUserPayload>(emptyForm);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchUserList();
      const data = (res as any)?.data ?? res;
      setUsers(data || []);
    } catch (e: any) {
      setError(e?.response?.data || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetchUserStats();
      const data = (res as any)?.data ?? res;
      setStats(data);
    } catch (e) {
      // no-op; stats are optional for UI
    }
  };

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const openCreateDialog = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email,
      role: user.role,
      rating: user.rating,
      matches_played: user.matches_played,
      matches_won: user.matches_won,
      solved_count: user.solved_count,
      submissions_count: user.submissions_count,
      password: "",
      bio: "",
      language_preference: "python",
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleChange = (field: keyof AdminUserPayload, value: string) => {
    if (["rating", "matches_played", "matches_won", "solved_count", "submissions_count"].includes(field)) {
      setForm((prev) => ({ ...prev, [field]: Number(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingUser) {
        const payload = { ...form };
        if (!payload.password) {
          delete (payload as any).password;
        }
        await updateUser(editingUser.id, payload);
      } else {
        await createUser(form);
      }
      setDialogOpen(false);
      setForm(emptyForm);
      await Promise.all([loadUsers(), loadStats()]);
    } catch (err: any) {
      const msg = err?.response?.data || "Unable to save user";
      setError(typeof msg === "string" ? msg : "Unable to save user");
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    return {
      total,
      admins,
      regular: total - admins,
    };
  }, [users]);

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600">Create, update, and monitor users.</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-blue-600 text-white hover:bg-blue-700">Add User</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
              <CardDescription>All registered accounts</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-gray-900">{stats?.total_users ?? summary.total}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Admins</CardTitle>
              <CardDescription>Users with admin role</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-gray-900">{stats?.admin_users ?? summary.admins}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg. Rating</CardTitle>
              <CardDescription>Across all users</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-gray-900">{(stats?.average_rating ?? 0).toFixed(0)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Solved</CardTitle>
              <CardDescription>Total solved submissions</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-gray-900">{stats?.total_solved ?? 0}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Quick view of accounts and activity.</CardDescription>
            </div>
            <Button variant="outline" onClick={loadUsers} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent>
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-800">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-4">Username</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Rating</th>
                    <th className="py-2 pr-4">Solved</th>
                    <th className="py-2 pr-4">Matches</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{user.username}</td>
                      <td className="py-2 pr-4 text-gray-600">{user.email}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{user.rating?.toFixed?.(0) ?? user.rating}</td>
                      <td className="py-2 pr-4">{user.solved_count}</td>
                      <td className="py-2 pr-4">{user.matches_won}/{user.matches_played}</td>
                      <td className="py-2 pr-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>Edit</Button>
                      </td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr>
                      <td className="py-4 text-gray-500" colSpan={7}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit user" : "Create user"}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={form.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    placeholder="admin or regular"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password || ""}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder={editingUser ? "Leave blank to keep" : "Set password"}
                    required={!editingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    value={form.rating ?? 0}
                    onChange={(e) => handleChange("rating", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="solved">Solved</Label>
                  <Input
                    id="solved"
                    type="number"
                    value={form.solved_count ?? 0}
                    onChange={(e) => handleChange("solved_count", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="matches_played">Matches Played</Label>
                  <Input
                    id="matches_played"
                    type="number"
                    value={form.matches_played ?? 0}
                    onChange={(e) => handleChange("matches_played", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="matches_won">Matches Won</Label>
                  <Input
                    id="matches_won"
                    type="number"
                    value={form.matches_won ?? 0}
                    onChange={(e) => handleChange("matches_won", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingUser ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminUsers;
