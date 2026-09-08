import { useState } from 'react';
import { Check, X, ShieldCheck, UserCog, Lock } from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { ROLES, ROLE_LABELS, PERMISSIONS, ROLE_PERMISSIONS, can } from '../../../lib/permissions';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { Select, FormRow } from '../../../components/ui/Field';

const ROLE_ORDER = [ROLES.SUPER_ADMIN, ROLES.OPS_ADMIN, ROLES.FINANCE_ADMIN, ROLES.CLUB_MANAGER, ROLES.COMMUNITY_ADMIN, ROLES.MODERATOR, ROLES.PLAYER];

const PERMISSION_LABELS = {
  USERS_VIEW: 'View Users', USERS_MANAGE: 'Manage Users', ROLES_MANAGE: 'Manage Roles',
  CLUBS_VIEW: 'View Clubs', CLUBS_MANAGE: 'Manage All Clubs', CLUBS_MANAGE_OWN: 'Manage Own Club(s)',
  COURTS_MANAGE: 'Manage All Courts', COURTS_MANAGE_OWN: 'Manage Own Courts',
  GAMES_VIEW_ALL: 'View All Games', GAMES_MANAGE: 'Manage Games',
  BOOKINGS_VIEW_ALL: 'View All Bookings', BOOKINGS_MANAGE: 'Manage Bookings',
  TOURNAMENTS_VIEW_ALL: 'View All Tournaments', TOURNAMENTS_MANAGE: 'Manage Tournaments',
  COMMUNITIES_VIEW_ALL: 'View All Communities', COMMUNITIES_MANAGE: 'Manage All Communities', COMMUNITIES_MODERATE_OWN: 'Moderate Own Community(s)',
  FINANCE_VIEW: 'View Finance', FINANCE_MANAGE: 'Manage Finance & Refunds',
  SUPPORT_VIEW: 'View Support Tickets', SUPPORT_MANAGE: 'Manage Support Tickets',
  REPORTS_VIEW: 'View Reports', SETTINGS_MANAGE: 'Manage Platform Settings', AUDIT_VIEW: 'View Audit Logs',
  RATING_OVERRIDE: 'Override Player Ratings', RESULT_OVERRIDE: 'Override Match Results',
  ADMIN_PANEL_ACCESS: 'Access Admin Panel',
};

function ChangeRoleModal({ targetUser, onClose, adminId }) {
  const changeUserRole = useStore((s) => s.changeUserRole);
  const toast = useStore((s) => s.toast);
  const askConfirm = useStore((s) => s.askConfirm);
  const [role, setRole] = useState(targetUser?.role || ROLES.PLAYER);

  if (!targetUser) return null;

  const handleSave = () => {
    if (role === targetUser.role) return onClose();
    askConfirm({
      title: 'Change user role?',
      message: `${targetUser.name} will move from ${ROLE_LABELS[targetUser.role]} to ${ROLE_LABELS[role]}. This is audit-logged.`,
      confirmLabel: 'Change Role',
      tone: 'danger',
      onConfirm: () => {
        changeUserRole(targetUser.id, role, adminId);
        toast(`${targetUser.name} is now ${ROLE_LABELS[role]}.`, 'success');
        onClose();
      },
    });
  };

  return (
    <Modal open onClose={onClose} title="Change Role" subtitle={targetUser.name} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </>}
    >
      <FormRow label="Role">
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </Select>
      </FormRow>
    </Modal>
  );
}

export default function AdminRolesPermissionsPage() {
  const admin = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [changeTarget, setChangeTarget] = useState(null);

  const canChangeRoles = can(admin?.role, PERMISSIONS.ROLES_MANAGE);
  const permissionKeys = Object.values(PERMISSIONS);

  const usersByRole = ROLE_ORDER.reduce((acc, role) => {
    acc[role] = store.users.filter((u) => u.role === role);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Roles & Permissions"
        subtitle="The platform's access-control matrix — read-only here; permissions are defined in code, not the database."
      />

      <Card>
        <CardHeader
          title="Permission Matrix"
          subtitle="What each role can do across the platform."
          action={<ShieldCheck className="size-5 text-ink-300" />}
        />
        <CardBody className="scroll-x">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="sticky left-0 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Permission</th>
                {ROLE_ORDER.map((role) => (
                  <th key={role} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">{ROLE_LABELS[role]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {permissionKeys.map((perm) => (
                <tr key={perm}>
                  <td className="sticky left-0 whitespace-nowrap bg-white px-3 py-2 text-ink-700">{PERMISSION_LABELS[perm] || perm}</td>
                  {ROLE_ORDER.map((role) => {
                    const granted = (ROLE_PERMISSIONS[role] || []).includes(perm);
                    return (
                      <td key={role} className="px-3 py-2 text-center">
                        {granted
                          ? <Check className="mx-auto size-4 text-brand-600" />
                          : <X className="mx-auto size-4 text-ink-200" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Users by Role" subtitle="Quick reference for who currently holds each role." action={<UserCog className="size-5 text-ink-300" />} />
        <CardBody className="space-y-5">
          {ROLE_ORDER.map((role) => (
            <div key={role}>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone="brand">{ROLE_LABELS[role]}</Badge>
                <span className="text-xs text-ink-400">{usersByRole[role].length} user{usersByRole[role].length === 1 ? '' : 's'}</span>
              </div>
              {usersByRole[role].length === 0 ? (
                <p className="pl-1 text-xs text-ink-400">No users currently hold this role.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {usersByRole[role].map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={u.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-800">{u.name}</p>
                          <p className="truncate text-xs text-ink-400">{u.email}</p>
                        </div>
                      </div>
                      {canChangeRoles && u.id !== admin?.id && u.role !== ROLES.SUPER_ADMIN && (
                        <Button size="sm" variant="ghost" onClick={() => setChangeTarget(u)}>Change</Button>
                      )}
                      {u.role === ROLES.SUPER_ADMIN && (
                        <span className="flex items-center gap-1 text-xs text-ink-400"><Lock className="size-3" /> Permanent</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      {changeTarget && <ChangeRoleModal targetUser={changeTarget} onClose={() => setChangeTarget(null)} adminId={admin?.id} />}
    </div>
  );
}
