import React, { useEffect } from 'react'
import Fzf from './fzf/Fzf'
import { fetchList, State } from './../store'
import { useStoreState } from 'pullstate'
import { getDefaultJQL, state } from './../api'
export default function IssueList() {
  const { header, list } = useStoreState(State, s => ({ header: s.issueListHeader, list: Object.values(s.issues) }))
  const popup = useStoreState(State, s => s.popup)
  useEffect(() => {
    const all = false
    const jql = all ? `project=${state.config.project.key}` : getDefaultJQL()
    fetchList(jql)
  }, [])

  return (
    <box>
      <Fzf isFocused={!popup} header={header} list={list} />
    </box>
  )
}
