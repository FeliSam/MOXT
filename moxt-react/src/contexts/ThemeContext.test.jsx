import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from './ThemeContext'
import { useTheme } from './useTheme'

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme()
  return <button onClick={toggleTheme}>{theme}</button>
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
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
})
