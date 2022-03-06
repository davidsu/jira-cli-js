import React, { useCallback, useEffect } from 'react'
import Fzf from './fzf/Fzf'
import { fetchList, State } from './../store'
import { useStoreState } from 'pullstate'
import { getDefaultJQL, state } from './../api'
const onQueryChange = query =>
  State.update(s => {
    s.issueList.query = query
  })
const stateSlice = () =>
  useStoreState(State, s => ({
    header: s.issueListHeader,
    list: Object.values(s.issues),
    query: s.issueList.query,
    refresh: s.refresh,
  }))

export default function IssueList({ popup }: { popup: string }) {
  const { header, list, query, refresh } = stateSlice()
  const updateSelectedIssue = useCallback(issue => {
    State.update(s => {
      s.selectedIssue = issue.replace(/.*?(\w+-\d+).*/, '$1')
    })
  }, [])

  useEffect(() => {
    const all = false
    const jql = all ? `project=${state.config.project.key}` : getDefaultJQL()
    fetchList(jql)
  }, [refresh])

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
