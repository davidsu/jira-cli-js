import type { SetStateAction } from 'react'
import React, { useState, useMemo, useEffect } from 'react'
import List from './List'
import Fuse from 'fuse.js'
import chalk from 'chalk'
import TextInput from './TextInput'
import { fetchList, State } from '../store'
import { useStoreState } from 'pullstate'
import { getDefaultJQL, state } from '../api'
import type { Widgets } from 'blessed'

type FzfProps = { isFocused: boolean } & Widgets.BoxOptions
const Fzf = ({ isFocused, width = '100%', height = '100%', top = 0, left = 0 }: FzfProps) => {
  const { header, issues } = useStoreState(State, s => ({ header: s.issueListHeader, issues: Object.values(s.issues) }))
  const [query, setQuery] = useState('')
  const [focusId, setFocusId] = useState('')
  const [filteredList, setFilteredList] = useState([] as Fuse.FuseResult<Issue>[])
  useEffect(() => {
    const all = false
    const jql = all ? `project=${state.config.project.key}` : getDefaultJQL()
    fetchList(jql)
  }, [])
  const fuse = useMemo(
    () =>
      new Fuse(issues, {
        useExtendedSearch: true,
        includeMatches: true,
        ignoreFieldNorm: true,
        keys: ['display'],
        distance: 3000,
      }),
    [issues]
  )
  useEffect(() => {
    const _query = (query || '')
      .replace(/'\s*$/, '')
      .replace(/(\w+(?:\\\s\w+)+)/g, (_match, g1) => `"${g1.replace(/\\/g, '')}"`) //make it behave like fzf
    if (fuse.search && _query) {
      setFilteredList(fuse.search(_query))
      return
    }
    setFilteredList(issues.map(item => ({ item })) as SetStateAction<Fuse.FuseResult<Issue>[]>)
  }, [issues, fuse, query])
  const indexOfFocusId = useMemo(
    () => filteredList.findIndex(fuseItem => fuseItem.item.display === focusId),
    [focusId, filteredList]
  )
  const focusedIdx = useMemo(() => Math.max(indexOfFocusId, 0), [indexOfFocusId])

  const { combo } = useMemo(
    () => ({
      combo: {
        escape: () => process.exit(0),
        'ctrl-n': () => setFocusId(filteredList[indexOfFocusId + 1]?.item.display || ''),
        'ctrl-p': () => {
          const idx = indexOfFocusId > 0 ? indexOfFocusId - 1 : filteredList.length - 1
          setFocusId(filteredList[idx]?.item.display || '')
        },
      },
    }),
    [filteredList, indexOfFocusId]
  )

  const { filteredIndicatorLength, filteredIndicatorDisplay } = useMemo(() => {
    const len = String(issues.length).length
    const label = `(${String(filteredList.length).padStart(len, '\u00A0')}/${issues.length})`
    const coloredLabel = chalk.yellow(label)
    return { filteredIndicatorLength: label.length, filteredIndicatorDisplay: coloredLabel }
  }, [issues, filteredList])

  return (
    <box width={width} height={height} top={top} left={left}>
      <text top={0}>{filteredIndicatorDisplay + chalk.cyan('>\u00A0')}</text>
      {isFocused ? (
        <TextInput top={0} left={filteredIndicatorLength + 2} combo={combo} onValueChange={setQuery} />
      ) : undefined}
      <text top={1}>{chalk.bold(chalk.hex('#90adaf')(header))}</text>
      <List list={filteredList.map(t => ({ ...t, item: t.item.display }))} focusedIdx={focusedIdx} focusId={focusId} />
    </box>
  )
}

export default Fzf
