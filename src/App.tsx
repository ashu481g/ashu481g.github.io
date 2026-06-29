import { useState } from 'react'
import type { Task } from './types'
import { useTasks } from './useTasks'
import type { TaskInput } from './useTasks'
import { TaskList } from './components/TaskList'
import { CalendarView } from './components/CalendarView'
import { TaskForm } from './components/TaskForm'

type View = 'list' | 'calendar'

interface FormState {
  task: Task | null
  defaultDate?: string
}

function App() {
  const { tasks, tasksByDate, addTask, updateTask, deleteTask, setStatus } = useTasks()
  const [view, setView] = useState<View>('list')
  const [form, setForm] = useState<FormState | null>(null)

  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })

  function moveMonth(delta: number) {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  function goToday() {
    const today = new Date()
    setCursor({ year: today.getFullYear(), month: today.getMonth() })
  }

  function handleSubmit(input: TaskInput) {
    if (form?.task) {
      updateTask(form.task.id, input)
    } else {
      addTask(input)
    }
    setForm(null)
  }

  const remaining = tasks.filter((t) => t.status !== 'done').length

  return (
    <div className="min-h-full bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Task Manager</h1>
            <p className="text-sm text-slate-500">
              {tasks.length} task{tasks.length === 1 ? '' : 's'} · {remaining} remaining
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
              <button
                onClick={() => setView('list')}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  view === 'calendar'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Calendar
              </button>
            </div>

            <button
              onClick={() => setForm({ task: null })}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + New task
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {view === 'list' ? (
          <TaskList
            tasks={tasks}
            onEdit={(task) => setForm({ task })}
            onDelete={deleteTask}
            onStatusChange={setStatus}
          />
        ) : (
          <CalendarView
            year={cursor.year}
            month={cursor.month}
            tasksByDate={tasksByDate}
            onPrev={() => moveMonth(-1)}
            onNext={() => moveMonth(1)}
            onToday={goToday}
            onSelectDate={(dateKey) => setForm({ task: null, defaultDate: dateKey })}
            onSelectTask={(task) => setForm({ task })}
          />
        )}
      </main>

      {form && (
        <TaskForm
          task={form.task}
          defaultDate={form.defaultDate}
          onSubmit={handleSubmit}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  )
}

export default App
