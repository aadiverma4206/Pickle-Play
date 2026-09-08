import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStore } from '../../store';
import { getQuote, bookCourt } from '../../services/bookingService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input, FormRow } from '../../components/ui/Field';
import { money, formatTime } from '../../lib/format';

const today = () => new Date().toISOString().slice(0, 10);

export default function BookCourtModal({ open, onClose, club, court, userId }) {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const navigate = useNavigate();

  const [courtId, setCourtId] = useState(court?.id);
  const [date, setDate] = useState(today());
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [error, setError] = useState('');
  const [alternatives, setAlternatives] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Reset local form state every time the modal transitions from closed to open,
  // so a previous attempt's date/time/error never leaks into the next booking.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setCourtId(court?.id);
    setDate(today());
    setStartTime('18:00');
    setEndTime('19:00');
    setError('');
    setAlternatives([]);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const selectedCourt = store.getCourt(courtId) || court;
  const quote = useMemo(() => {
    if (!selectedCourt || !date || !startTime || !endTime || startTime >= endTime) return null;
    return getQuote(selectedCourt.id, date, startTime, endTime);
  }, [selectedCourt, date, startTime, endTime]);

  const slotFree = selectedCourt && date && startTime < endTime
    ? store.isCourtSlotFree(selectedCourt.id, date, startTime, endTime)
    : true;

  if (!open || !club) return null;

  const handleFieldChange = (setter) => (e) => {
    setError('');
    setAlternatives([]);
    setter(e.target.value);
  };

  const handlePickAlternative = (alt) => {
    setError('');
    setAlternatives([]);
    setCourtId(alt.id);
  };

  const handleConfirm = () => {
    setError('');
    setAlternatives([]);
    if (date < today()) { setError('Please choose today or a future date.'); return; }
    if (startTime >= endTime) { setError('End time must be after start time.'); return; }

    setSubmitting(true);
    setTimeout(() => {
      const result = bookCourt({ userId, clubId: club.id, courtId: selectedCourt.id, date, startTime, endTime });
      setSubmitting(false);
      if (!result.ok) {
        if (result.error === 'COURT_NOT_AVAILABLE') {
          setError('This court is already booked for the selected time.');
          setAlternatives(result.alternatives || []);
        } else {
          setError(result.error);
        }
        return;
      }
      store.toast(`Booked ${selectedCourt.name} at ${club.name} for ${date}, ${formatTime(startTime)}–${formatTime(endTime)}.`, 'success');
      onClose();
      navigate('/bookings');
    }, 250);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book This Court"
      subtitle={`${club.name} · ${selectedCourt?.name}`}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} loading={submitting} disabled={!quote}>
            {quote ? `Confirm & Pay ${money(quote.amount)}` : 'Confirm & Pay'}
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        <FormRow label="Date" required>
          <Input type="date" required min={today()} value={date} onChange={handleFieldChange(setDate)} />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Start Time" required>
            <Input type="time" required value={startTime} onChange={handleFieldChange(setStartTime)} />
          </FormRow>
          <FormRow label="End Time" required>
            <Input type="time" required value={endTime} onChange={handleFieldChange(setEndTime)} />
          </FormRow>
        </div>

        {quote && (
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-ink-600"><Clock className="size-4" /> {quote.hours} hr{quote.hours === 1 ? '' : 's'} · {money(quote.ratePerHour)}/hr</span>
              <Badge tone={quote.label === 'Normal' ? 'neutral' : quote.label.includes('Weekend') ? 'brand' : 'warning'}>{quote.label}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-ink-200 pt-2">
              <span className="font-medium text-ink-800">Total</span>
              <span className="text-lg font-semibold text-ink-900">{money(quote.amount)}</span>
            </div>
            {!slotFree && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent-600">
                <AlertTriangle className="size-3.5" /> This slot looks busy — you can still try, or pick a different time.
              </p>
            )}
            {slotFree && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="size-3.5" /> Slot currently available.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="flex items-center gap-1.5 font-medium"><AlertTriangle className="size-4" /> {error}</p>
          </div>
        )}

        {alternatives.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Try one of these courts instead</p>
            {alternatives.map((alt) => {
              const altQuote = getQuote(alt.id, date, startTime, endTime);
              return (
                <button
                  key={alt.id}
                  onClick={() => handlePickAlternative(alt)}
                  className="flex w-full items-center justify-between rounded-lg border border-ink-200 px-4 py-2.5 text-left text-sm hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <span>
                    <span className="font-medium text-ink-800">{alt.name}</span>
                    <span className="ml-1.5 text-xs text-ink-500">({alt.indoorOutdoor} · {alt.surface})</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-700">
                    {altQuote ? money(altQuote.amount) : ''} <ArrowRight className="size-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
