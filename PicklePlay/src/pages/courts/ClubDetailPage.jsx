import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, Building2, Info, Ticket } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { getQuote } from '../../services/bookingService';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LoadingState } from '../../components/ui/States';
import { money, formatTime } from '../../lib/format';
import BookCourtModal from './BookCourtModal';

export default function ClubDetailPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const club = store.getClub(clubId);
  const courts = (clubId ? store.courtsForClub(clubId) : []).slice().sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  const [bookingCourt, setBookingCourt] = useState(null);

  if (!club) return <LoadingState label="Loading club…" />;

  const availableCount = courts.filter((c) => c.status === 'AVAILABLE').length;
  const exampleCourt = courts.find((c) => c.status === 'AVAILABLE') || courts[0];
  const exampleQuote = exampleCourt ? getQuote(exampleCourt.id, new Date().toISOString().slice(0, 10), '18:00', '19:00') : null;

  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={() => navigate('/courts')} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="size-4" /> Back to Clubs
      </button>

      <Card className="mb-6 overflow-hidden border border-ink-100 shadow-md">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-ink-900 text-white">
          {club.photos && club.photos[0] ? (
            <>
              <img
                src={club.photos[0]}
                alt={club.name}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/40 to-transparent" />
            </>
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700">
              <Building2 className="size-14 opacity-90" />
            </div>
          )}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
            <span className="rounded-full bg-court-500/20 px-3 py-1 text-xs font-bold text-court-300 backdrop-blur-md border border-court-400/30 uppercase tracking-wider">
              {club.city} Premier Sports Facility
            </span>
          </div>
        </div>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-semibold text-ink-900">{club.name}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500"><MapPin className="size-4 shrink-0" /> {club.address}</p>
            </div>
            <Badge status={club.status} className="text-sm" />
          </div>

          <p className="text-sm text-ink-600">{club.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-ink-600">
            <span className="flex items-center gap-1.5"><Clock className="size-4 text-ink-400" /> {club.openingHours}</span>
            {club.contact && <span className="flex items-center gap-1.5"><Phone className="size-4 text-ink-400" /> {club.contact}</span>}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(club.facilities || []).map((f) => <Badge key={f} tone="neutral">{f}</Badge>)}
          </div>
        </CardBody>
      </Card>

      {exampleQuote && (
        <Card className="mb-6 border-court-200 bg-court-50/40">
          <CardBody className="flex flex-wrap items-center gap-2 text-sm text-court-800">
            <Info className="size-4 shrink-0 text-court-600" />
            <span>
              Pricing example: <strong>{exampleCourt.name}</strong> today {formatTime('18:00')}–{formatTime('19:00')} would cost{' '}
              <strong>{money(exampleQuote.amount)}</strong> ({exampleQuote.label} rate, {money(exampleQuote.ratePerHour)}/hr). Peak-hour and weekend
              pricing applies automatically based on the date and time you choose.
            </span>
          </CardBody>
        </Card>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink-900">Courts</h2>
        <span className="text-sm text-ink-500">{availableCount} of {courts.length} available now</span>
      </div>

      {courts.length === 0 ? (
        <Card><CardBody className="text-center text-sm text-ink-500">This club has no courts listed yet.</CardBody></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courts.map((court) => {
            const isAvailable = court.status === 'AVAILABLE';
            return (
              <Card key={court.id} className="flex flex-col">
                <CardHeader
                  title={court.name}
                  subtitle={`${court.indoorOutdoor} · ${court.surface}`}
                  action={<Badge status={court.status} />}
                />
                <CardBody className="flex-1 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm">
                    <span className="text-ink-500">Base rate</span>
                    <span className="font-semibold text-ink-800">{money(court.pricing?.base)}/hr</span>
                  </div>
                  <p className="flex items-start gap-1.5 text-xs text-ink-400">
                    <Ticket className="mt-0.5 size-3.5 shrink-0" />
                    Peak-hour ({(court.pricing?.peakWindows || []).map((w) => `${formatTime(w.start)}–${formatTime(w.end)}`).join(', ') || 'evenings'}) and weekend rates are higher — the exact price is shown before you confirm.
                  </p>
                </CardBody>
                <div className="border-t border-ink-100 px-5 py-3">
                  {isAvailable ? (
                    <Button className="w-full" onClick={() => setBookingCourt(court)}>Book This Court</Button>
                  ) : (
                    <Button className="w-full" variant="secondary" disabled>
                      {court.status === 'MAINTENANCE' ? 'Under Maintenance' : 'Not Available'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {user && (
        <p className="mt-6 text-center text-sm text-ink-500">
          Already booked a court? <Link to="/bookings" className="font-medium text-brand-600 hover:underline">View My Bookings</Link>
        </p>
      )}

      <BookCourtModal
        open={!!bookingCourt}
        onClose={() => setBookingCourt(null)}
        club={club}
        court={bookingCourt}
        userId={user?.id}
      />
    </div>
  );
}
