import type { SetStateAction } from 'react'
import React, { useState, useMemo, useEffect } from 'react'
import List from './List'
import Fuse from 'fuse.js'
import chalk from 'chalk'
import TextInput from './TextInput'
import { State } from '../store'

function debounce(func, timeout = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, timeout)
  }
}

const Fzf = () => {
  const { issueListHeader, issues } = State.useState()
  const [query, setQuery] = useState('')
  const [focusId, setFocusId] = useState('')
  const [filteredList, setFilteredList] = useState([] as Fuse.FuseResult<Issue>[])

  const fuse = useMemo(
    () =>
      new Fuse(Object.values(issues), {
        useExtendedSearch: true,
        includeMatches: true,
        ignoreFieldNorm: true,
        keys: ['display'],
        distance: 3000,
      }),
    [issues]
  )
  useEffect(
    debounce(() => {
      const _query = (query || '')
        .replace(/'\s*$/, '')
        .replace(/(\w+(?:\\\s\w+)+)/g, (_match, g1) => `"${g1.replace(/\\/g, '')}"`) //make it behave like fzf
      if (fuse.search && _query) {
        setFilteredList(fuse.search(_query))
        return
      }
      setFilteredList(Object.values(issues).map(item => ({ item })) as SetStateAction<Fuse.FuseResult<Issue>[]>)
    }, 30),
    [issues, fuse, query]
  )
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

  const maxFilterIndicatorLength = useMemo(() => {
    let calc = Object.keys(issues).length
    let length = 0
    while (calc >= 1) {
      length++
      calc /= 10
    }
    length = Math.max(length, 1)
    return 3 + length * 2
  }, [issues])
  const filteredIndicator = `(${Object.keys(issues).length}/${filteredList.length})`
  const filteredIndicatorDisplay = chalk.yellow(
    filteredIndicator + '\u00A0'.repeat(maxFilterIndicatorLength - filteredIndicator.length)
  )

  debugger
  return (
    <>
      <text top={0}>{filteredIndicatorDisplay + chalk.cyan('>\u00A0')}</text>
      <TextInput top={0} left={filteredIndicator.length + 2} combo={combo} onValueChange={setQuery} />
      <text top={1}>{chalk.bold(chalk.hex('#90adaf')(issueListHeader))}</text>
      <List list={filteredList.map(t => ({ ...t, item: t.item.display }))} focusedIdx={focusedIdx} focusId={focusId} />
    </>
  )
}

export default Fzf
