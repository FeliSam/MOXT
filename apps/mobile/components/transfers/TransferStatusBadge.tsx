import { TRANSFER_STATUS } from '@moxt/shared/domain/transferConfig.js';

import { WebBadge, type BadgeTone } from '@/components/dashboard/webUi';
import { useLanguage } from '@/providers/LanguageProvider';

const STATUS_BADGE: Record<string, { labelKey: string; tone: BadgeTone }> = {
  [TRANSFER_STATUS.PENDING_ACCEPTANCE]: { labelKey: 'transfers.status.pendingAcceptance', tone: 'info' },
  [TRANSFER_STATUS.PENDING]: { labelKey: 'transfers.status.pending', tone: 'warning' },
  [TRANSFER_STATUS.DECLINED]: { labelKey: 'transfers.status.businessDeclined', tone: 'danger' },
  [TRANSFER_STATUS.DECLARED]: { labelKey: 'transfers.status.declared', tone: 'info' },
  [TRANSFER_STATUS.RECEIVED]: { labelKey: 'transfers.status.received', tone: 'success' },
  [TRANSFER_STATUS.PROCESSING]: { labelKey: 'transfers.status.processing', tone: 'violet' },
  [TRANSFER_STATUS.PAID_OUT]: { labelKey: 'transfers.status.paidOut', tone: 'info' },
  [TRANSFER_STATUS.COMPLETED]: { labelKey: 'transfers.status.completed', tone: 'success' },
  [TRANSFER_STATUS.CANCELLED]: { labelKey: 'transfers.status.cancelled', tone: 'danger' },
  [TRANSFER_STATUS.EXPIRED]: { labelKey: 'transfers.status.expired', tone: 'warning' },
};

/** TransferStatusBadge du web. */
export function TransferStatusBadge({ status }: { status?: string }) {
  const { t } = useLanguage();
  const config = status ? STATUS_BADGE[status] : undefined;
  return <WebBadge tone={config?.tone ?? 'brand'}>{config ? t(config.labelKey) : status || '—'}</WebBadge>;
}

export { STATUS_BADGE };
