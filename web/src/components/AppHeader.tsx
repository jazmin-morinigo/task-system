import { useEffect, useState } from 'react'
import { GitBranch, Moon, Sun } from 'lucide-react'
import { useStatusCounts } from '../hooks/useStatusCounts'
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from '../lib/labels'
import { TASK_STATUSES } from '../lib/types'
import { Button } from './ui/button'

const THEME_STORAGE_KEY = 'ramify-theme'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function AppHeader() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const counts = useStatusCounts()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return (
    <header className="sticky top-0 z-10 bg-header text-header-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <GitBranch className="size-5" />
          <span className="font-heading text-lg font-semibold">Ramify</span>
        </div>

        <div className="flex items-center gap-3">
          {counts && (
            <div className="hidden items-center gap-1.5 md:flex">
              {TASK_STATUSES.map((status) => (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
                >
                  {STATUS_LABELS[status]}
                  <span className="tabular-nums">{counts[status]}</span>
                </span>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-header-foreground hover:bg-header-foreground/10"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
  )
}
