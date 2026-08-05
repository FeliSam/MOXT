export function isMessagesPath(pathname) {
  return pathname === '/messages' || pathname === '/messages/'
}

export function isMessageThreadOpen(searchParams) {
  if (searchParams.get('conversation')) return true
  return Boolean(searchParams.get('relatedType') && searchParams.get('relatedId'))
}
