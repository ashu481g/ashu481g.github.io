import type { Task } from './types'

const STORAGE_KEY = 'task-manager.tasks'

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTask)
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // Ignore write failures (e.g. storage disabled or quota exceeded).
  }
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.description === 'string' &&
    typeof t.dueDate === 'string' &&
    typeof t.priority === 'string' &&
    typeof t.status === 'string' &&
    typeof t.createdAt === 'number'
  )
}
