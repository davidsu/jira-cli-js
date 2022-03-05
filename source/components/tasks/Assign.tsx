import chalk from 'chalk'
import React, { useEffect, useState } from 'react'
import Fzf from '../fzf/Fzf'
import { State } from '../../store'
import { useStoreState } from 'pullstate'
import { assignIssue, searchUser } from '../../api'
import { popups } from '../../consts'
import Popup from '../Popup'
import { spinner } from '../../utils'

const onAccept = ({ display }) => {
  const state = State.getRawState()
  const user = state.users.find(({ displayName }) => display === displayName)!
  const promise = assignIssue(state.selectedIssue, user.accountId)
  spinner(`assign to ${user.displayName}`, promise)
  State.update(s => {
    s.popup = popups.edit
  })
}
export default function Assign() {
  const [query, setQuery] = useState('')
  const list = useStoreState(State, s => s.users.map(({ displayName }) => ({ display: displayName })))

  useEffect(() => {
    const { cache, server } = searchUser(query)
    const promise = cache || server
    promise?.then(data =>
      State.update(state => {
        state.users = data
      })
    )
  }, [query])
  return (
    <Popup>
      <Fzf
        height={Math.floor(process.stdout.rows / 2)}
        query={query}
        onQueryChange={setQuery}
        onAccept={onAccept}
        isFocused={true}
        promptType={`${chalk.green('?')} ${chalk.bold.ansi256(255)('what would you like to do? ')}`}
        border={{ fg: 246, type: 'line' }}
        list={list}
      />
    </Popup>
  )
}
