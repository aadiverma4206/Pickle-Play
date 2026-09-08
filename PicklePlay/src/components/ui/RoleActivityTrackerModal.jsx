import { useState } from 'react';
import {
  ShieldCheck, Activity, Users, Shield, Award, Landmark,
  Building2, CheckCircle2, Clock, Filter, Lock,
} from 'lucide-react';
import { useStore } from '../../store';
import { ROLES, ROLE_PERMISSIONS } from '../../lib/permissions';
import Modal from './Modal';
import Badge from './Badge';
import Avatar from './Avatar';
import { formatDate } from '../../lib/format';

const ROLE_DETAILS = {
  [ROLES.SUPER_ADMIN]: {
    label: 'Super Admin',
    icon: Shield,
    color: 'border-purple-200 bg-purple-50 text-purple-800',
    tagTone: 'danger',
    description: 'Supreme platform governance, RBAC role assignments, permanent deletions, and security audit logs.',
    responsibilities: [
      'Manage & assign roles across all users',
      'Oversee platform-wide security audit trails',
      'Authorize irreversible actions (hard deletes, system resets)',
      'Platform configuration and operational controls',
    ],
  },
  [ROLES.OPS_ADMIN]: {
    label: 'Operations Admin',
    icon: Activity,
    color: 'border-blue-200 bg-blue-50 text-blue-800',
    tagTone: 'info',
    description: 'Day-to-day sport operations, club verifications, match schedules, tournaments, and dispute resolutions.',
    responsibilities: [
      'Manage all clubs, courts, and bookings',
      'Oversee matches and tournament fixtures',
      'Force-start matches and handle walkovers/disputes',
      'Review and resolve support tickets',
    ],
  },
  [ROLES.FINANCE_ADMIN]: {
    label: 'Finance Admin',
    icon: Landmark,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    tagTone: 'success',
    description: 'Financial oversight, transaction auditing, refund settlements, and revenue compliance.',
    responsibilities: [
      'Audit all booking and entry fee transactions',
      'Process manual and automated policy refunds',
      'Inspect financial reports and payout flows',
      'Ensure strict adherence to payment security bounds',
    ],
  },
  [ROLES.CLUB_MANAGER]: {
    label: 'Club Manager',
    icon: Building2,
    color: 'border-amber-200 bg-amber-50 text-amber-800',
    tagTone: 'warning',
    description: 'Local club venue management, court slot pricing, court maintenance, and hosted club matches.',
    responsibilities: [
      'Maintain assigned club profile & courts',
      'Configure court availability and slot pricing',
      'Host official club pickleball matches',
      'Supervise on-court player check-ins',
    ],
  },
  [ROLES.COMMUNITY_ADMIN]: {
    label: 'Community Admin',
    icon: Users,
    color: 'border-teal-200 bg-teal-50 text-teal-800',
    tagTone: 'brand',
    description: 'Player community moderation, club group management, and social sport engagement.',
    responsibilities: [
      'Manage member approvals in local clubs',
      'Moderate community discussion threads & feed',
      'Organize casual meetups and pickleball clinics',
      'Maintain positive sportsmanship guidelines',
    ],
  },
  [ROLES.MODERATOR]: {
    label: 'Moderator',
    icon: ShieldCheck,
    color: 'border-cyan-200 bg-cyan-50 text-cyan-800',
    tagTone: 'brand',
    description: 'Frontline community safety, reported message reviews, and code of conduct enforcement.',
    responsibilities: [
      'Review flagged player posts & comments',
      'Issue sportsmanship warnings & temporary mutes',
      'Ensure clean, safe player networking environment',
    ],
  },
  [ROLES.PLAYER]: {
    label: 'Player',
    icon: Award,
    color: 'border-lime-200 bg-lime-50 text-lime-800',
    tagTone: 'brand',
    description: 'Grassroots athlete, open-play game creator, tournament participant, and skill-ranked competitor.',
    responsibilities: [
      'Create public or private matches (₹200–₹2,00,000 bounds)',
      'Join court games and compete in tournaments',
      'Earn skill ratings, streaks, and achievement trophies',
      'Benefit from protected match prices and guaranteed refunds',
    ],
  },
};

export default function RoleActivityTrackerModal({ open, onClose }) {
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [activeTab, setActiveTab] = useState('FEED'); // 'FEED' | 'ROLES_MATRIX'
  const store = useStore();

  const auditLogs = store.auditLogs || [];
  const users = store.users || [];

  const filteredLogs = selectedRole === 'ALL'
    ? auditLogs.slice(0, 40)
    : auditLogs.filter((log) => {
        const u = users.find((x) => x.id === log.adminId || x.id === log.actorId);
        const role = log.actorRole || u?.role || 'SYSTEM';
        return role === selectedRole;
      }).slice(0, 40);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Role Activity Tracker & Transparency Hub"
      subtitle="Real-time audit log, active capabilities, and data security matrix."
      size="xl"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-ink-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('FEED')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'FEED'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <Activity className="size-4" /> Live Role Activity Feed ({auditLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ROLES_MATRIX')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'ROLES_MATRIX'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <Shield className="size-4" /> Role Duties & Security Matrix
          </button>
        </div>

        {activeTab === 'FEED' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="flex items-center gap-1 font-semibold text-ink-500 mr-1">
                <Filter className="size-3.5" /> Filter Role:
              </span>
              <button
                type="button"
                onClick={() => setSelectedRole('ALL')}
                className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                  selectedRole === 'ALL'
                    ? 'bg-ink-900 text-white shadow-sm'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                All Roles
              </button>
              {Object.keys(ROLE_DETAILS).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                    selectedRole === role
                      ? 'bg-court-700 text-white shadow-sm'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                  }`}
                >
                  {ROLE_DETAILS[role].label}
                </button>
              ))}
            </div>

            {/* Logs List */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-200 p-8 text-center text-ink-400">
                  <Activity className="mx-auto size-8 text-ink-300 mb-2 opacity-60" />
                  <p className="text-sm font-medium">No actions recorded for this role yet.</p>
                  <p className="text-xs text-ink-400 mt-1">Actions like creating games, joining, managing courts, or refunds will be live-tracked here.</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const actor = users.find((u) => u.id === log.adminId || u.id === log.actorId);
                  const role = log.actorRole || actor?.role || 'SYSTEM';
                  const roleMeta = ROLE_DETAILS[role] || { label: role, color: 'bg-ink-100 text-ink-700' };

                  return (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white p-3.5 shadow-sm hover:border-court-200 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={log.actorName || actor?.name || 'User'} size="sm" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-ink-900">
                              {log.actorName || actor?.name || 'System'}
                            </span>
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleMeta.color}`}>
                              {roleMeta.label}
                            </span>
                            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-mono text-ink-500">
                              {log.securityTag || `SEC-${log.id.slice(0, 6)}`}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-ink-600 truncate">
                            <span className="font-semibold text-ink-800">{log.action}</span>
                            {log.note && <span className="ml-1.5 text-ink-500">({log.note})</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center text-xs text-ink-400 shrink-0">
                        <Clock className="size-3.5" />
                        <span>{formatDate(log.createdAt, 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'ROLES_MATRIX' && (
          <div className="grid gap-4 sm:grid-cols-2 max-h-[460px] overflow-y-auto pr-1">
            {Object.entries(ROLE_DETAILS).map(([role, data]) => {
              const RoleIcon = data.icon;
              const permissions = ROLE_PERMISSIONS[role] || [];

              return (
                <div key={role} className="flex flex-col justify-between rounded-2xl border border-ink-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex size-9 items-center justify-center rounded-xl ${data.color}`}>
                          <RoleIcon className="size-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-ink-900">{data.label}</h4>
                          <span className="text-[11px] text-ink-400 font-medium">Role: {role}</span>
                        </div>
                      </div>
                      <Badge tone={data.tagTone}>{permissions.length} Perms</Badge>
                    </div>

                    <p className="text-xs text-ink-600 leading-relaxed">{data.description}</p>

                    <div className="space-y-1.5 pt-2 border-t border-ink-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Core Duties & Rules</p>
                      {data.responsibilities.map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-ink-700">
                          <CheckCircle2 className="size-3.5 text-court-600 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between text-[11px] text-ink-400">
                    <span className="flex items-center gap-1 font-medium text-court-700">
                      <Lock className="size-3" /> Security Protected
                    </span>
                    <span>Audited on every change</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
