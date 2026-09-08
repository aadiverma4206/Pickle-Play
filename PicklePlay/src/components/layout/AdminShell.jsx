import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard, Users, Building2, Gamepad2, CalendarCheck, Trophy, MessagesSquare,
  Landmark, LifeBuoy, BarChart3, Settings, ScrollText, ShieldCheck, Menu, X, ArrowLeftRight,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import DemoUserSwitcher from './DemoUserSwitcher';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { adminSectionsFor, ROLE_LABELS } from '../../lib/permissions';

const NAV_ITEMS = [
  { key: 'dashboard', to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { key: 'users', to: '/admin/users', label: 'Users', icon: Users },
  { key: 'clubs', to: '/admin/clubs', label: 'Clubs & Courts', icon: Building2 },
  { key: 'games', to: '/admin/games', label: 'Games', icon: Gamepad2 },
  { key: 'bookings', to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { key: 'tournaments', to: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
  { key: 'communities', to: '/admin/communities', label: 'Communities', icon: MessagesSquare },
  { key: 'finance', to: '/admin/finance', label: 'Finance', icon: Landmark },
  { key: 'support', to: '/admin/support', label: 'Support', icon: LifeBuoy },
  { key: 'reports', to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', to: '/admin/settings', label: 'Settings', icon: Settings },
  { key: 'audit', to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
  { key: 'roles', to: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck },
];

export default function AdminShell() {
  const user = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = user ? adminSectionsFor(user.role) : [];
  const items = NAV_ITEMS.filter((i) => sections.includes(i.key));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-ink-800 px-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-lg">🥒</span>
        <div>
          <p className="text-sm font-bold text-white">PicklePlay</p>
          <p className="text-[11px] text-ink-400">{user ? ROLE_LABELS[user.role] : ''}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map(({ key, to, label, icon: Icon, end }) => (
          <NavLink
            key={key} to={to} end={end} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-brand-600 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
            )}
          >
            <Icon className="size-4" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink-800 p-3">
        <NavLink to="/home" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-300 hover:bg-ink-800 hover:text-white">
          <ArrowLeftRight className="size-4" /> Switch to Player App
        </NavLink>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-ink-50 lg:flex">
      {/* Sidebar is pinned to the viewport — it never scrolls with the page,
          only the content pane on the right does. */}
      <aside className="hidden h-full w-64 shrink-0 bg-ink-900 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full w-64 bg-ink-900">{sidebar}</div>
        </div>
      )}

      <div className="h-full min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </button>
          <p className="text-sm font-semibold text-ink-800">Admin Panel</p>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <DemoUserSwitcher />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <button className="fixed right-4 top-4 z-50 rounded-lg bg-white p-2 text-ink-700 shadow lg:hidden" onClick={() => setMobileOpen(false)}>
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}
