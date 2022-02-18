#!/usr/bin/env node
import React from 'react'
import { render, useApp, useInput } from 'ink'
import App from './components/FuzzyList'

const enterAltScreenCommand = '\x1b[?1049h'
const leaveAltScreenCommand = '\x1b[?1049l'
process.stdout.write(enterAltScreenCommand)
process.on('exit', () => {
  process.stdout.write(leaveAltScreenCommand)
})

const Wrapper = ({ children }: { children: any }) => {
  const { exit } = useApp()
  useInput((input, key) => {
    if (key.escape) {
      setTimeout(() => process.exit(0), 50)
      exit()
    }
  })
  return <>{children}</>
}

render(
  <Wrapper>
    <App />
  </Wrapper>
)
