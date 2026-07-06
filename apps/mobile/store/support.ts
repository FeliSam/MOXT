import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type TicketCategory = 'account' | 'transfer' | 'parcel' | 'payment' | 'technical' | 'other';

export type TicketMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isAgent: boolean;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  messages: TicketMessage[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
};

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

type SupportState = {
  tickets: SupportTicket[];
  faq: FAQItem[];
  loading: boolean;
};

const DEFAULT_FAQ: FAQItem[] = [
  { id: 'faq-1', question: 'Comment créer un transfert ?', answer: 'Depuis l\'accueil, appuyez sur "Envoyer" et suivez les étapes du wizard. Choisissez le montant, la devise, et le destinataire.', category: 'transfer' },
  { id: 'faq-2', question: 'Combien de temps prend un transfert ?', answer: 'Les transferts sont généralement traités en 1 à 24 heures selon la destination et le mode de paiement choisi.', category: 'transfer' },
  { id: 'faq-3', question: 'Comment vérifier mon identité (KYC) ?', answer: 'Allez dans Paramètres > Vérification KYC, puis uploadez une photo recto/verso de votre pièce d\'identité.', category: 'account' },
  { id: 'faq-4', question: 'Comment ouvrir un litige ?', answer: 'Depuis l\'accueil, appuyez sur "Litiges" > "Nouveau", sélectionnez le motif et décrivez votre problème.', category: 'other' },
  { id: 'faq-5', question: 'Quels moyens de paiement sont acceptés ?', answer: 'Mobile Money (Orange, Wave, MTN, Moov), carte bancaire (Visa/Mastercard via Stripe), et virement bancaire (SEPA).', category: 'payment' },
  { id: 'faq-6', question: 'Comment parrainer un ami ?', answer: 'Allez dans "Parrainage" depuis l\'accueil, partagez votre code unique. Votre ami le saisit à l\'inscription et vous gagnez une récompense.', category: 'account' },
  { id: 'faq-7', question: 'Comment publier un colis ?', answer: 'Onglet "Colis" > bouton "+", remplissez les informations de trajet, poids, et tarif souhaité.', category: 'parcel' },
  { id: 'faq-8', question: 'L\'application fonctionne-t-elle hors connexion ?', answer: 'Oui, vos données sont mises en cache localement. Les actions sont synchronisées dès le retour de la connexion.', category: 'technical' },
];

const initialState: SupportState = {
  tickets: [],
  faq: DEFAULT_FAQ,
  loading: false,
};

export const loadTickets = createAsyncThunk(
  'support/loadTickets',
  async (userId: string) => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return (data || []).map((row: any): SupportTicket => ({
      id: row.id,
      userId: row.user_id,
      subject: row.subject,
      category: row.category,
      priority: row.priority,
      status: row.status,
      messages: row.messages || [],
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },
);

export const createTicket = createAsyncThunk(
  'support/createTicket',
  async (params: { userId: string; subject: string; category: TicketCategory; priority: TicketPriority; message: string; userName: string }) => {
    const id = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const firstMsg: TicketMessage = {
      id: `TM-${Date.now().toString(36)}`,
      senderId: params.userId,
      senderName: params.userName,
      text: params.message,
      isAgent: false,
      createdAt: now,
    };
    const ticket: SupportTicket = {
      id,
      userId: params.userId,
      subject: params.subject,
      category: params.category,
      priority: params.priority,
      status: 'open',
      messages: [firstMsg],
      createdAt: now,
      updatedAt: now,
    };
    if (supabase) {
      await supabase.from('support_tickets').insert({
        id, user_id: params.userId, subject: params.subject,
        category: params.category, priority: params.priority,
        status: 'open', messages: [firstMsg],
        created_at: now, updated_at: now,
      });
    }
    return ticket;
  },
);

export const replyToTicket = createAsyncThunk(
  'support/reply',
  async (params: { ticketId: string; senderId: string; senderName: string; text: string }) => {
    const msg: TicketMessage = {
      id: `TM-${Date.now().toString(36)}`,
      senderId: params.senderId,
      senderName: params.senderName,
      text: params.text,
      isAgent: false,
      createdAt: new Date().toISOString(),
    };
    if (supabase) {
      await supabase.rpc('append_ticket_message', { ticket_id: params.ticketId, msg });
    }
    return { ticketId: params.ticketId, message: msg };
  },
);

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadTickets.pending, (state) => { state.loading = true; })
      .addCase(loadTickets.fulfilled, (state, action) => {
        state.tickets = action.payload;
        state.loading = false;
      })
      .addCase(loadTickets.rejected, (state) => { state.loading = false; })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.tickets.unshift(action.payload);
      })
      .addCase(replyToTicket.fulfilled, (state, action) => {
        const ticket = state.tickets.find((t) => t.id === action.payload.ticketId);
        if (ticket) {
          ticket.messages.push(action.payload.message);
          ticket.updatedAt = action.payload.message.createdAt;
        }
      });
  },
});

export const supportReducer = supportSlice.reducer;
