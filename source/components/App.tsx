#!/usr/bin/env node
import React, { useEffect, useState } from 'react'
import Debug from './Debug'
import Fzf from './fzf/Fzf'
import { State } from '../store'
import { useStoreState } from 'pullstate'
import type blessed from 'blessed'
import Edit from './tasks/Edit'
import Assign from './tasks/Assign'

const ctrlDToDebugScreen = screen =>
  useEffect(() => {
    screen.program.on('keypress', (ch, key) => {
      if (key.ctrl && key.name === 'd') {
        State.update(s => {
          if (s.popup) {
            s.popup = ''
          } else {
            s.popup = 'debug'
          }
        })
      }
    })
  }, [])

const hackRerenderOnPopupClose = popup => {
  const [oldPopup, setOldPopup] = useState(popup)
  useEffect(() => {
    setTimeout(() => {
      setOldPopup(popup)
    }, 0)
  }, [popup])
  return oldPopup && !popup
}

function getPopup(popup) {
  switch (popup) {
    case 'debug':
      return <Edit popup={popup} />
    case 'assignee':
      return <Assign popup={popup} />
    case 'link':
      return <Debug popup={popup} />
    case 'parent':
      return <Debug popup={popup} />
    case 'priority':
      return <Debug popup={popup} />
    case 'transition':
      return <Debug popup={popup} />
  }
}

function useProgramEscape(screen) {
  useEffect(() => {
    screen.program.on('keypress', (str, key) => {
      if (key.name === 'escape') {
        if (State.getRawState().popup) {
          State.update(s => {
            s.popup = ''
          })
        } else {
          process.exit(0)
        }
      }
    })
  }, [screen])
}
export default function App({ screen }: { screen: ReturnType<typeof blessed.screen> }) {
  useProgramEscape(screen)
  const { header, list } = useStoreState(State, s => ({ header: s.issueListHeader, list: Object.values(s.issues) }))
  const popup = useStoreState(State, s => s.popup)
  ctrlDToDebugScreen(screen)
  if (hackRerenderOnPopupClose(popup)) {
    return <text>renderind</text>
  }
  return (
    <box width="100%" height="100%">
      {getPopup(popup)}
      <Fzf isFocused={!popup} header={header} list={list} />
    </box>
  )
}
