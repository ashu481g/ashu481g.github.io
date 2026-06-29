import type { Task } from '../types'
import { PRIORITY_DOT } from '../styles'
import {
  WEEKDAY_NAMES,
  getCalendarDays,
  monthLabel,
  toDateKey,
  todayKey,
} from '../dateUtils'

interface CalendarViewProps {
  year: number
  month: number
  tasksByDate: Map<string, Task[]>
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onSelectDate: (dateKey: string) => void
  onSelectTask: (task: Task) => void
}

export function CalendarView({
  year,
  month,
  tasksByDate,
  onPrev,
  onNext,
  onToday,
  onSelectDate,
  onSelectTask,
}: CalendarViewProps) {
  const days = getCalendarDays(year, month)
  const today = todayKey()

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{monthLabel(year, month)}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onToday}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Today
          </button>
          <button
            onClick={onPrev}
            aria-label="Previous month"
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            ‹
          </button>
          <button
            onClick={onNext}
            aria-label="Next month"
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-slate-500">
        {WEEKDAY_NAMES.map((name) => (
          <div key={name} className="pb-2">
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-slate-200">
        {days.map((day) => {
          const key = toDateKey(day)
          const inMonth = day.getMonth() === month
          const isToday = key === today
          const dayTasks = tasksByDate.get(key) ?? []

          return (
            <div
              key={key}
              className={`flex min-h-24 flex-col gap-1 p-1.5 text-left ${
                inMonth ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              <button
                onClick={() => onSelectDate(key)}
                className="flex items-center justify-between"
                title="Add task on this day"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? 'bg-indigo-600 font-semibold text-white'
                      : inMonth
                        ? 'text-slate-700'
                        : 'text-slate-400'
                  }`}
                >
                  {day.getDate()}
                </span>
              </button>

              <div className="flex flex-col gap-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="flex items-center gap-1 truncate rounded bg-slate-100 px-1.5 py-0.5 text-left text-xs text-slate-700 hover:bg-slate-200"
                    title={task.title}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                    />
                    <span
                      className={`truncate ${task.status === 'done' ? 'text-slate-400 line-through' : ''}`}
                    >
                      {task.title}
                    </span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="px-1.5 text-xs text-slate-400">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
