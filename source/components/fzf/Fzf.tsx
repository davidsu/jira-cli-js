import type { SetStateAction } from 'react'
import React, { useState, useMemo, useEffect } from 'react'
import List from './List'
import Fuse from 'fuse.js'
import chalk from 'chalk'
import TextInput from './TextInput'
import { fetchList } from '../../store'
import { getDefaultJQL, state } from '../../api'
import type { Widgets } from 'blessed'
import { resetColors } from '../../utils'

type FzfProps = Debug<
  {
    onAccept?: (value?: string) => unknown
    promptType?: string
    isFocused: boolean
    header?: string
    list: Array<{ display: string } | string>
  } & Widgets.BoxOptions
>

const prompts = {
  fzf(list, filteredList) {
    return useMemo(() => {
      const len = String(list.length).length
      const label = `(${String(filteredList.length).padStart(len, '\u00A0')}/${list.length})`
      return chalk.yellow(label) + chalk.cyan('>\u00A0')
    }, [list, filteredList])
  },
}
const Fzf = ({
  promptType = 'fzf',
  onAccept = () => {},
  header,
  list,
  isFocused,
  width = '100%',
  height = '100%',
  top = 0,
  left = 0,
  onQueryChange = () => {},
  ...props
}: FzfProps) => {
  const [query, setQuery] = useState('')
  const [focusId, setFocusId] = useState('')
  const [filteredList, setFilteredList] = useState([] as Fuse.FuseResult<Issue>[])
  useEffect(() => onQueryChange(query), [query])
  useEffect(() => {
    const all = false
    const jql = all ? `project=${state.config.project.key}` : getDefaultJQL()
    fetchList(jql)
  }, [])
  const fuse = useMemo(
    () =>
      new Fuse(list, {
        useExtendedSearch: true,
        includeMatches: true,
        ignoreFieldNorm: true,
        keys: ['display'],
        distance: 3000,
      }),
    [list]
  )
  useEffect(() => {
    const _query = (query || '')
      .replace(/'\s*$/, '')
      .replace(/(\w+(?:\\\s\w+)+)/g, (_match, g1) => `"${g1.replace(/\\/g, '')}"`) //make it behave like fzf
    if (fuse.search && _query) {
      setFilteredList(fuse.search(_query))
      return
    }
    setFilteredList(list.map(item => ({ item })) as SetStateAction<Fuse.FuseResult<Issue>[]>)
  }, [list, fuse, query])
  const indexOfFocusId = useMemo(
    () => filteredList.findIndex(fuseItem => fuseItem.item.display === focusId),
    [focusId, filteredList]
  )
  const focusedIdx = useMemo(() => Math.max(indexOfFocusId, 0), [indexOfFocusId])

  const { combo } = useMemo(
    () => ({
      combo: {
        return: () => {
          onAccept(filteredList[indexOfFocusId + 1]?.item.display)
        },
        'ctrl-n': () => setFocusId(filteredList[indexOfFocusId + 1]?.item.display || ''),
        'ctrl-p': () => {
          const idx = indexOfFocusId > 0 ? indexOfFocusId - 1 : filteredList.length - 1
          setFocusId(filteredList[idx]?.item.display || '')
        },
      },
    }),
    [filteredList, indexOfFocusId]
  )

  const prompt = prompts[promptType]?.(list, filteredList) || promptType

  return (
    <box width={width} height={height} top={top} left={left} {...props}>
      <text top={0}>{prompt}</text>
      {isFocused ? (
        <TextInput top={0} left={resetColors(prompt).length} combo={combo} onValueChange={setQuery} />
      ) : undefined}
      {header && <text top={1}>{chalk.bold(chalk.hex('#90adaf')(header))}</text>}
      <box top={header ? 2 : 1}>
        <List
          list={filteredList.map(t => ({ ...t, item: t.item.display }))}
          height={Number(height) - 2}
          focusedIdx={focusedIdx}
          focusId={focusId}
        />
      </box>
    </box>
  )
}

export default Fzf
