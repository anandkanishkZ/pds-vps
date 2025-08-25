import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Package,
  Mail,
  LogOut,
  Settings,
  Bell,
  Search,
  ChevronDown,
  User,
  Crown,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
// Removed framer-motion to avoid extra dependency; using CSS transitions instead

// Local components from your project
import ThemeToggle from "../components/ThemeToggle";
import AdminSidebar from "../components/admin/AdminSidebar";
import ConfirmModal from "../components/ConfirmModal";
import { auth, getProfile, type UserProfile } from "../lib/api";
import Logo from "../components/Logo";

// Removed shadcn/ui dropdown; implementing a simple headless dropdown below

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // --- Auth guard ---
  useEffect(() => {
    const token = auth.getToken?.();
    if (!token) navigate("/login");
    else {
      (async () => {
        try {
          const data = await getProfile(token);
          setProfile(data.profile);
        } catch (e) {
          console.error('Failed to load profile', e);
        } finally {
          setProfileLoading(false);
        }
      })();
    }
  }, [navigate]);

  // --- Lock scroll when mobile drawer open ---
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B toggles sidebar (mobile convenient)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
      // Cmd/Ctrl + K focuses search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
  (searchRef.current)?.focus?.();
      }
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target) &&
        userTriggerRef.current &&
        !userTriggerRef.current.contains(target)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [userMenuOpen]);

  // Listen for avatar updates dispatched from Settings page
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.avatar) {
        setProfile(p => p ? { ...p, avatar: detail.avatar } : p);
      }
    };
    window.addEventListener('pds-avatar-updated', handler as EventListener);
    return () => window.removeEventListener('pds-avatar-updated', handler as EventListener);
  }, []);

  const logout = () => {
    auth.clear?.();
    navigate("/login");
  };

  const nav = useMemo(
    () => [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/inquiries", label: "Inquiries", icon: Mail },
      { to: "/admin/careers", label: "Careers", icon: Briefcase },
      { to: "/admin/dealership-inquiries", label: "Dealership Inquiries", icon: Mail },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Skip link for a11y */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 rounded-xl px-3 py-2 bg-slate-900 text-white shadow-lg"
      >
        Skip to content
      </a>

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-slate-900/40">
        <div className="h-16 grid grid-cols-[auto,1fr,auto] items-center gap-3 px-3 sm:px-6 lg:px-8"
             style={{ background: "linear-gradient(135deg, rgb(5, 74, 123) 0%, rgb(3, 57, 95) 60%, rgb(2, 41, 69) 100%)" }}>
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden inline-flex items-center justify-center rounded-xl p-2 hover:bg-white/10 text-white/90 ring-1 ring-white/15 hover:ring-white/25 transition"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Brand */}
          <Link to="/admin" className="flex items-center gap-2 text-white">
            <Logo size="sm" variant="color" showText={false} />
            <span className="font-semibold tracking-tight">Admin Dashboard</span>
          </Link>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Search (md+) */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search… (Ctrl/Cmd + K)"
                  className="w-64 lg:w-80 pl-9 pr-3 py-1.5 rounded-xl bg-white/10 text-white placeholder-white/70 ring-1 ring-white/15 focus:ring-2 focus:ring-white/40 outline-none"
                />
              </div>
            </div>

            <ThemeToggle />

            <button
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-white/15 text-white/90 hover:bg-white/10 transition"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </button>

            {/* User dropdown (headless) */}
            <div className="relative" ref={userMenuRef}>
              <button
                ref={userTriggerRef}
                onClick={() => setUserMenuOpen((v) => !v)}
                className="group inline-flex items-center gap-2.5 rounded-xl px-3 py-2 ring-1 ring-white/20 hover:bg-white/10 text-white/90 transition-all duration-200 hover:ring-white/30"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <div className="relative">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name || 'User'}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-white/30"
                    />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-sm font-bold text-slate-900 shadow-sm">
                      {profile?.name?.charAt(0) || 'A'}
                    </span>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold truncate max-w-[120px]">{profile?.name || (profileLoading ? 'Loading…' : 'User')}</div>
                  <div className="text-xs text-white/60 truncate max-w-[120px]">{profile?.role === 'admin' ? 'Administrator' : profile?.role || ''}</div>
                </div>
                <ChevronDown className={`h-4 w-4 opacity-60 transition-all duration-200 group-hover:opacity-100 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-64 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 shadow-2xl ring-1 ring-black/10 dark:text-white dark:ring-white/10 p-2 border border-slate-200/50 dark:border-slate-700/50 animate-in slide-in-from-top-2 duration-200"
                  style={{ 
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)' 
                  }}
                >
                  {/* User Info Header */}
                  <div className="px-3 py-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl mb-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {profile?.avatar ? (
                          <img
                            src={profile.avatar}
                            alt={profile.name || 'User'}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white/60 dark:ring-slate-800"
                          />
                        ) : (
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-lg font-bold text-slate-900 shadow-lg">
                            {profile?.name?.charAt(0) || 'A'}
                          </span>
                        )}
                        <span className="absolute -bottom-1 -right-1 inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{profile?.name || 'User'}</span>
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.email || ''}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-500" />
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{profile?.role === 'admin' ? 'Administrator' : profile?.role || ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="space-y-1">
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all duration-200 group"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Overview</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Dashboard & analytics</div>
                      </div>
                    </Link>
                    
                    <Link
                      to="/admin/settings"
                      className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all duration-200 group"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Settings</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Account & preferences</div>
                      </div>
                    </Link>

                    <button
                      className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all duration-200 group"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Profile</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Manage your profile</div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700 my-2" />
                  
                  {/* Logout Button */}
                  <button
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-900/20 transition-all duration-200 group"
                    onClick={() => { setUserMenuOpen(false); setConfirmOpen(true); }}
                  >
                    <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Sign Out</div>
                      <div className="text-xs opacity-70">End your session</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block">
          <AdminSidebar onLogout={() => setConfirmOpen(true)} />
        </aside>

        {/* Mobile sidebar drawer */}
        {/* Mobile sidebar drawer (CSS-based) */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside
              className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl flex flex-col transform transition-transform duration-300 ease-out translate-x-0"
              aria-label="Mobile sidebar"
            >
              <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Logo size="sm" variant="color" showText={false} />
                  <span className="font-semibold text-slate-900 dark:text-white">Menu</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close sidebar">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="p-3 space-y-1 overflow-y-auto">
                {nav.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition",
                        isActive
                          ? "text-white bg-sky-600 shadow-sm"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                      ].join(" ")
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}

                <button
                  onClick={() => setConfirmOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </nav>
            </aside>
          </div>
        )}

        {/* Content */}
        <main id="content" className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {/* Optional page shell card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-3 sm:p-4 lg:p-6 shadow-sm">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Logout confirmation */}
      <ConfirmModal
        open={confirmOpen}
        title="Logout?"
        description="You will be signed out and redirected to the login page."
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmOpen(false);
          logout();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
