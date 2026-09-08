import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { Home, Search, MapPinned, Users, Trophy, LineChart, CalendarCheck, Award, ShieldCheck } from 'lucide-react';
import NotificationBell from './NotificationBell';
import DemoUserSwitcher from './DemoUserSwitcher';
import RoleActivityTrackerModal from '../ui/RoleActivityTrackerModal';

const DESKTOP_NAV = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/games', label: 'Games', icon: Search },
  { to: '/courts', label: 'Courts', icon: MapPinned },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/tournaments', label: 'Tournaments', icon: Trophy },
  { to: '/performance', label: 'Performance', icon: LineChart },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
];

const MOBILE_NAV = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/games', label: 'Games', icon: Search },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/tournaments', label: 'Tournaments', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: Award },
];

export default function PlayerShell() {
  const [trackerOpen, setTrackerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <NavLink to="/home" className="flex items-center gap-2 shrink-0">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-lg">🥒</span>
            <span className="hidden text-lg font-bold text-ink-900 sm:block">PicklePlay</span>
          </NavLink>
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {DESKTOP_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) => clsx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                )}
              >
                <Icon className="size-4" /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTrackerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-court-200 bg-court-50 px-2.5 py-1.5 text-xs font-semibold text-court-800 hover:bg-court-100 hover:border-court-300 transition-all shadow-sm"
              title="Track role capabilities and real-time activity"
            >
              <ShieldCheck className="size-4 text-court-600" />
              <span className="hidden md:inline">Role Tracker</span>
            </button>
            <NotificationBell />
            <DemoUserSwitcher />
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-ink-100 px-4 py-1.5 lg:hidden">
          {DESKTOP_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => clsx(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500'
              )}
            >
              <Icon className="size-3.5" /> {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-ink-200 bg-white py-1.5 lg:hidden">
        {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => clsx(
              'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium',
              isActive ? 'text-brand-700' : 'text-ink-400'
            )}
          >
            <Icon className="size-5" /> {label}
          </NavLink>
        ))}
      </nav>

      <RoleActivityTrackerModal open={trackerOpen} onClose={() => setTrackerOpen(false)} />
    </div>
  );
}
