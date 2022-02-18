import type { FC } from 'react'
import Fzf from './Fzf'
import React, { useEffect } from 'react'
import { getDefaultJQL, state } from '../api'
import { State, fetchList } from '../store'

const App: FC<{ name?: string }> = () => {
  const { search } = State.useState()
  const { displayList, header } = search

  useEffect(() => {
    const all = false
    const jql = all ? `project=${state.config.project.key}` : getDefaultJQL()
    fetchList(jql)
  }, [])

  return <Fzf list={displayList} header={header} />
}

export default App
