#!/usr/bin/env node
import React from 'react'
import App from './components/App'
import blessed from 'blessed'
import { render } from 'react-blessed'

const debug = process.argv.includes('--debug')
if (!debug) {
  const enterAltScreenCommand = '\x1b[?1049h'
  const leaveAltScreenCommand = '\x1b[?1049l'
  process.stdout.write(enterAltScreenCommand)
  process.on('exit', () => {
    process.stdout.write(leaveAltScreenCommand)
  })
}
const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'whatever',
})
//@ts-ignore
global.screen = screen

screen.key(['escape', 'C-c', 'q'], () => process.exit(0))
render(<App screen={screen} />, screen)
