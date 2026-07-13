/**
 * File d'exécution parallèle avec limite de concurrence.
 * Réutilisable pour deploy, fix, checks, etc.
 */
export class TaskQueue {
  /**
   * @param {{ concurrency?: number, stopOnError?: boolean }} [options]
   */
  constructor({ concurrency = 4, stopOnError = true } = {}) {
    this.concurrency = Math.max(1, concurrency)
    this.stopOnError = stopOnError
  }

  /**
   * @param {Array<{ id: string, label?: string, run: () => Promise<unknown> | unknown }>} tasks
   */
  async runAll(tasks) {
    const results = new Map()
    const errors = []
    let index = 0
    let active = 0
    let halted = false

    return new Promise((resolve) => {
      const next = () => {
        if (halted && active === 0) {
          resolve({ results, errors, ok: errors.length === 0 })
          return
        }
        if (index >= tasks.length && active === 0) {
          resolve({ results, errors, ok: errors.length === 0 })
          return
        }

        while (!halted && active < this.concurrency && index < tasks.length) {
          const task = tasks[index++]
          active += 1
          const label = task.label || task.id
          console.log(`  ▶ ${label}`)
          Promise.resolve()
            .then(() => task.run())
            .then((value) => {
              results.set(task.id, { ok: true, value })
              console.log(`  ✓ ${label}`)
            })
            .catch((error) => {
              const message = error instanceof Error ? error.message : String(error)
              errors.push({ id: task.id, label, message })
              results.set(task.id, { ok: false, error: message })
              console.error(`  ✗ ${label} — ${message}`)
              if (this.stopOnError) halted = true
            })
            .finally(() => {
              active -= 1
              next()
            })
        }
      }

      if (!tasks.length) {
        resolve({ results, errors, ok: true })
        return
      }
      next()
    })
  }
}
