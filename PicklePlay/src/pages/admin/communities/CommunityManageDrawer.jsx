import { useState } from 'react';
import { CheckCircle2, XCircle, Ban, Trash2, Pin, RotateCcw, Pencil } from 'lucide-react';
import { useStore } from '../../../store';
import { approveMembership, banMember } from '../../../services/communityService';
import Drawer from '../../../components/ui/Drawer';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Tabs from '../../../components/ui/Tabs';
import { Textarea, FormRow } from '../../../components/ui/Field';
import { formatDate, timeAgo } from '../../../lib/format';
import EditCommunityModal from './EditCommunityModal';

const ROLE_TONE = { OWNER: 'brand', ADMIN: 'court', MODERATOR: 'court', MEMBER: 'neutral' };

/** Admin-facing moderation surface for a single community — pending join
 *  requests, member roster (with ban), recent posts (with removal), and a
 *  Super/Ops-only suspend toggle. Mirrors the GameManageDrawer pattern:
 *  a co-located Drawer companion to the list page (Spec Sections 45/48). */
export default function CommunityManageDrawer({ communityId, onClose, adminId, canSuspend }) {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [tab, setTab] = useState('requests');
  const [editOpen, setEditOpen] = useState(false);

  const community = communityId ? store.getCommunity(communityId) : null;
  const requests = community ? store.pendingRequestsFor(community.id) : [];
  const members = community ? store.membersOf(community.id) : [];
  const posts = community ? store.postsFor(community.id) : [];

  const close = () => { setTab('requests'); onClose(); };

  if (!community) return null;

  const handleApprove = (member, approve) => {
    const requester = store.getUser(member.userId);
    const r = approveMembership(member.id, approve, adminId);
    if (!r.ok) return store.toast(r.error, 'error');
    store.toast(approve ? `${requester?.name || 'Request'} approved.` : `${requester?.name || 'Request'} declined.`, 'success');
  };

  const handleBan = (member) => {
    const u = store.getUser(member.userId);
    let reason = '';
    store.askConfirm({
      title: `Ban ${u?.name || 'this member'}?`,
      message: 'They will be removed from the community and unable to rejoin without admin approval. This is recorded in the audit log.',
      confirmLabel: 'Ban Member',
      tone: 'danger',
      body: (
        <FormRow label="Reason" help="Shown in the audit log.">
          <Textarea rows={3} defaultValue="" onChange={(e) => { reason = e.target.value; }} placeholder="e.g. Repeated harassment reports from other members." />
        </FormRow>
      ),
      onConfirm: () => {
        const r = banMember(member.id, adminId, reason.trim() || 'No reason provided.');
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(`${u?.name || 'Member'} has been banned from the community.`, 'success');
      },
    });
  };

  const handleRemovePost = (post) => {
    store.askConfirm({
      title: 'Remove this post?',
      message: 'The post will be hidden from the community feed immediately.',
      confirmLabel: 'Remove Post',
      tone: 'danger',
      onConfirm: () => {
        store.setPostStatus(post.id, 'REMOVED', adminId);
        store.toast('Post removed from the feed.', 'success');
      },
    });
  };

  const handleSuspendToggle = () => {
    const toStatus = community.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    store.askConfirm({
      title: `${toStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} ${community.name}?`,
      message: toStatus === 'SUSPENDED'
        ? 'Members will be unable to post, join events or interact until this community is reactivated.'
        : `${community.name} will become fully active and visible again.`,
      confirmLabel: toStatus === 'SUSPENDED' ? 'Suspend Community' : 'Reactivate Community',
      tone: toStatus === 'SUSPENDED' ? 'danger' : undefined,
      onConfirm: () => {
        const fromStatus = community.status;
        store.updateCommunity(community.id, { status: toStatus });
        store.logAudit(adminId, 'COMMUNITY_STATUS_CHANGED', 'Community', community.id, fromStatus, toStatus);
        store.toast(`${community.name} is now ${toStatus.toLowerCase()}.`, 'success');
      },
    });
  };

  const tabs = [
    { value: 'requests', label: 'Requests', count: requests.length },
    { value: 'members', label: 'Members', count: members.length },
    { value: 'posts', label: 'Posts', count: posts.length },
  ];

  return (
    <Drawer open={!!communityId} onClose={close} title={community.name} widthClass="max-w-lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge status={community.status} />
            <Badge tone={community.isPrivate ? 'neutral' : 'info'}>{community.isPrivate ? 'Private' : 'Public'}</Badge>
            <Badge tone="neutral">{community.skillLevel}</Badge>
          </div>
          <div className="flex gap-1.5">
            {canSuspend && (
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Button>
            )}
            {canSuspend && (
              community.status === 'ACTIVE' ? (
                <Button size="sm" variant="outlineDanger" icon={Ban} onClick={handleSuspendToggle}>Suspend Community</Button>
              ) : (
                <Button size="sm" variant="secondary" icon={RotateCcw} onClick={handleSuspendToggle}>Reactivate</Button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-ink-600">
          <div><p className="text-xs text-ink-400">Owner</p><p className="font-medium text-ink-800">{store.getUser(community.ownerId)?.name || '—'}</p></div>
          <div><p className="text-xs text-ink-400">Location</p><p className="font-medium text-ink-800">{community.location}</p></div>
          <div><p className="text-xs text-ink-400">Members</p><p className="font-medium text-ink-800">{members.length}{community.maxMembers ? ` / ${community.maxMembers}` : ''}</p></div>
          <div><p className="text-xs text-ink-400">Created</p><p className="font-medium text-ink-800">{formatDate(community.createdAt)}</p></div>
        </div>

        {community.description && <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-600">{community.description}</p>}

        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {tab === 'requests' && (
          <div className="space-y-2">
            {requests.length === 0 && <p className="text-sm text-ink-400">No pending join requests.</p>}
            {requests.map((r) => {
              const u = store.getUser(r.userId);
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-ink-100 px-3 py-2">
                  <Avatar name={u?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{u?.name}</p>
                    <p className="text-xs text-ink-400">Requested {timeAgo(r.joinedAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" icon={CheckCircle2} onClick={() => handleApprove(r, true)}>Approve</Button>
                    <Button size="sm" variant="outlineDanger" icon={XCircle} onClick={() => handleApprove(r, false)}>Decline</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-2">
            {members.length === 0 && <p className="text-sm text-ink-400">No active members.</p>}
            {members.map((m) => {
              const u = store.getUser(m.userId);
              const canBan = m.role !== 'OWNER' && m.userId !== adminId;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-ink-100 px-3 py-2">
                  <Avatar name={u?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{u?.name}</p>
                    <p className="text-xs text-ink-400">Joined {formatDate(m.joinedAt)}</p>
                  </div>
                  <Badge tone={ROLE_TONE[m.role] || 'neutral'}>{m.role}</Badge>
                  {canBan && (
                    <Button size="sm" variant="outlineDanger" icon={Ban} onClick={() => handleBan(m)}>Ban</Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'posts' && (
          <div className="space-y-2">
            {posts.length === 0 && <p className="text-sm text-ink-400">No posts in this community yet.</p>}
            {posts.map((p) => {
              const u = store.getUser(p.userId);
              return (
                <div key={p.id} className="rounded-lg border border-ink-100 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={u?.name} size="xs" />
                      <div>
                        <p className="text-sm font-medium text-ink-800">{u?.name}{p.pinned && <Pin className="ml-1 inline size-3 text-accent-600" />}</p>
                        <p className="text-xs text-ink-400">{p.type} · {timeAgo(p.createdAt)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outlineDanger" icon={Trash2} onClick={() => handleRemovePost(p)}>Remove</Button>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">{p.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editOpen && <EditCommunityModal community={community} onClose={() => setEditOpen(false)} adminId={adminId} />}
    </Drawer>
  );
}
