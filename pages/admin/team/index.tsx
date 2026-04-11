// Business Suite – Team Management
// Route: /admin/team
// Full: team member management, roles, permissions, invitations, audit logs

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import {
  getTeamStaff,
  getTeamRoles,
  inviteTeamStaff,
  updateTeamStaffRole,
  removeTeamStaff,
  cancelInvitation,
} from "@/services/vendor";
import {
  FaUsers, FaUserPlus, FaSpinner, FaEdit, FaTrash, FaCheck, FaTimes,
  FaShieldAlt, FaEnvelope, FaClock, FaUserCheck, FaUserTimes, FaEye,
  FaKey, FaSearch,
} from "react-icons/fa";

interface Role {
  id: string;
  name: string;
  description?: string | null;
}

interface TeamMember {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  user: { id: string; email: string; name: string | null; picture: string | null };
  joinedAt: string | null;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  roleId: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
}

function InviteModal({
  onClose,
  onInvite,
  isInviting,
  roles,
}: {
  onClose: () => void;
  onInvite: (data: { email: string; roleId: string }) => void;
  isInviting: boolean;
  roles: Role[];
}) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!roleId) return;
    onInvite({ email: email.trim(), roleId });
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center">
            <FaUserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Invite Team Member</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Send an invitation to join your team</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="teammate@example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role *</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className={inputCls}
              required
            >
              {!roles || roles.length === 0 ? (
                <option value="">Loading roles...</option>
              ) : (
                roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInviting || !email.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50"
            >
              {isInviting ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaEnvelope className="h-3.5 w-3.5" />}
              {isInviting ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AdminTeamPage: React.FC = () => {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancelingInvitationId, setCancelingInvitationId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const [staffRes, rolesRes] = await Promise.all([getTeamStaff(), getTeamRoles()]);
      setMembers(staffRes?.staff || []);
      setInvitations(staffRes?.invitations || []);
      setRoles(rolesRes?.roles || []);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push("/admin/auth");
        return;
      }
      toast.error(err?.response?.data?.error || "Failed to load team members");
      setMembers([]);
      setInvitations([]);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (data: { email: string; roleId: string }) => {
    setIsInviting(true);
    try {
      await inviteTeamStaff({ email: data.email, roleId: data.roleId });
      toast.success(`Invitation sent to ${data.email}`);
      setShowInviteModal(false);
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const startEditRole = (member: TeamMember) => {
    setEditingStaffId(member.id);
    setEditRoleId(member.roleId);
  };

  const saveRole = async () => {
    if (!editingStaffId) return;
    try {
      setSavingRole(true);
      await updateTeamStaffRole(editingStaffId, editRoleId);
      toast.success("Role updated");
      setEditingStaffId(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.user.name || member.user.email} from staff?`)) return;
    try {
      setRemovingId(member.id);
      await removeTeamStaff(member.id);
      toast.success("Staff removed");
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to remove staff");
    } finally {
      setRemovingId(null);
    }
  };

  const handleCancelInvitation = async (invitation: Invitation) => {
    if (!confirm(`Cancel invitation to ${invitation.email}?`)) return;
    try {
      setCancelingInvitationId(invitation.id);
      await cancelInvitation(invitation.id);
      toast.success("Invitation cancelled");
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to cancel invitation");
    } finally {
      setCancelingInvitationId(null);
    }
  };

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.user.email?.toLowerCase().includes(q) ||
      (m.user.name || "").toLowerCase().includes(q) ||
      m.role?.name?.toLowerCase().includes(q)
    );
  });

  const filteredInvitations = invitations.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.email?.toLowerCase().includes(q) ||
      inv.role?.name?.toLowerCase().includes(q)
    );
  });

  const activeMembers = filtered;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage team members, roles, and permissions
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all whitespace-nowrap"
          >
            <FaUserPlus className="h-3.5 w-3.5" /> Invite Member
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15"
          />
        </div>

        {/* Stats */}
        <div className="bus-responsive-stat-grid gap-4">
          {[
            { label: "Total Members", val: members.length, color: "text-blue-600 dark:text-blue-400" },
            { label: "Active", val: activeMembers.length, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Pending", val: invitations.length, color: "text-amber-600 dark:text-amber-400" },
            { label: "Roles", val: roles.length, color: "text-purple-600 dark:text-purple-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-3xl text-emerald-500" />
          </div>
        ) : filtered.length === 0 && filteredInvitations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-16 text-center">
            <FaUsers className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              {search ? `No members match "${search}"` : "No team members yet"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {search ? "Try a different search term" : "Invite your first team member to get started"}
            </p>
            {!search && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl"
              >
                Invite Team Member
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Members */}
            {activeMembers.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FaUserCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Active Members ({activeMembers.length})
                </h2>
                <div className="space-y-2">
                  {activeMembers.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4 flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 text-xs font-bold flex-shrink-0">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {member.user.name || member.user.email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.user.email}</p>
                          {member.role && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                              <FaShieldAlt className="h-2.5 w-2.5" />
                              {member.role.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {member.joinedAt && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <FaClock className="h-2.5 w-2.5" />
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                        )}
                        {editingStaffId === member.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editRoleId}
                              onChange={(e) => setEditRoleId(e.target.value)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={saveRole}
                              disabled={savingRole}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              {savingRole ? <FaSpinner className="animate-spin h-3 w-3" /> : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingStaffId(null)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditRole(member)}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            >
                              <FaEdit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemove(member)}
                              disabled={removingId === member.id}
                              className="p-2 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              {removingId === member.id ? (
                                <FaSpinner className="animate-spin h-3.5 w-3.5" />
                              ) : (
                                <FaTrash className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Invites */}
            {filteredInvitations.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FaEnvelope className="h-3.5 w-3.5 text-amber-500" />
                  Pending Invitations ({filteredInvitations.length})
                </h2>
                <div className="space-y-2">
                  {filteredInvitations.map((invitation) => {
                    const expiresAt = new Date(invitation.expiresAt);
                    const isExpired = expiresAt < new Date();
                    return (
                    <div
                      key={invitation.id}
                      className={`rounded-xl border ${
                        isExpired
                          ? "border-red-300 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5"
                          : "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5"
                      } p-4 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold flex-shrink-0">
                          <FaEnvelope className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {invitation.email}
                          </p>
                          {invitation.role && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                              {invitation.role.name}
                            </span>
                          )}
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Expires {expiresAt.toLocaleDateString()} {expiresAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(invitation)}
                        disabled={cancelingInvitationId === invitation.id}
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {cancelingInvitationId === invitation.id ? (
                          <FaSpinner className="animate-spin h-3.5 w-3.5" />
                        ) : (
                          <FaTimes className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
          isInviting={isInviting}
          roles={roles}
        />
      )}
    </AdminLayout>
  );
};

export default AdminTeamPage;
