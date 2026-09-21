import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, BusinessSettings, Warehouse } from '../types/erp.ts';
import { api } from '../services/api.ts';
import { testFirebaseConnection } from '../services/firebase.ts';

interface ErpContextType {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  warehouses: Warehouse[];
  selectedWarehouse: string; // 'all' or warehouseId
  setSelectedWarehouse: (id: string) => void;
  settings: BusinessSettings | null;
  refreshSettings: () => Promise<void>;
  formatAED: (amount: number) => string;
  formatUAE: (dateStr: string) => string;
  can: (module: string, action?: 'create' | 'edit' | 'delete' | 'post' | 'approve') => boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  login: (email: string, password?: string, extra?: { name?: string; role?: UserRole; branch?: string }) => Promise<void>;
  logout: () => void;
  addUser: (userData: { name: string; email: string; role: UserRole; branch?: string }) => Promise<User>;
  deleteUser: (id: string) => Promise<boolean>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maxpack_erp_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Apply theme class to <html>
  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        root.classList.remove('dark');
        setResolvedTheme('light');
      }
    };

    applyTheme();
    localStorage.setItem('maxpack_erp_theme', theme);

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User>({
    id: 'usr-1',
    name: 'Tariq Al-Mansoor',
    email: 'tariq@maxpack.ae',
    role: 'Super Admin',
    branch: 'DIP Central',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('maxpack_auth_email');
    }
    return true;
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadInitialData();
    // Test connection to Firestore per skill mandate
    testFirebaseConnection().catch(() => {});
  }, []);

  const loadInitialData = async () => {
    try {
      const [u, w, s] = await Promise.all([
        api.getUsers(),
        api.getWarehouses(),
        api.getSettings(),
      ]);
      setUsers(u);
      setWarehouses(w);
      setSettings(s);
      if (u.length > 0) {
        const savedEmail = localStorage.getItem('maxpack_auth_email');
        const savedId = localStorage.getItem('maxpack_active_user_id');
        let found = u.find(user => (savedEmail && user.email.toLowerCase() === savedEmail.toLowerCase()) || user.id === savedId);
        if (found) {
          setCurrentUserState(found);
          localStorage.setItem('maxpack_active_user', found.name);
          localStorage.setItem('maxpack_auth_email', found.email);
          setIsAuthenticated(true);
        } else {
          setCurrentUserState(u[0]);
          localStorage.setItem('maxpack_active_user', u[0].name);
        }
      }
    } catch (e) {
      console.warn('Initial data load warning:', e);
    }
  };

  const login = async (
    email: string,
    password?: string,
    extra?: { name?: string; role?: UserRole; branch?: string }
  ) => {
    const res = await api.loginWithEmail({
      email,
      name: extra?.name,
      role: extra?.role,
      branch: extra?.branch,
    });

    if (res.user) {
      setCurrentUserState(res.user);
      setIsAuthenticated(true);
      localStorage.setItem('maxpack_auth_email', res.user.email);
      localStorage.setItem('maxpack_active_user_id', res.user.id);
      localStorage.setItem('maxpack_active_user', res.user.name);
      
      // Update users list if newly registered
      setUsers(prev => {
        const exists = prev.some(u => u.email.toLowerCase() === res.user.email.toLowerCase());
        return exists ? prev.map(u => u.id === res.user.id ? res.user : u) : [res.user, ...prev];
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('maxpack_auth_email');
    setIsAuthenticated(false);
    setShowAuthModal(true);
    showToast('Signed out of session. Please select or enter an email to sign in.', 'info');
  };

  const addUser = async (userData: { name: string; email: string; role: UserRole; branch?: string }): Promise<User> => {
    const created = await api.createUser(userData);
    setUsers(prev => [created, ...prev]);
    showToast(`Added new team user ${created.name} (${created.email})`, 'success');
    return created;
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const target = users.find(u => u.id === id);
      if (!target) throw new Error('User not found.');
      if (users.length <= 1) {
        throw new Error('Cannot delete the only remaining user account.');
      }
      await api.deleteUser(id);
      const remaining = users.filter(u => u.id !== id);
      setUsers(remaining);

      // If deleted user is currently active, switch session to another available user
      if (currentUser.id === id) {
        if (remaining.length > 0) {
          setCurrentUserState(remaining[0]);
          localStorage.setItem('maxpack_active_user', remaining[0].name);
          localStorage.setItem('maxpack_active_user_id', remaining[0].id);
          localStorage.setItem('maxpack_auth_email', remaining[0].email);
          showToast(`Deleted active user. Switched active profile to ${remaining[0].name}.`, 'info');
        }
      } else {
        showToast(`Removed user ${target.name} (${target.email}) successfully.`, 'success');
      }
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
      throw err;
    }
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem('maxpack_active_user_id', user.id);
    localStorage.setItem('maxpack_active_user', user.name);
    showToast(`Switched active user to ${user.name} (${user.role})`, 'info');
  };

  const switchRole = (role: UserRole) => {
    const matched = users.find(u => u.role === role);
    if (matched) {
      setCurrentUser(matched);
    } else {
      const tempUser: User = {
        ...currentUser,
        role,
        name: `Test ${role}`,
      };
      setCurrentUser(tempUser);
    }
  };

  const refreshSettings = async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch (e) {
      console.error('Failed to refresh settings', e);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const formatAED = (amount: number = 0): string => {
    const num = isNaN(amount) ? 0 : amount;
    return `AED ${num.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatUAE = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-AE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Permission Matrix check
  const can = (module: string, action: 'create' | 'edit' | 'delete' | 'post' | 'approve' = 'create'): boolean => {
    const role = currentUser.role;
    if (role === 'Super Admin') return true;
    if (role === 'Viewer') return false; // Viewers can only view

    switch (module) {
      case 'dashboard':
        return true;
      case 'sales':
        if (role === 'Salesperson' || role === 'Admin / Manager') return true;
        if (role === 'Accountant' && (action === 'edit' || action === 'approve')) return true;
        return false;
      case 'pos':
        return role === 'Cashier' || role === 'Admin / Manager';
      case 'inventory':
        return role === 'Warehouse Staff' || role === 'Admin / Manager';
      case 'purchases':
        return role === 'Admin / Manager' || role === 'Warehouse Staff' || role === 'Accountant';
      case 'accounting':
        return role === 'Accountant' || role === 'Admin / Manager';
      case 'reports':
        return true;
      case 'settings':
        return role === 'Admin / Manager';
      default:
        return true;
    }
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    const label = newTheme === 'system' ? 'System Theme' : newTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
    showToast(`Switched to ${label}`, 'info');
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ErpContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser,
        switchRole,
        warehouses,
        selectedWarehouse,
        setSelectedWarehouse,
        settings,
        refreshSettings,
        formatAED,
        formatUAE,
        can,
        toast,
        showToast,
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        isAuthenticated,
        showAuthModal,
        setShowAuthModal,
        login,
        logout,
        addUser,
        deleteUser,
      }}
    >
      {children}
      {toast && (
        <div
          id="global-toast-notification"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium border transition-all animate-bounce duration-300 ${
            toast.type === 'error'
              ? 'bg-rose-900/95 text-rose-100 border-rose-700/50'
              : toast.type === 'info'
              ? 'bg-sky-900/95 text-sky-100 border-sky-700/50'
              : 'bg-emerald-950/95 text-emerald-100 border-emerald-700/50'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              toast.type === 'error' ? 'bg-rose-400' : toast.type === 'info' ? 'bg-sky-400' : 'bg-emerald-400'
            }`}
          />
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-xs opacity-70 hover:opacity-100 text-white"
          >
            ✕
          </button>
        </div>
      )}
    </ErpContext.Provider>
  );
};

export const useErp = () => {
  const context = useContext(ErpContext);
  if (!context) throw new Error('useErp must be used within ErpProvider');
  return context;
};
