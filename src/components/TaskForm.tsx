import { useEffect, useState } from 'react'
import type { Priority, Status, Task } from '../types'
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../types'
import type { TaskInput } from '../useTasks'

interface TaskFormProps {
  /** Task being edited, or null when creating a new task. */
  task: Task | null
  /** Pre-selected due date (YYYY-MM-DD) when creating from the calendar. */
  defaultDate?: string
  onSubmit: (input: TaskInput) => void
  onClose: () => void
}

export function TaskForm({ task, defaultDate, onSubmit, onClose }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<Status>('todo')

  useEffect(() => {
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setDueDate(task?.dueDate ?? defaultDate ?? '')
    setPriority(task?.priority ?? 'medium')
    setStatus(task?.status ?? 'todo')
  }, [task, defaultDate])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit({ title: trimmed, description: description.trim(), dueDate, priority, status })
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {task ? 'Edit task' : 'New task'}
        </h2>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Title</span>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add details (optional)"
            className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </label>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {task ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  )
}
