import { useMemo, useState } from 'react'
import type { Status, Task } from '../types'
import { STATUS_LABELS, STATUSES } from '../types'
import { PRIORITY_BADGE, STATUS_BADGE } from '../styles'
import { formatHumanDate, todayKey } from '../dateUtils'

type StatusFilter = 'all' | Status

interface TaskListProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: Status) => void
}

const PRIORITY_ORDER: Record<Task['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function TaskList({ tasks, onEdit, onDelete, onStatusChange }: TaskListProps) {
  const [filter, setFilter] = useState<StatusFilter>('all')

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
    return [...filtered].sort((a, b) => {
      const aHas = a.dueDate ? 0 : 1
      const bHas = b.dueDate ? 0 : 1
      if (aHas !== bHas) return aHas - bHas
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate)
      }
      if (a.priority !== b.priority) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      return a.createdAt - b.createdAt
    })
  }, [tasks, filter])

  const today = todayKey()

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', ...STATUSES] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No tasks here yet. Click “New task” to add one.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((task) => {
            const overdue = task.dueDate && task.dueDate < today && task.status !== 'done'
            return (
              <li
                key={task.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className={`truncate font-medium ${
                        task.status === 'done'
                          ? 'text-slate-400 line-through'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-slate-500">{task.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_BADGE[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${STATUS_BADGE[task.status]}`}
                      >
                        {STATUS_LABELS[task.status]}
                      </span>
                      <span className={overdue ? 'font-medium text-rose-600' : 'text-slate-500'}>
                        {formatHumanDate(task.dueDate)}
                        {overdue ? ' · overdue' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as Status)}
                      aria-label="Change status"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 outline-none focus:border-indigo-500"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => onEdit(task)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                      aria-label="Edit task"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete task"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
