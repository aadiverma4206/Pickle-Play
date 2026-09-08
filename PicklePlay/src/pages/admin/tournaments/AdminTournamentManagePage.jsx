import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Clock, Users as UsersIcon, Trophy, Lock, Wand2, PlayCircle, XCircle,
} from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { startTournament } from '../../../services/tournamentService';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Tabs from '../../../components/ui/Tabs';
import DataTable from '../../../components/ui/DataTable';
import { LoadingState } from '../../../components/ui/States';
import { formatDate, money } from '../../../lib/format';
import GenerateFixturesModal from './GenerateFixturesModal';
import CancelTournamentModal from './CancelTournamentModal';
import BracketEditor from './BracketEditor';

export default function AdminTournamentManagePage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const admin = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const { toast, askConfirm } = store;

  const [tab, setTab] = useState('registrations');
  const [fixturesModalOpen, setFixturesModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const tournament = store.getTournament(tournamentId);
  const registrations = tournament ? store.registrationsFor(tournamentId) : [];
  const matches = tournament ? store.matchesFor(tournamentId) : [];
  const venue = tournament ? store.getClub(tournament.venueClubId) : null;

  if (!tournament) return <LoadingState label="Loading tournament…" />;

  const canManage = can(admin?.role, PERMISSIONS.TOURNAMENTS_MANAGE);
  const activeRegistrations = registrations.filter((r) => !['CANCELLED', 'WITHDRAWN'].includes(r.status));
  const confirmedCount = registrations.filter((r) => r.status === 'CONFIRMED').length;
  const minParticipants = store.settings?.tournament?.minParticipants ?? 4;

  const canCloseRegistration = canManage && tournament.status === 'REGISTRATION_OPEN';
  const canGenerateFixtures = canManage && tournament.status === 'REGISTRATION_CLOSED' && matches.length === 0;
  const canStart = canManage && matches.length > 0 && !['LIVE', 'COMPLETED', 'CANCELLED'].includes(tournament.status);
  const canCancel = canManage && !['COMPLETED', 'CANCELLED'].includes(tournament.status);

  const handleCloseRegistration = () => {
    askConfirm({
      title: 'Close registration?',
      message: `No new players will be able to register for ${tournament.name} after this. You can generate fixtures once enough registrations are confirmed.`,
      confirmLabel: 'Close Registration',
      onConfirm: () => {
        const r = store.transitionTournament(tournament.id, 'REGISTRATION_CLOSED');
        if (!r.ok) return toast(r.error, 'error');
        toast('Registration closed.', 'success');
      },
    });
  };

  const handleStart = () => {
    askConfirm({
      title: 'Start tournament?',
      message: `${tournament.name} will go LIVE and organizers can begin entering match results.`,
      confirmLabel: 'Start Tournament',
      onConfirm: () => {
        const r = startTournament(tournament.id, admin.id);
        if (!r.ok) return toast(r.error, 'error');
        toast('Tournament is now live!', 'success');
      },
    });
  };

  const tabs = [
    { value: 'registrations', label: 'Registrations', count: registrations.length },
    { value: 'fixtures', label: 'Fixtures & Bracket', count: matches.length },
  ];

  return (
    <div>
      <button onClick={() => navigate('/admin/tournaments')} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="size-4" /> Back to Tournaments
      </button>

      <Card className="mb-6">
        <CardHeader
          title={tournament.name}
          subtitle={`${tournament.category} · ${tournament.format} · ${tournament.skillLevel}`}
          action={<Badge status={tournament.status} className="text-sm" />}
        />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm text-ink-600 sm:grid-cols-4">
            <Info icon={MapPin} label={venue?.name || '—'} sub={venue?.city} />
            <Info icon={Calendar} label={`${formatDate(tournament.startDate)} – ${formatDate(tournament.endDate)}`} sub="Tournament dates" />
            <Info icon={Clock} label={`${formatDate(tournament.registrationStart)} – ${formatDate(tournament.registrationEnd)}`} sub="Registration window" />
            <Info icon={UsersIcon} label={`${activeRegistrations.length}/${tournament.maxParticipants}`} sub={`Registered · ${confirmedCount} confirmed`} />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="neutral">{tournament.entryFee > 0 ? `Entry Fee ${money(tournament.entryFee)}` : 'Free Entry'}</Badge>
            {tournament.prize && (
              <Badge tone="warning" className="normal-case">
                <Trophy className="mr-1 inline size-3 -mt-0.5" />{tournament.prize}
              </Badge>
            )}
            <span className="text-ink-500">Organized by <span className="font-medium text-ink-800">{store.getUser(tournament.organizerId)?.name || 'Platform'}</span></span>
          </div>

          {tournament.rules && <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-600">{tournament.rules}</p>}

          {(canCloseRegistration || canGenerateFixtures || canStart || canCancel) && (
            <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
              {canCloseRegistration && <Button variant="secondary" icon={Lock} onClick={handleCloseRegistration}>Close Registration</Button>}
              {canGenerateFixtures && <Button variant="court" icon={Wand2} onClick={() => setFixturesModalOpen(true)}>Generate Fixtures</Button>}
              {canStart && <Button icon={PlayCircle} onClick={handleStart}>Start Tournament</Button>}
              {canCancel && <Button variant="outlineDanger" icon={XCircle} onClick={() => setCancelModalOpen(true)}>Cancel Tournament</Button>}
            </div>
          )}
        </CardBody>
      </Card>

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'registrations' && (
        <DataTable
          columns={[
            { key: 'player', header: 'Player', render: (row) => {
              const u = store.getUser(row.userId);
              return (
                <div className="flex items-center gap-2.5">
                  <Avatar name={u?.name} size="sm" />
                  <span className="font-medium text-ink-800">{u?.name || '—'}</span>
                </div>
              );
            } },
            { key: 'partner', header: 'Partner / Team', render: (row) => {
              const partner = row.partnerId ? store.getUser(row.partnerId) : null;
              return partner ? `${partner.name}${row.teamName ? ` (${row.teamName})` : ''}` : row.teamName || '—';
            } },
            { key: 'status', header: 'Registration', render: (row) => <Badge status={row.status} /> },
            { key: 'payment', header: 'Payment', render: (row) => <Badge status={row.paymentStatus} /> },
            { key: 'registeredAt', header: 'Registered', render: (row) => formatDate(row.registeredAt) },
          ]}
          rows={registrations}
          emptyTitle="No registrations yet"
          emptyMessage="Players who register for this tournament will appear here."
        />
      )}

      {tab === 'fixtures' && (
        <Card>
          <CardBody>
            <BracketEditor matches={matches} store={store} adminId={admin?.id} />
          </CardBody>
        </Card>
      )}

      <GenerateFixturesModal
        open={fixturesModalOpen}
        onClose={() => setFixturesModalOpen(false)}
        tournament={tournament}
        registrations={registrations}
        minParticipants={minParticipants}
        adminId={admin?.id}
        store={store}
      />

      <CancelTournamentModal
        open={cancelModalOpen}
        tournament={tournament}
        adminId={admin?.id}
        store={store}
        onClose={() => setCancelModalOpen(false)}
      />
    </div>
  );
}

function Info({ icon: Icon, label, sub }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 text-ink-400" />
      <div>
        <p className="font-medium text-ink-800">{label}</p>
        {sub && <p className="text-xs text-ink-400">{sub}</p>}
      </div>
    </div>
  );
}
