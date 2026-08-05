import { FiArchive, FiMessageSquare } from 'react-icons/fi'
import { LuSearch } from 'react-icons/lu'
import { HEADER_ICON_STROKE } from '../../../components/layout/headerLayout'
import { HeaderActionsBar, HeaderBrandChip, HeaderRow } from '../../../components/layout/HeaderChrome'
import { ConversationFilterMenu } from '../ConversationFilterMenu'
import { countConversationsForFilter } from '../messageUtils'
import { messagesText } from '../../../features/communications/messagesI18n'
import { MESSAGE_FILTER_IDS } from '../messageFilters'

export function MessagesListHeader({
  t,
  conversations,
  filter,
  onFilterChange,
  showArchived,
  onToggleArchived,
  searchOpen,
  onSearchOpen,
  activeHumanConversations,
  unreadMessagesCount,
  userId,
}) {
  return (
    <>
      <HeaderRow>
        <HeaderBrandChip compact>
          <span className="grid size-[2.185rem] shrink-0 place-items-center rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] sm:size-[2.458125rem]">
            <FiMessageSquare className="text-lg opacity-[0.92]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-black leading-none tracking-tight text-[var(--app-text)] sm:text-[0.9375rem]">
              {t('messages.conversations')}
            </h1>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-[var(--app-text-muted)]">
              {messagesText(t, 'messages.exchangeCount', {
                count: activeHumanConversations.length + 1,
              })}{' '}
              {showArchived ? t('messages.archived') : t('messages.active')}
              {!showArchived && unreadMessagesCount > 0
                ? messagesText(
                    t,
                    unreadMessagesCount > 1 ? 'messages.unreadCountPlural' : 'messages.unreadCount',
                    { count: unreadMessagesCount },
                  )
                : ''}
            </p>
          </div>
        </HeaderBrandChip>
        <HeaderActionsBar>
          <ConversationFilterMenu
            className="lg:hidden"
            conversations={conversations}
            filter={filter}
            onFilterChange={onFilterChange}
            showArchived={showArchived}
            onToggleArchived={onToggleArchived}
            userId={userId}
          />
          <button
            type="button"
            onClick={onSearchOpen}
            className="header-action-btn relative grid"
            aria-label={t('messages.searchConversationAria')}
            aria-expanded={searchOpen}
          >
            <LuSearch className="header-action-icon" strokeWidth={HEADER_ICON_STROKE} aria-hidden="true" />
          </button>
        </HeaderActionsBar>
      </HeaderRow>
      <div
        className="message-filter-chips scrollbar-hidden mt-2.5 hidden w-full gap-1.5 overflow-x-auto pb-0.5 lg:flex"
        role="toolbar"
        aria-label={t('messages.filterAria')}
      >
        {MESSAGE_FILTER_IDS.map((item) => {
          const count = countConversationsForFilter(conversations, item.id, userId, showArchived)
          const activeFilter = filter === item.id && !showArchived
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={`message-filter-chip shrink-0 ${activeFilter ? 'message-filter-chip--active' : ''}`}
              aria-pressed={activeFilter}
            >
              {item.icon ? <item.icon className="size-3" aria-hidden="true" /> : null}
              {messagesText(t, item.labelKey) !== item.labelKey
                ? messagesText(t, item.labelKey)
                : t(item.labelKey)}
              {count ? <span className="message-filter-chip-count">{count}</span> : null}
            </button>
          )
        })}
        <button
          type="button"
          onClick={onToggleArchived}
          className={`message-filter-chip shrink-0 ${showArchived ? 'message-filter-chip--active' : ''}`}
          aria-pressed={showArchived}
        >
          <FiArchive className="size-3" aria-hidden="true" />
          {showArchived ? messagesText(t, 'messages.actives') : t('messages.archives')}
        </button>
      </div>
    </>
  )
}
