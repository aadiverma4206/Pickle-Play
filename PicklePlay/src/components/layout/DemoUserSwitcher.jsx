import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, UserCog } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import Avatar from '../ui/Avatar';
import { ROLES, ROLE_LABELS, isAdminRole } from '../../lib/permissions';

export default function DemoUserSwitcher() {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const devSwitchUser = useStore((s) => s.devSwitchUser);
  const logout = useStore((s) => s.logout);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  // Staff/admin roles (Ops, Finance, Club Manager, Community Admin,
  // Moderator) are only reachable through this shortcut when the acting
  // account is Super Admin — mirroring the real access-control model, where
  // Super Admin is the only role that manages/grants the other admin roles
  // (see Roles & Permissions > Change Role). Everyone else can still hop
  // between Player accounts to preview the player experience, but can't
  // self-escalate into another staff role.
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
  const switchableUsers = isSuperAdmin ? users : users.filter((u) => u.role === ROLES.PLAYER);

  const grouped = switchableUsers.reduce((acc, u) => {
    (acc[u.role] ||= []).push(u);
    return acc;
  }, {});

  const handleSwitch = (u) => {
    devSwitchUser(u.id);
    setOpen(false);
    toast(`Switched to ${u.name} (${ROLE_LABELS[u.role]}) — demo mode.`, 'info');
    navigate(isAdminRole(u.role) ? '/admin' : '/home');
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-ink-100">
        <Avatar name={user.name} src={user.profileImage} size="sm" />
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight text-ink-800">{user.name.split(' ')[0]}</p>
          <p className="text-[11px] leading-tight text-ink-400">{ROLE_LABELS[user.role]}</p>
        </div>
        <ChevronDown className="size-4 text-ink-400" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-ink-200 bg-white shadow-lg">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">{user.name}</p>
            <p className="text-xs text-ink-500">{user.email}</p>
          </div>
          <div className="border-b border-ink-100 py-1">
            <Link to="/profile" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50">My Profile</Link>
            {isAdminRole(user.role) && <Link to="/admin" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50">Admin Panel</Link>}
            <button onClick={() => { setOpen(false); logout(); navigate('/login'); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
              <LogOut className="size-4" /> Logout
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <p className="flex items-center gap-1.5 px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <UserCog className="size-3.5" /> {isSuperAdmin ? 'Switch demo account' : 'Switch player account'}
            </p>
            {!isSuperAdmin && (
              <p className="px-4 pb-1 text-[11px] text-ink-400">Staff and admin roles are assigned by Super Admin — see Roles &amp; Permissions.</p>
            )}
            {Object.entries(grouped).map(([role, list]) => (
              <div key={role}>
                <p className="px-4 pt-2 text-[11px] font-semibold text-ink-400">{ROLE_LABELS[role]}</p>
                {list.slice(0, 6).map((u) => (
                  <button key={u.id} onClick={() => handleSwitch(u)} className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm text-ink-700 hover:bg-ink-50 disabled:opacity-40" disabled={u.id === user.id}>
                    <Avatar name={u.name} size="xs" /> {u.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
