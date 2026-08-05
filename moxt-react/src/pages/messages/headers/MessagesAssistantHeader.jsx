import { FiCpu } from 'react-icons/fi'
import { LuArrowLeft, LuHeadphones, LuTrash2 } from 'react-icons/lu'
import { messagesText } from '../../../features/communications/messagesI18n'
import { HEADER_BACK_BTN_CLASS, HEADER_ICON_STROKE } from '../../../components/layout/headerLayout'
import { HeaderActionsBar, HeaderBrandChip, HeaderRow } from '../../../components/layout/HeaderChrome'

export function MessagesAssistantHeader({
  t,
  showBack,
  onBack,
  onContactAdmin,
  onClearHistory,
  adminComposeDisabled,
}) {
  return (
    <HeaderRow>
      <HeaderBrandChip compact>
        {showBack ? (
          <button
            type="button"
            className={HEADER_BACK_BTN_CLASS}
            onClick={onBack}
            aria-label={messagesText(t, 'messages.assistant.backAria')}
          >
            <LuArrowLeft className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
          </button>
        ) : null}
        <span className="grid size-[2.185rem] shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-base text-white shadow-sm sm:size-[2.458125rem]">
          <FiCpu />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black leading-none tracking-tight text-[var(--app-text)] sm:text-[0.9375rem]">
            {messagesText(t, 'messages.assistant.name')}
          </h2>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-[var(--app-text-muted)]">
            {messagesText(t, 'messages.assistant.subtitle')}
          </p>
        </div>
      </HeaderBrandChip>
      <HeaderActionsBar>
        <button
          type="button"
          onClick={onContactAdmin}
          disabled={adminComposeDisabled}
          className="header-action-btn relative grid disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={messagesText(t, 'messages.assistant.contactAdminAria')}
          title={messagesText(t, 'messages.assistant.contactAdmin')}
        >
          <LuHeadphones className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onClearHistory}
          className="header-action-btn relative grid"
          aria-label={messagesText(t, 'messages.assistant.clearHistoryAria')}
        >
          <LuTrash2 className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
        </button>
      </HeaderActionsBar>
    </HeaderRow>
  )
}
