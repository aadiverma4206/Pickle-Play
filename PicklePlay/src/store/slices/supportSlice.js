import { genTicketId } from '../../lib/id';
import { TICKET_TRANSITIONS, assertTransition } from '../../lib/stateMachines';

export const createSupportSlice = (set, get) => ({
  tickets: [],

  ticketsForUser: (userId) => get().tickets.filter((t) => t.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  getTicket: (id) => get().tickets.find((t) => t.id === id) || null,

  createTicket: ({ userId, category, subject, description }) => {
    const ticket = {
      id: genTicketId(), userId, category, subject, description, status: 'NEW',
      assignedTo: null, responses: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    set((state) => { state.tickets.push(ticket); });
    return ticket;
  },

  assignTicket: (ticketId, adminId) => {
    set((state) => {
      const t = state.tickets.find((x) => x.id === ticketId);
      if (t) { t.assignedTo = adminId; if (t.status === 'NEW') t.status = 'ASSIGNED'; t.updatedAt = new Date().toISOString(); }
    });
  },

  respondToTicket: (ticketId, adminId, message) => {
    set((state) => {
      const t = state.tickets.find((x) => x.id === ticketId);
      if (t) { t.responses.push({ by: adminId, message, at: new Date().toISOString() }); t.updatedAt = new Date().toISOString(); }
    });
  },

  transitionTicket: (ticketId, toStatus) => {
    const ticket = get().getTicket(ticketId);
    if (!ticket) return { ok: false, error: 'Ticket not found.' };
    try {
      assertTransition(TICKET_TRANSITIONS, ticket.status, toStatus, 'ticket');
    } catch (e) {
      return { ok: false, error: e.message };
    }
    set((state) => {
      const t = state.tickets.find((x) => x.id === ticketId);
      if (t) { t.status = toStatus; t.updatedAt = new Date().toISOString(); }
    });
    return { ok: true };
  },
});
