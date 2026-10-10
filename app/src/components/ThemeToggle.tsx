import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setTheme, useTheme, type Theme } from '@/lib/theme'

const NEXT: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }
const ICON = { light: Sun, dark: Moon, system: Monitor }

export function ThemeToggle() {
  const theme = useTheme()
  const Icon = ICON[theme]
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Theme: ${theme}. Switch to ${NEXT[theme]}`}
      onClick={() => setTheme(NEXT[theme])}
    >
      <Icon />
    </Button>
  )
}
