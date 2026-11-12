// Theme preference. Pure logic, so it can be tested without a browser.

export const THEME_KEY = 'theme'

/** Returns 'light' or 'dark'. Saved choice wins, then the system preference, then dark. */
export function resolveTheme(saved, prefersLight) {
  if (saved === 'light' || saved === 'dark') return saved
  return prefersLight === true ? 'light' : 'dark'
}

export const nextTheme = (current) => (current === 'light' ? 'dark' : 'light')
