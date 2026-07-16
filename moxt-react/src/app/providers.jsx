import { Provider, useSelector } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ScrollToTop } from '../components/routing/ScrollToTop'
import { DocumentTitle } from '../components/routing/DocumentTitle'
import { DeepLinkListener } from '../components/routing/DeepLinkListener'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import { useAppBadgeSync } from '../hooks/useAppBadgeSync'
import { store } from './store'

/** Badge icône hors AppLayout (logout / routes publiques) pour clearAppBadge fiable. */
function AppBadgeBridge() {
  const userId = useSelector((state) => state.auth.user?.id)
  useAppBadgeSync(userId)
  return null
}

export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ScrollToTop />
            <DocumentTitle />
            <DeepLinkListener />
            <AppBadgeBridge />
            {children}
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </Provider>
  )
}
