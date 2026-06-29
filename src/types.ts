export type Priority = 'low' | 'medium' | 'high'

export type Status = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  /** ISO date string (YYYY-MM-DD), or empty when no due date is set. */
  dueDate: string
  priority: Priority
  status: Status
  createdAt: number
}

export const PRIORITIES: Priority[] = ['low', 'medium', 'high']
export const STATUSES: Status[] = ['todo', 'in-progress', 'done']

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
}
