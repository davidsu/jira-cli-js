#!/usr/bin/env node
import React from 'react'
import App from './components/App'
import blessed from 'blessed'
import { render } from 'react-blessed'

//@ts-ignore
global.requestAnimationFrame = f => {
  setImmediate(() => f(Date.now()))
}
global.cancelAnimationFrame = () => {}
const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'whatever',
})
//@ts-ignore
global.screen = screen

screen.key(['escape', 'C-c', 'q'], () => process.exit(0))
render(<App screen={screen} />, screen)
