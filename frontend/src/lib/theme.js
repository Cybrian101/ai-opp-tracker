// Light / dark theme. The choice lives in localStorage and on <html data-theme>. index.html sets it before first paint.

const KEY = 'pf-theme'
const META_COLOR = { dark: '#07161b', light: '#ffffff' }

export function getTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function apply(theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // private mode or blocked storage: the theme still applies for this visit
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', META_COLOR[theme])
}

/** Switches theme with a circular reveal that grows from `origin` (the switch). Falls back to a colour fade. */
export function setTheme(next, origin) {
  const root = document.documentElement
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return apply(next)

  if (typeof document.startViewTransition === 'function' && origin) {
    const box = origin.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const transition = document.startViewTransition(() => apply(next))
    transition.ready
      .then(() =>
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
        )
      )
      .catch(() => {})
    return
  }

  root.classList.add('theme-switching')
  apply(next)
  window.setTimeout(() => root.classList.remove('theme-switching'), 600)
}
