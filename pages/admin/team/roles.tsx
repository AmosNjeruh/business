// Business Suite – Team Roles & Permissions
// Route: /admin/team/roles
// Mirrors frontend/pages/vendor/team/roles.tsx but uses AdminLayout and business services.

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/Layout";
import {
  getTeamPermissions,
  getTeamRoles,
  createTeamRole,
  updateTeamRole,
  deleteTeamRole,
} from "@/services/vendor";
import toast from "react-hot-toast";
import {
  FaUserShield,
  FaSpinner,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

interface Permission {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissionIds: string[];
  permissionSlugs: string[];
  permissions: Permission[];
  staffCount: number;
}

const AdminTeamRolesPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [permsRes, rolesRes] = await Promise.all([getTeamPermissions(), getTeamRoles()]);
      setPermissions(permsRes.permissions || []);
      setRoles(rolesRes.roles || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load roles and permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    setFormName("");
    setFormDescription("");
    setSelectedPermissionIds(new Set());
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description || "");
    setSelectedPermissionIds(new Set(role.permissionIds));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRole(null);
  };

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveRole = async () => {
    const name = formName.trim();
    if (!name) {
      toast.error("Role name is required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name,
        description: formDescription.trim() || undefined,
        permissionIds: Array.from(selectedPermissionIds),
      };
      if (editingRole) {
        await updateTeamRole(editingRole.id, payload);
        toast.success("Role updated");
      } else {
        await createTeamRole(payload);
        toast.success("Role created");
      }
      closeModal();
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.staffCount > 0) {
      toast.error("Reassign or remove staff from this role first");
      return;
    }
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      setDeletingId(role.id);
      await deleteTeamRole(role.id);
      toast.success("Role deleted");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to delete role");
    } finally {
      setDeletingId(null);
    }
  };

  const byCategory = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const cat = p.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FaUserShield className="text-indigo-500" />
              Roles &amp; Permissions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Create roles and assign permissions to control what your agency team can do.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-emerald-400 to-cyan-400 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 hover:opacity-90 transition-all whitespace-nowrap"
          >
            <FaPlus className="h-3.5 w-3.5" /> New Role
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <FaSpinner className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {roles.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-10 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No roles yet. Create one to get started and control access across your agency team.
                </p>
                <button
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all"
                >
                  <FaPlus className="h-3.5 w-3.5" /> Create Role
                </button>
              </div>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xs font-bold">
                      {role.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{role.name}</h3>
                      {role.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {role.description}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                        <FaUsers className="h-3 w-3" /> {role.staffCount} staff ·{" "}
                        {role.permissionSlugs.length} permissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(role)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      title="Edit role"
                    >
                      <FaEdit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      disabled={role.staffCount > 0 || deletingId === role.id}
                      className="p-2 rounded-lg text-red-500 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete role"
                    >
                      {deletingId === role.id ? (
                        <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FaTrash className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal: Create / Edit role */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
              onClick={closeModal}
            />
            <div className="relative w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <FaTimes className="h-4 w-4" />
              </button>

              <div className="space-y-6">
                {/* Role details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Role name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Campaign Manager, Analyst"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Description{" "}
                      <span className="text-[11px] font-normal text-slate-400">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                      placeholder="Brief description of what this role can do…"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Permissions
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedPermissionIds.size} permission
                      {selectedPermissionIds.size !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-5 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-5">
                      {Object.entries(byCategory).map(([category, perms]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide border-b border-slate-200 dark:border-white/10 pb-1.5">
                            {category}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {perms.map((p) => {
                              const isSelected = selectedPermissionIds.has(p.id);
                              return (
                                <label
                                  key={p.id}
                                  className={`relative flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 shadow-sm"
                                      : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-sm"
                                  }`}
                                >
                                  <div className="flex items-center h-5 mt-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => togglePermission(p.id)}
                                      className="sr-only"
                                    />
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                                        isSelected
                                          ? "border-indigo-500 bg-indigo-500"
                                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                      }`}
                                    >
                                      {isSelected && (
                                        <FaCheck className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                      {p.name}
                                    </div>
                                    {p.description && (
                                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                        {p.description}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <FaTimes className="h-3 w-3" /> Cancel
                  </button>
                  <button
                    onClick={saveRole}
                    disabled={saving || !formName.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow"
                  >
                    {saving && <FaSpinner className="h-3.5 w-3.5 animate-spin" />}
                    {editingRole ? "Update Role" : "Create Role"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTeamRolesPage;

