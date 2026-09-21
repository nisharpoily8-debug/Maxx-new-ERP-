import React, { useState } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { User, UserRole } from '../types/erp.ts';
import {
  Mail,
  Lock,
  User as UserIcon,
  Shield,
  Building2,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  AlertCircle,
  LogIn,
  UserPlus,
  Trash2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, login, deleteUser, showToast } = useErp();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Salesperson');
  const [branch, setBranch] = useState('Dubai Investment Park (DIP)');
  const [password, setPassword] = useState('maxpack2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await login(email, password, isRegisterMode ? { name, role, branch } : undefined);
      showToast(`Welcome! Logged in with ${email}`, 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectUser = async (u: User) => {
    setEmail(u.email);
    setName(u.name);
    setRole(u.role);
    setBranch(u.branch || 'Dubai Investment Park (DIP)');
    setError(null);
    setLoading(true);

    try {
      await login(u.email, 'maxpack2026');
      showToast(`Logged in as ${u.name} (${u.email})`, 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate user.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-6 bg-linear-to-r from-slate-900 to-slate-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {isRegisterMode ? 'Register New Staff Profile' : 'Staff Email Authentication'}
              </h2>
              <p className="text-xs text-slate-300">
                Log in with your official company email to access role-tailored ERP features
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select Preset Staff Accounts */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Select Existing Staff Profile or Enter Email Below</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map((u) => {
                const isSelected = currentUser.email.toLowerCase() === u.email.toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelectUser(u)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-700'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-semibold">Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{u.email}</p>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">{u.role}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {users.length > 1 && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to remove ${u.name} (${u.email}) from the system?`)) {
                              try {
                                await deleteUser(u.id);
                              } catch (err) {
                                // toast handled in ErpContext
                              }
                            }
                          }}
                          title={`Delete user ${u.name}`}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-md transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="shrink mx-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Or Sign In with Any Email ID
            </span>
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Email input form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. employee@maxpack.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono"
                />
              </div>
            </div>

            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mansoor Rashid"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      {rolesList.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Warehouse / Branch
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      {branches.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Security Password / PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter employee password"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Secure enterprise session verified against system directory and Firebase authentication.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
              >
                {isRegisterMode ? (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Back to Standard Login</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register New Team Member Email</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white" />
                    <span>{isRegisterMode ? 'Create & Sign In' : 'Sign In with Email'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
