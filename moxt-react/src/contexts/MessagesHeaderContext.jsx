import { createContext, useContext, useState } from 'react'

const MessagesHeaderStateContext = createContext(null)
const MessagesHeaderDispatchContext = createContext(null)

export function MessagesHeaderProvider({ children }) {
  const [header, setHeader] = useState(null)
  return (
    <MessagesHeaderDispatchContext.Provider value={setHeader}>
      <MessagesHeaderStateContext.Provider value={header}>{children}</MessagesHeaderStateContext.Provider>
    </MessagesHeaderDispatchContext.Provider>
  )
}

export function useMessagesHeaderContent() {
  return useContext(MessagesHeaderStateContext)
}

/** Point d’entrée unique : seul MessagesPage doit appeler cette fonction. */
export function useSetMessagesHeader() {
  const setHeader = useContext(MessagesHeaderDispatchContext)
  if (!setHeader) {
    throw new Error('useSetMessagesHeader must be used within MessagesHeaderProvider')
  }
  return setHeader
}
