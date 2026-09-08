import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, MapPin, Users as UsersIcon, Lock, Globe2, Users2 } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { joinCommunity } from '../../services/communityService';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SearchInput from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/States';
import CreateCommunityModal from './CreateCommunityModal';

const SKILL_FILTERS = ['All Levels', 'Beginner', 'Intermediate', 'Intermediate+', 'Advanced', 'Professional'];

export default function CommunityListPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  // Whole-store subscription — communityMembers-derived getters below build
  // fresh arrays every call, so they must be invoked in the render body off
  // a stable store reference rather than inside a useStore(selector).
  const store = useStore();

  const [search, setSearch] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const communities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.communities
      .filter((c) => c.status === 'ACTIVE')
      .filter((c) => (skillLevel ? c.skillLevel === skillLevel : true))
      .filter((c) => (q ? `${c.name} ${c.location} ${c.description || ''}`.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.communities, search, skillLevel]);

  const handleJoin = (community) => {
    const result = joinCommunity(community.id, user.id);
    if (!result.ok) return store.toast(result.error, 'error');
    if (result.status === 'PENDING') {
      store.toast('Request sent — the community owner will review it.', 'info');
    } else {
      store.toast(`You joined "${community.name}"!`, 'success');
      navigate(`/community/${community.id}`);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Communities"
        subtitle="Find your people — join a local community, share your journey and take on challenges."
        action={<Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Community</Button>}
      />

      <Card className="mb-5">
        <CardBody className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, location or description…" />
          <Select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)}>
            <option value="">All Skill Levels</option>
            {SKILL_FILTERS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </CardBody>
      </Card>

      {communities.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No communities match your search"
          message="Try a different search, or start your own community."
          action={<Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Community</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {communities.map((c) => {
            const memberCount = store.membersOf(c.id).length;
            const membership = user ? store.membershipOf(c.id, user.id) : null;
            return (
              <Card key={c.id} className="flex flex-col">
                <CardBody className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/community/${c.id}`} className="text-sm font-semibold text-ink-900 hover:text-brand-700 hover:underline">
                      {c.name}
                    </Link>
                    <span className="flex shrink-0 items-center gap-1 text-ink-400">
                      {c.isPrivate ? <Lock className="size-3.5" /> : <Globe2 className="size-3.5" />}
                      <Badge tone={c.isPrivate ? 'neutral' : 'success'}>{c.isPrivate ? 'Private' : 'Public'}</Badge>
                    </span>
                  </div>
                  {c.description && <p className="line-clamp-2 text-xs text-ink-500">{c.description}</p>}
                  <div className="space-y-1 text-xs text-ink-500">
                    <p className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {c.location}</p>
                    <p className="flex items-center gap-1.5"><UsersIcon className="size-3.5" /> {memberCount}{c.maxMembers ? `/${c.maxMembers}` : ''} members</p>
                  </div>
                  <Badge tone="neutral">{c.skillLevel}</Badge>
                </CardBody>
                <div className="border-t border-ink-100 px-5 py-3">
                  {membership?.status === 'ACTIVE' ? (
                    <Button className="w-full" variant="secondary" onClick={() => navigate(`/community/${c.id}`)}>View Community</Button>
                  ) : membership?.status === 'PENDING' ? (
                    <Button className="w-full" variant="secondary" disabled>Request Pending</Button>
                  ) : membership?.status === 'BANNED' ? (
                    <Button className="w-full" variant="secondary" disabled>Membership Restricted</Button>
                  ) : (
                    <Button className="w-full" onClick={() => handleJoin(c)}>{c.isPrivate ? 'Request to Join' : 'Join Community'}</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCommunityModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
