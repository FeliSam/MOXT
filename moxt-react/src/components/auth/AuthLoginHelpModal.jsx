import { FaTelegramPlane, FaWhatsapp } from 'react-icons/fa'
import { FiHelpCircle, FiMail } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { MOXT_TELEGRAM, MOXT_WHATSAPP } from '../../config/socialLinks'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

/**
 * Aide connexion / récupération — accessible hors session
 * (ne redirige pas vers /support, réservé aux comptes connectés).
 */
export function AuthLoginHelpModal({ open, onClose, t }) {
  return (
    <Modal open={open} onClose={onClose} title={t('auth.login.helpTitle')}>
      <div className="grid gap-4 text-sm text-[var(--app-text-muted)]">
        <p>{t('auth.login.helpIntro')}</p>
        <ul className="list-disc space-y-2 pl-4">
          <li>{t('auth.login.helpTipPhone')}</li>
          <li>{t('auth.login.helpTipPassword')}</li>
          <li>{t('auth.login.helpTipEmail')}</li>
        </ul>
        <div className="grid gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text)]">
            {t('auth.login.helpContactTitle')}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={MOXT_TELEGRAM.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-bold text-[var(--app-text)]"
            >
              <FaTelegramPlane className="text-sky-500" />
              Telegram
            </a>
            <a
              href={MOXT_WHATSAPP.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-bold text-[var(--app-text)]"
            >
              <FaWhatsapp className="text-emerald-500" />
              WhatsApp
            </a>
            <Link
              to="/faq"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-bold text-[var(--app-text)]"
              onClick={onClose}
            >
              <FiHelpCircle />
              {t('auth.login.helpFaq')}
            </Link>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-bold text-[var(--app-text)]"
              onClick={onClose}
            >
              <FiMail />
              {t('auth.login.forgot')}
            </Link>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  )
}
