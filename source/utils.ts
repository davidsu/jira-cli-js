import chalk from 'chalk'
import {logger} from './logger'
import { State } from './store'

/* eslint-disable no-control-regex */
export const resetColors = str =>
  str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')

export function debounce(func, timeout = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, timeout)
  }
}
export const spinner = (message, promise) => {
  const key = State.getRawState().runningTasks.length
  logger.log({ key, message })
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let curr = 0
  State.update(s => {
    s.runningTasks[key] = s.runningTasks[key] || {}
  })
  const intervalId = setInterval(() => {
    State.update(s => {
      s.runningTasks[key].display = `${chalk.blue(frames[(curr + 1) % frames.length])} ${message}`
    })
  }, 80)
  promise
    .then(() => {
      clearInterval(intervalId)
      State.update(s => {
        s.runningTasks[key].display = `${chalk.bold.green('✓')} ${message}`
      })
    })
    .catch(() => {
      clearInterval(intervalId)
      State.update(s => {
        s.runningTasks[key].display = `${chalk.bold.red('✕')} ${message}`
      })
    })
}
