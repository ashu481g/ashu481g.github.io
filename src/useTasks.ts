import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Status, Task } from './types'
import { loadTasks, saveTasks } from './storage'

export interface TaskInput {
  title: string
  description: string
  dueDate: string
  priority: Task['priority']
  status: Status
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const addTask = useCallback((input: TaskInput) => {
    setTasks((prev) => [
      ...prev,
      { ...input, id: createId(), createdAt: Date.now() },
    ])
  }, [])

  const updateTask = useCallback((id: string, input: TaskInput) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...input } : task)),
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

  const setStatus = useCallback((id: string, status: Status) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status } : task)),
    )
  }, [])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (!task.dueDate) continue
      const list = map.get(task.dueDate) ?? []
      list.push(task)
      map.set(task.dueDate, list)
    }
    return map
  }, [tasks])

  return { tasks, tasksByDate, addTask, updateTask, deleteTask, setStatus }
}
