import type { Priority, Status } from './types'

export const PRIORITY_BADGE: Record<Priority, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
}

export const PRIORITY_DOT: Record<Priority, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
}

export const STATUS_BADGE: Record<Status, string> = {
  todo: 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-sky-100 text-sky-700',
  done: 'bg-emerald-100 text-emerald-700',
}
