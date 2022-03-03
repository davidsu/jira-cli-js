import chalk from 'chalk'
import React from 'react'
import Fzf from '../fzf/Fzf'
import { State } from '../../store'
import { resetColors } from '../../utils'
const onAccept = value =>
  State.update(s => {
    s.popup = resetColors(value)
  })
export default function Edit() {
  const list = ['assignee', 'link', 'parent', 'priority', 'transition'].map(display => ({
    display: chalk.blue(display),
  }))
  return (
    <box height="50%" width="50%" top="center" left="center">
      <Fzf
        onAccept={onAccept}
        isFocused={true}
        promptType={`${chalk.green('?')} ${chalk.bold.ansi256(255)('what would you like to do? ')}`}
        border={{ fg: 246, type: 'line' }}
        list={list}
      />
    </box>
  )
}
