import { useRef, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { getTheme, setTheme } from '../lib/theme'

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme)
  const ref = useRef(null)
  const next = theme === 'dark' ? 'light' : 'dark'

  function toggle() {
    setTheme(next, ref.current)
    setThemeState(next)
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      className="theme-toggle"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label={`Dark mode, currently ${theme === 'dark' ? 'on' : 'off'}`}
      title={`Switch to ${next} theme`}
    >
      <Sun className="theme-hint sun" aria-hidden="true" />
      <Moon className="theme-hint moon" aria-hidden="true" />
      <span className="theme-thumb">
        <Sun className="ic-sun" aria-hidden="true" />
        <Moon className="ic-moon" aria-hidden="true" />
      </span>
    </button>
  )
}
