import fs from 'fs'
const logFile = '/tmp/jira-cli-log'

fs.rmSync(logFile, { force: true })

const log = message => {
  const final = typeof message === 'string' ? message : JSON.stringify(message, null, 2)
  fs.appendFileSync(logFile, `${final}\n\n`)
}

export const logger = { log }
