import { Component } from 'react'
import { FiHome, FiRefreshCw, FiWifiOff } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { isNetworkError } from '../../utils/networkError'
import { Button } from '../ui/Button'
import { NetworkReconnectModal } from './NetworkReconnectModal'

function ErrorFallback({ network, onRetry, onHome }) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)

  if (network) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--app-bg)] p-6 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <FiWifiOff className="size-7" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-black text-amber-700 dark:text-amber-300">
            {p3('errors.network.eyebrow')}
          </p>
          <h1 className="mt-2 text-2xl font-black">{p3('errors.network.title')}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">
            {p3('errors.network.body')}
          </p>
        </div>
        <NetworkReconnectModal open onClose={onHome} onRetry={onRetry} />
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--app-bg)] p-6 text-center">
      <div className="max-w-md">
        <p className="text-sm font-black text-red-600">{p3('errors.display.eyebrow')}</p>
        <h1 className="mt-3 text-2xl font-black">{p3('errors.display.title')}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">
          {p3('errors.display.body')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button icon={FiRefreshCw} onClick={onRetry}>
            {p3('errors.network.retry')}
          </Button>
          <Button variant="secondary" icon={FiHome} onClick={onHome}>
            {p3('errors.display.home')}
          </Button>
        </div>
      </div>
    </main>
  )
}

export class AppErrorBoundary extends Component {
  state = { hasError: false, network: false }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      network: isNetworkError(error),
    }
  }

  componentDidCatch(error, info) {
    console.error('MOXT render error', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, network: false })
    window.location.reload()
  }

  handleHome = () => {
    window.location.assign('/dashboard')
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          network={this.state.network}
          onRetry={this.handleRetry}
          onHome={this.handleHome}
        />
      )
    }
    return this.props.children
  }
}
