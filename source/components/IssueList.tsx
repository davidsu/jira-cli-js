import React, { useCallback, useEffect } from 'react'
import Fzf from './fzf/Fzf'
import { fetchList, State } from './../store'
import { useStoreState } from 'pullstate'
import { getDefaultJQL, state } from './../api'
const onQueryChange = query =>
  State.update(s => {
    s.issueList.query = query
  })
export default function IssueList({ popup }: { popup: string }) {
  const query = useStoreState(State, s => s.issueList.query)
  const { header, list } = useStoreState(State, s => ({ header: s.issueListHeader, list: Object.values(s.issues) }))
  const updateSelectedIssue = useCallback(issue => {
    State.update(s => {
      s.selectedIssue = issue.replace(/.*?(\w+-\d+).*/, '$1')
    })
  }, [])
  useEffect(() => {
    const all = false
    const jql = all ? `project=${state.config.project.key}` : getDefaultJQL()
    fetchList(jql)
  }, [])

  return (
    <box>
      <Fzf
        onQueryChange={onQueryChange}
        query={query}
        onSelectionChange={updateSelectedIssue}
        isFocused={!popup}
        header={header}
        list={list}
      />
    </box>
  )
}
