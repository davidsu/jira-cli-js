import chalk from 'chalk'
import React from 'react'
import Fzf from '../fzf/Fzf'
import { State } from '../../store'
import { resetColors } from '../../utils'
import { popups } from '../../consts'
import Popup from '../Popup'
const onAccept = ({ display }) => {
  State.update(s => {
    const popup = resetColors(display)
    s.popup = popups[popup] || popups.debug
  })
}
export default function Edit() {
  const list = ['assignee', 'link', 'parent', 'priority', 'transition'].map(display => ({
    display: chalk.blue(display),
  }))
  return (
    <Popup>
      <Fzf
        onAccept={onAccept}
        isFocused={true}
        promptType={`${chalk.green('?')} ${chalk.bold.ansi256(255)('what would you like to do? ')}`}
        list={list}
      />
    </Popup>
  )
}
