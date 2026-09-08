import { useState } from 'react';
import { PlusCircle, LifeBuoy, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { timeAgo } from '../../lib/format';
import NewTicketModal from './NewTicketModal';

export default function SupportPage() {
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState({});

  if (!user) return <LoadingState label="Loading support tickets…" />;

  const tickets = store.ticketsForUser(user.id);

  const toggleExpanded = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeader
        title="Support"
        subtitle="Raise and track support tickets."
        action={<Button icon={PlusCircle} onClick={() => setModalOpen(true)}>New Ticket</Button>}
      />

      {tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support tickets yet"
          message="Run into a problem with a game, booking, payment or anything else? Raise a ticket and our team will help."
          action={<Button icon={PlusCircle} onClick={() => setModalOpen(true)}>New Ticket</Button>}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const isOpen = !!expanded[t.id];
            const responseCount = t.responses?.length || 0;
            return (
              <Card key={t.id}>
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{t.subject}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone="neutral">{t.category}</Badge>
                        <Badge status={t.status} />
                      </div>
                    </div>
                    <div className="text-right text-xs text-ink-400">
                      <p>Opened {timeAgo(t.createdAt)}</p>
                      {t.updatedAt !== t.createdAt && <p>Updated {timeAgo(t.updatedAt)}</p>}
                    </div>
                  </div>

                  <p className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-600">{t.description}</p>

                  <button
                    onClick={() => toggleExpanded(t.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                  >
                    <MessageSquare className="size-3.5" />
                    {responseCount > 0 ? `${responseCount} response${responseCount > 1 ? 's' : ''}` : 'No responses yet'}
                    {isOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                  {isOpen && (
                    <div className="space-y-2 border-t border-ink-100 pt-3">
                      {responseCount === 0 ? (
                        <p className="text-sm text-ink-400">Our support team hasn't responded yet — check back soon.</p>
                      ) : (
                        t.responses.map((r, idx) => {
                          const responder = store.getUser(r.by);
                          return (
                            <div key={idx} className="flex items-start gap-2.5">
                              <Avatar name={responder?.name || 'Support'} size="xs" />
                              <div className="min-w-0 flex-1 rounded-lg bg-court-50 px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold text-ink-800">{responder?.name || 'Support Team'}</p>
                                  <p className="text-xs text-ink-400">{timeAgo(r.at)}</p>
                                </div>
                                <p className="mt-0.5 text-sm text-ink-700">{r.message}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <NewTicketModal open={modalOpen} onClose={() => setModalOpen(false)} userId={user.id} />
    </div>
  );
}
