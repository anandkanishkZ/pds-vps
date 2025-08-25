import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Mail, Settings, LogOut, TrendingUp, FolderTree, Images, Briefcase, UserSquare2, SlidersHorizontal } from 'lucide-react';

export type AdminNavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
};

const defaultNav: AdminNavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/media', label: 'Media', icon: Images },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/hero-slides', label: 'Hero Slider', icon: SlidersHorizontal },
  { to: '/admin/leadership', label: 'Leadership', icon: UserSquare2 },
  { to: '/admin/careers', label: 'Careers', icon: Briefcase },
  { to: '/admin/inquiries', label: 'Inquiries', icon: Mail },
  { to: '/admin/dealership-inquiries', label: 'Dealership Inquiries', icon: Mail },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ nav = defaultNav, onLogout }: { nav?: AdminNavItem[]; onLogout?: () => void }) {
  return (
    <aside className="hidden md:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky top-14 h-[calc(100vh-3.5rem)]">
      <div className="h-full overflow-y-auto">
        <div className="px-4 pt-4 pb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Navigation</div>
        </div>
        <nav className="px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end as any}
              className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
      ? 'text-white bg-brand-600 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 group-[.active]:bg-white/20 group-[.active]:text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span>{label}</span>
              <span className="absolute right-2 h-2 w-2 rounded-full bg-[#fec216] opacity-0 group-[.active]:opacity-100" />
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 mt-auto">
          {/* Visit public site link */}
          <NavLink
            to="/"
            end
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white shadow-sm ring-1 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 focus-visible:outline-none focus-visible:ring-2 transition bg-green-600 hover:bg-green-700 active:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/15">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <span>Visit Site</span>
          </NavLink>
          <button
            onClick={() => onLogout?.()}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white shadow-sm ring-1 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 focus-visible:outline-none focus-visible:ring-2 transition"
            style={{ 
              backgroundColor: '#fc1819',
              borderColor: '#ff0808'
            } as React.CSSProperties}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e60707'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff0808'}
            onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#cc0606'}
            onMouseUp={(e) => e.currentTarget.style.backgroundColor = '#e60707'}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/15">
              <LogOut className="h-3.5 w-3.5" />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
