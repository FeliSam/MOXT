import { Component } from 'react'

export class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('MOXT render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center dark:bg-slate-950">
          <div>
            <p className="text-sm font-black text-red-600">Erreur d'affichage</p>
            <h1 className="mt-3 text-2xl font-black">Cette page n'a pas pu etre affichee.</h1>
            <button
              type="button"
              className="mt-6 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              onClick={() => window.location.assign('/dashboard')}
            >
              Retour au tableau de bord
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
