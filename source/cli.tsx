#!/usr/bin/env node
import React from 'react'
import App from './components/FuzzyList'
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

screen.key(['escape', 'C-c', 'q'], () => process.exit(0))
render(<App />, screen)
