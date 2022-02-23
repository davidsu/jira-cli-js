#!/usr/bin/env node
import React, { useEffect, useState } from 'react'
import Debug from './Debug'
import Fzf from './Fzf'
import { State } from '../store'
import { useStoreState } from 'pullstate'
import type blessed from 'blessed'

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

export default function App({ screen }: { screen: ReturnType<typeof blessed.screen> }) {
  const { header, list } = useStoreState(State, s => ({ header: s.issueListHeader, list: Object.values(s.issues) }))
  const popup = useStoreState(State, s => s.popup)
  ctrlDToDebugScreen(screen)
  if (hackRerenderOnPopupClose(popup)) {
    return <text>renderind</text>
  }
  return (
    <box width="100%" height="100%">
      {popup === 'debug' ? <Debug /> : undefined}
      <Fzf isFocused={!popup} header={header} list={list} width="100%" height="100%" />
    </box>
  )
}
