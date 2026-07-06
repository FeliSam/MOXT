import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TrustLevel = 'new' | 'basic' | 'verified' | 'trusted' | 'elite';

export type TrustScoreState = {
  score: number; // 0-100
  level: TrustLevel;
  factors: TrustFactor[];
};

export type TrustFactor = {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
};

function computeLevel(score: number): TrustLevel {
  if (score >= 80) return 'elite';
  if (score >= 60) return 'trusted';
  if (score >= 40) return 'verified';
  if (score >= 20) return 'basic';
  return 'new';
}

const initialState: TrustScoreState = {
  score: 0,
  level: 'new',
  factors: [],
};

const trustScoreSlice = createSlice({
  name: 'trustScore',
  initialState,
  reducers: {
    computeTrustScore(
      state,
      action: PayloadAction<{
        transferCount: number;
        completedTransfers: number;
        ratingsAvg: number | null;
        ratingsCount: number;
        kycVerified: boolean;
        accountAgeDays: number;
        badgesEarned: number;
      }>,
    ) {
      const p = action.payload;
      const factors: TrustFactor[] = [];

      // Transfers (max 25)
      const transferPts = Math.min(p.completedTransfers * 3, 25);
      factors.push({ key: 'transfers', label: 'Transferts complétés', points: transferPts, maxPoints: 25 });

      // Ratings (max 20)
      const ratingPts = p.ratingsAvg ? Math.round((p.ratingsAvg / 5) * Math.min(p.ratingsCount, 10) * 2) : 0;
      factors.push({ key: 'ratings', label: 'Avis reçus', points: Math.min(ratingPts, 20), maxPoints: 20 });

      // KYC (max 20)
      const kycPts = p.kycVerified ? 20 : 0;
      factors.push({ key: 'kyc', label: 'Identité vérifiée', points: kycPts, maxPoints: 20 });

      // Account age (max 15)
      const agePts = Math.min(Math.floor(p.accountAgeDays / 30) * 3, 15);
      factors.push({ key: 'age', label: 'Ancienneté du compte', points: agePts, maxPoints: 15 });

      // Badges (max 10)
      const badgePts = Math.min(p.badgesEarned * 2, 10);
      factors.push({ key: 'badges', label: 'Badges obtenus', points: badgePts, maxPoints: 10 });

      // Activity (max 10)
      const actPts = Math.min(p.transferCount, 10);
      factors.push({ key: 'activity', label: 'Activité générale', points: actPts, maxPoints: 10 });

      const totalScore = factors.reduce((s, f) => s + f.points, 0);
      state.score = Math.min(totalScore, 100);
      state.level = computeLevel(state.score);
      state.factors = factors;
    },
  },
});

export const { computeTrustScore } = trustScoreSlice.actions;
export const trustScoreReducer = trustScoreSlice.reducer;
