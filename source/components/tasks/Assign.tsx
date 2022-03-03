import chalk from 'chalk'
import React, { useEffect, useState } from 'react'
import Fzf from '../fzf/Fzf'
import { State } from '../../store'
import { resetColors } from '../../utils'
import { useStoreState } from 'pullstate'
import { searchUser } from '../../api'
const onAccept = value =>
  State.update(s => {
    s.popup = resetColors(value)
  })
export default function Assign() {
  const [query, setQuery] = useState('')
  const { list } = useStoreState(State, s => ({ list: s.users.map(({ displayName }) => ({ display: displayName })) }))

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
    <box height="50%" width="50%" top="center" left="center">
      <Fzf
        height={Math.floor(process.stdout.rows / 2)}
        onQueryChange={setQuery}
        onAccept={onAccept}
        isFocused={true}
        promptType={`${chalk.green('?')} ${chalk.bold.ansi256(255)('what would you like to do? ')}`}
        border={{ fg: 246, type: 'line' }}
        list={list}
      />
    </box>
  )
}
