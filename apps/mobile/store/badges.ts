import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Badge = {
  id: string;
  label: string;
  description: string;
  icon: string;
  unlockedAt?: string;
};

type BadgesState = {
  earned: Badge[];
  available: Badge[];
};

export const ALL_BADGES: Omit<Badge, 'unlockedAt'>[] = [
  { id: 'first_transfer', label: 'Premier transfert', description: 'Effectuer un premier transfert', icon: '🚀' },
  { id: 'five_transfers', label: '5 transferts', description: 'Effectuer 5 transferts', icon: '⭐' },
  { id: 'ten_transfers', label: '10 transferts', description: 'Effectuer 10 transferts', icon: '🏆' },
  { id: 'first_parcel', label: 'Premier colis', description: 'Réserver un premier colis', icon: '📦' },
  { id: 'marketplace_seller', label: 'Vendeur', description: 'Publier une annonce', icon: '🏪' },
  { id: 'profile_complete', label: 'Profil complet', description: 'Remplir toutes les infos du profil', icon: '✅' },
  { id: 'first_job_apply', label: 'Candidature', description: 'Postuler à une offre d\'emploi', icon: '💼' },
  { id: 'trusted_user', label: 'Utilisateur fiable', description: '10 transactions sans litige', icon: '🛡️' },
];

const initialState: BadgesState = {
  earned: [],
  available: ALL_BADGES.map((b) => ({ ...b })),
};

const badgesSlice = createSlice({
  name: 'badges',
  initialState,
  reducers: {
    unlockBadge(state, action: PayloadAction<string>) {
      const badgeId = action.payload;
      const alreadyEarned = state.earned.some((b) => b.id === badgeId);
      if (alreadyEarned) return;
      const badge = ALL_BADGES.find((b) => b.id === badgeId);
      if (badge) {
        state.earned.push({ ...badge, unlockedAt: new Date().toISOString() });
      }
    },
    setEarnedBadges(state, action: PayloadAction<Badge[]>) {
      state.earned = action.payload;
    },
  },
});

export const { unlockBadge, setEarnedBadges } = badgesSlice.actions;
export const badgesReducer = badgesSlice.reducer;
