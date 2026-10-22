import { supabase } from '@/services/supabase';
import { uploadLikeWeb, type UploadFile } from '@/services/mediaUpload';

export type ReportTarget = 'listing' | 'job' | 'event' | 'parcel' | 'p2p' | 'message';

const REPORT_TABLE: Partial<Record<ReportTarget, { table: string; foreign: string }>> = {
  listing: { table: 'listing_reports', foreign: 'listing_id' },
  job: { table: 'job_reports', foreign: 'job_id' },
  event: { table: 'event_reports', foreign: 'event_id' },
};

function reportId() {
  return `REP-${Date.now().toString(36).toUpperCase()}`;
}

/** Capture optionnelle, même dossier que le web (`listings/{userId}/support`). */
export async function uploadReportEvidence(userId: string, file: UploadFile) {
  const extension = file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/support/${Date.now()}.${extension}`;
  const uploaded = await uploadLikeWeb('listings', path, file, 'public');
  return uploaded.url;
}

/**
 * Signalement comme le web : tables listing_reports / job_reports / event_reports.
 * Colis et offres P2P n’ont pas de table dédiée : le motif part en ticket support.
 */
export async function submitContentReport(args: {
  target: ReportTarget;
  targetId: string;
  reporterId: string;
  reporterName?: string;
  reason: string;
  evidenceUrl?: string | null;
}) {
  if (!supabase) throw new Error('Supabase indisponible');
  const dedicated = REPORT_TABLE[args.target];
  if (dedicated) {
    const id = reportId();
    const { error } = await supabase.from(dedicated.table).insert({
      id,
      [dedicated.foreign]: args.targetId,
      reporter_id: args.reporterId,
      reason: args.reason,
      evidence_url: args.evidenceUrl || null,
      status: 'new',
      created_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return id;
  }

  const id = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const subject =
    args.target === 'parcel'
      ? `Signalement colis ${args.targetId}`
      : args.target === 'message'
        ? `Signalement message ${args.targetId}`
        : `Signalement offre P2P ${args.targetId}`;
  const { error } = await supabase.from('support_tickets').insert({
    id,
    user_id: args.reporterId,
    user_name: args.reporterName || '',
    subject,
    category: args.target === 'parcel' ? 'parcel' : 'other',
    priority: 'normal',
    status: 'open',
    messages: [
      {
        id: `TM-${Date.now().toString(36)}`,
        senderId: args.reporterId,
        senderName: args.reporterName || 'Membre',
        text: [args.reason, args.evidenceUrl ? `Preuve : ${args.evidenceUrl}` : ''].filter(Boolean).join('\n'),
        isAgent: false,
        createdAt: now,
      },
    ],
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(error.message);
  return id;
}
