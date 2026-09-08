import { useState } from 'react';
import { UserPlus, Send } from 'lucide-react';
import { useStore } from '../../../store';
import { TICKET_TRANSITIONS } from '../../../lib/stateMachines';
import Drawer from '../../../components/ui/Drawer';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import { Textarea, Select, FormRow } from '../../../components/ui/Field';
import { formatDateTime, timeAgo } from '../../../lib/format';

/** Admin-facing detail + moderation surface for a single support ticket —
 *  response thread, reply composer, assignment and status transition,
 *  all gated through the legal TICKET_TRANSITIONS graph (Spec Section 48). */
export default function TicketManageDrawer({ ticketId, onClose, adminId }) {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [message, setMessage] = useState('');
  const [replyError, setReplyError] = useState('');

  const ticket = ticketId ? store.getTicket(ticketId) : null;

  const close = () => { setMessage(''); setReplyError(''); onClose(); };

  if (!ticket) return null;

  const requester = store.getUser(ticket.userId);
  const assignee = ticket.assignedTo ? store.getUser(ticket.assignedTo) : null;
  const nextStatuses = TICKET_TRANSITIONS[ticket.status] || [];
  const isClosed = ticket.status === 'CLOSED';

  const handleAssign = () => {
    store.assignTicket(ticket.id, adminId);
    store.toast('Ticket assigned to you.', 'success');
  };

  const handleTransition = (toStatus) => {
    if (!toStatus || toStatus === ticket.status) return;
    const r = store.transitionTicket(ticket.id, toStatus);
    if (!r.ok) return store.toast(r.error, 'error');
    store.toast(`Ticket status updated to ${toStatus.toLowerCase().replaceAll('_', ' ')}.`, 'success');
  };

  const handleReply = () => {
    if (!message.trim()) { setReplyError('Please enter a reply message.'); return; }
    store.respondToTicket(ticket.id, adminId, message.trim());
    store.toast('Reply sent to the user.', 'success');
    setMessage('');
    setReplyError('');
  };

  return (
    <Drawer open={!!ticketId} onClose={close} title={ticket.subject} widthClass="max-w-lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge status={ticket.status} />
          <Badge tone="neutral">{ticket.category}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-ink-600">
          <div><p className="text-xs text-ink-400">Raised By</p><p className="font-medium text-ink-800">{requester?.name || 'Unknown'}</p></div>
          <div><p className="text-xs text-ink-400">Assigned To</p><p className="font-medium text-ink-800">{assignee?.name || 'Unassigned'}</p></div>
          <div><p className="text-xs text-ink-400">Opened</p><p className="font-medium text-ink-800">{formatDateTime(ticket.createdAt)}</p></div>
          <div><p className="text-xs text-ink-400">Last Updated</p><p className="font-medium text-ink-800">{timeAgo(ticket.updatedAt)}</p></div>
        </div>

        <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-600">{ticket.description}</p>

        <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4">
          {!ticket.assignedTo && !isClosed && (
            <Button size="sm" variant="secondary" icon={UserPlus} onClick={handleAssign}>Assign to me</Button>
          )}
          <FormRow label="Status">
            <Select
              value={ticket.status}
              disabled={nextStatuses.length === 0}
              onChange={(e) => handleTransition(e.target.value)}
              className="max-w-[220px]"
            >
              <option value={ticket.status}>{ticket.status.replaceAll('_', ' ')} (current)</option>
              {nextStatuses.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
            </Select>
          </FormRow>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-800">Response Thread ({ticket.responses?.length || 0})</p>
          <div className="space-y-2.5">
            {(!ticket.responses || ticket.responses.length === 0) && (
              <p className="text-sm text-ink-400">No responses yet.</p>
            )}
            {ticket.responses?.map((r, idx) => {
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
            })}
          </div>
        </div>

        {isClosed ? (
          <p className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-500">This ticket is closed and cannot be reopened or replied to.</p>
        ) : (
          <FormRow label="Reply to user" error={replyError}>
            <div className="space-y-2">
              <Textarea
                rows={3}
                value={message}
                onChange={(e) => { setMessage(e.target.value); if (replyError) setReplyError(''); }}
                placeholder="Type your response…"
              />
              <Button size="sm" icon={Send} onClick={handleReply}>Send Reply</Button>
            </div>
          </FormRow>
        )}
      </div>
    </Drawer>
  );
}
