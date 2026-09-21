import React, { useState } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { User, UserRole } from '../types/erp.ts';
import {
  Users,
  Shield,
  Check,
  X,
  Plus,
  Mail,
  Building,
  UserCheck,
  KeyRound,
  Lock,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const TeamView: React.FC = () => {
  const { users, currentUser, setCurrentUser, addUser, deleteUser, showToast, can, setShowAuthModal } = useErp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Salesperson' as UserRole,
    branch: 'Dubai Investment Park (DIP)',
  });

  const permissionsMatrix: { module: string; key: string; allowed: UserRole[] }[] = [
    {
      module: 'Executive Dashboard',
      key: 'dashboard',
      allowed: ['Super Admin', 'Admin / Manager', 'Salesperson', 'Cashier', 'Accountant', 'Warehouse Staff', 'Viewer'],
    },
    {
      module: 'Sales & Tax Invoices (Create & Edit)',
      key: 'sales',
      allowed: ['Super Admin', 'Admin / Manager', 'Salesperson', 'Accountant'],
    },
    {
      module: 'POS Cashier Terminal & Shifts',
      key: 'pos',
      allowed: ['Super Admin', 'Admin / Manager', 'Cashier', 'Salesperson'],
    },
    {
      module: 'Inventory & Stock Adjustments',
      key: 'inventory',
      allowed: ['Super Admin', 'Admin / Manager', 'Warehouse Staff'],
    },
    {
      module: 'Purchases, Mills & Vendor Bills',
      key: 'purchases',
      allowed: ['Super Admin', 'Admin / Manager', 'Warehouse Staff', 'Accountant'],
    },
    {
      module: 'Financial Accounting & General Ledger',
      key: 'accounting',
      allowed: ['Super Admin', 'Admin / Manager', 'Accountant'],
    },
    {
      module: 'UAE VAT 201 Filing & Box Reports',
      key: 'vat',
      allowed: ['Super Admin', 'Admin / Manager', 'Accountant'],
    },
    {
      module: 'System Settings & Google Sheets DB',
      key: 'settings',
      allowed: ['Super Admin', 'Admin / Manager'],
    },
  ];

  const rolesList: UserRole[] = [
    'Super Admin',
    'Admin / Manager',
    'Salesperson',
    'Cashier',
    'Accountant',
    'Warehouse Staff',
    'Viewer',
  ];

  const branches = [
    'Dubai Investment Park (DIP)',
    'Al Quoz Industrial Hub',
    'Sharjah Industrial Area 3',
    'Abu Dhabi Musaffah Hub',
    'Ras Al Khor Logistics Park',
  ];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.email || !newStaff.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!newStaff.name.trim()) {
      setError('Please enter the team member name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addUser(newStaff);
      setShowAddModal(false);
      setNewStaff({
        name: '',
        email: '',
        role: 'Salesperson',
        branch: 'Dubai Investment Park (DIP)',
      });
      showToast(`User ${newStaff.name} created! They can now log in with ${newStaff.email}`, 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
    } catch (err: any) {
      // Toast notification is handled in ErpContext
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Team & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage employee email logins, branch assignments, and secure role permissions across Maxpack UAE.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Switch / Sign In</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Guide Callout on How Separate Email Login Works */}
      <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 rounded-xl shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100">
              Individual Email Authentication & Multi-User Setup
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              Each user must have their own separate email address for logging into the ERP. Every invoice created, payment collected, or stock movement performed is cryptographically audited to that specific user's email in the system audit logs.
            </p>
            <div className="flex flex-wrap gap-4 mt-2 font-medium text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Separate email per staff member
              </span>
              <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Role-enforced API permissions
              </span>
              <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Audit log accountability
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="shrink-0 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-xs transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New User Email</span>
        </button>
      </div>

      {/* Users Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((u) => {
          const isCurrent = currentUser.id === u.id;
          return (
            <div
              key={u.id}
              className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                isCurrent
                  ? 'border-emerald-600 ring-2 ring-emerald-600/10 dark:border-emerald-500'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center">
                      {u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{u.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{u.email}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'Super Admin'
                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : u.role === 'Accountant'
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : u.role === 'Cashier'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{u.branch || 'Dubai Investment Park (DIP)'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  {isCurrent ? (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Currently Signed In</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setCurrentUser(u);
                        showToast(`Switched active profile to ${u.name} (${u.email})`, 'info');
                      }}
                      className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Sign in as {u.name.split(' ')[0]} →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {u.id}</span>
                  <button
                    onClick={() => setUserToDelete(u)}
                    disabled={users.length <= 1}
                    title={users.length <= 1 ? 'At least one user account must remain in the ERP system' : `Delete user account ${u.name}`}
                    className={`p-1.5 rounded-lg transition text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer ${
                      users.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Permissions Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Role Privilege Matrix (Enforced at Server API Layer)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">ERP Functional Module</th>
                {rolesList.map((r) => (
                  <th key={r} className="py-3 px-2 text-center whitespace-nowrap">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permissionsMatrix.map((item) => (
                <tr key={item.key} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{item.module}</td>
                  {rolesList.map((role) => {
                    const hasAccess = item.allowed.includes(role);
                    return (
                      <td key={role} className="py-3 px-2 text-center">
                        {hasAccess ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600">
                            <X className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 bg-slate-900 text-white relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Add Team Member</h3>
                  <p className="text-xs text-slate-300">Set separate email address and access permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mansoor"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Individual Login Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. employee@maxpack.ae or personal@gmail.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  This user will use this exact email address to sign into their ERP account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designated Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Branch / Hub
                  </label>
                  <select
                    value={newStaff.branch}
                    onChange={(e) => setNewStaff({ ...newStaff, branch: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create Staff Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete User Profile
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Are you sure you want to remove this user from the ERP system?
                </p>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{userToDelete.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span className="text-slate-700 dark:text-slate-300">{userToDelete.branch || 'DIP Central'}</span>
              </div>
            </div>

            {currentUser.id === userToDelete.id && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> You are deleting your currently active profile. Your session will automatically switch to another team member.
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Historical transactions, invoices, and audit entries previously generated by this user will be preserved for UAE FTA compliance.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
