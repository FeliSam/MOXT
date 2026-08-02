import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from './ThemeContext'
import { useTheme } from './useTheme'

function ThemeProbe() {
  const { theme, isDark, toggleTheme } = useTheme()
  return (
    <button onClick={toggleTheme} data-dark={isDark ? '1' : '0'}>
      {theme}
    </button>
  )
}

function mockMatchMedia(matches) {
  const listeners = new Set()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: (_event, listener) => listeners.add(listener),
      removeEventListener: (_event, listener) => listeners.delete(listener),
      addListener: (listener) => listeners.add(listener),
      removeListener: (listener) => listeners.delete(listener),
      dispatchEvent: () => false,
      __emit: (next) => {
        matches = next
        listeners.forEach((listener) => listener({ matches: next }))
      },
    })),
  })
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    mockMatchMedia(false)
  })

  it('utilise light par defaut a la premiere visite', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button')).toHaveTextContent('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('moxt-theme')).toBe('light')
  })

  it('bascule et persiste le theme sombre', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('moxt-theme')).toBe('dark')
  })

  it('passe en systeme puis suit prefers-color-scheme', () => {
    mockMatchMedia(true)

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button')) // light -> dark
    fireEvent.click(screen.getByRole('button')) // dark -> system

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('system')
    expect(localStorage.getItem('moxt-theme')).toBe('system')
    expect(document.documentElement).toHaveClass('dark')
    expect(button).toHaveAttribute('data-dark', '1')
  })
})
