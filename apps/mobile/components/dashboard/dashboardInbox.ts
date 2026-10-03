import { TRANSFER_STATUS } from '@moxt/shared/domain/transferConfig.js';

export type TodoIcon = 'repeat' | 'package' | 'briefcase';

export type DashboardTodo = {
  labelKey: string;
  count: number;
  to: string;
  icon: TodoIcon;
};

export type OnboardingStep = {
  labelKey: string;
  done: boolean;
  to: string;
};

type TransferLike = { userId?: string; status?: string };
type ParcelRequestLike = { id?: string; ownerId?: string; status?: string; parcelId?: string };
type JobApplicationLike = { id?: string; jobId?: string; status?: string };

const ARCHIVED = new Set<string>([
  TRANSFER_STATUS.COMPLETED,
  TRANSFER_STATUS.CANCELLED,
  TRANSFER_STATUS.EXPIRED,
]);

export function isArchivedTransferStatus(status?: string) {
  return ARCHIVED.has(status ?? '');
}

function uniqueById<T extends { id?: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = String(item.id || '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Même file que useDashboardStats : transferts en attente, demandes colis, candidatures. */
export function buildDashboardTodos({
  userId,
  transfers,
  parcelRequests,
  jobApplications,
}: {
  userId?: string;
  transfers: TransferLike[];
  parcelRequests: ParcelRequestLike[];
  jobApplications: JobApplicationLike[];
}): DashboardTodo[] {
  if (!userId) return [];
  const pending = transfers.filter((item) => item.userId === userId && item.status === TRANSFER_STATUS.PENDING);
  const requests = uniqueById(parcelRequests).filter(
    (item) => item.ownerId === userId && item.status === 'submitted' && item.parcelId,
  );
  const applications = uniqueById(jobApplications).filter((item) => item.status === 'submitted' && item.jobId);
  const items: DashboardTodo[] = [];
  if (pending.length) {
    items.push({
      icon: 'repeat',
      labelKey: 'dashboard.overview.todoPendingTransfers',
      count: pending.length,
      to: '/(tabs)/transfers',
    });
  }
  if (requests.length) {
    items.push({
      icon: 'package',
      labelKey: 'dashboard.overview.todoParcelRequests',
      count: requests.length,
      to: `/parcel/${requests[0].parcelId}`,
    });
  }
  if (applications.length) {
    items.push({
      icon: 'briefcase',
      labelKey: 'dashboard.overview.todoApplications',
      count: applications.length,
      to: `/jobs/${applications[0].jobId}`,
    });
  }
  return items;
}

/** Vérification, profil à 100 %, premier transfert. */
export function buildOnboardingSteps(
  user: {
    verified?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    country?: string;
    city?: string;
  },
  transferCount: number,
): OnboardingStep[] {
  const fields = [user.firstName, user.lastName, user.email, user.phone, user.country, user.city];
  const profileCompletion = Math.round(
    (fields.filter((value) => String(value || '').trim()).length / fields.length) * 100,
  );
  return [
    { labelKey: 'dashboard.overview.onboardingVerify', done: Boolean(user.verified), to: '/kyc' },
    { labelKey: 'dashboard.overview.onboardingProfile', done: profileCompletion === 100, to: '/profile/edit' },
    { labelKey: 'dashboard.overview.onboardingTransfer', done: transferCount > 0, to: '/transfer/wizard' },
  ];
}
