import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ScrollToTop } from '../components/routing/ScrollToTop'
import { DocumentTitle } from '../components/routing/DocumentTitle'
import { DeepLinkListener } from '../components/routing/DeepLinkListener'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import { store } from './store'

export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ScrollToTop />
            <DocumentTitle />
            <DeepLinkListener />
            {children}
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </Provider>
  )
}
