import React, { useState, useMemo, useEffect } from 'react'
import List from './List'
import Fuse from 'fuse.js'
import chalk from 'chalk'
import TextInput from './TextInput'

function debounce(func, timeout = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, timeout)
  }
}

const Fzf = ({ list, header }: { list: Array<string>; header: string }) => {
  const [query, setQuery] = useState('')
  const [focusId, setFocusId] = useState('')
  const [filteredList, setFilteredList] = useState([] as Fuse.FuseResult<string>[])

  const fuse = useMemo(
    () =>
      new Fuse(list, {
        useExtendedSearch: true,
        includeMatches: true,
        ignoreFieldNorm: true,
        distance: 3000,
      }),
    [list]
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
      setFilteredList(list.map(item => ({ item })) as Fuse.FuseResult<string>[])
    }, 30),
    [list, fuse, query]
  )
  const indexOfFocusId = useMemo(
    () => filteredList.findIndex(fuseItem => fuseItem.item === focusId),
    [focusId, filteredList]
  )
  const focusedIdx = useMemo(() => Math.max(indexOfFocusId, 0), [indexOfFocusId])

  const { combo } = useMemo(
    () => ({
      combo: {
        escape: () => process.exit(0),
        'ctrl-n': () => setFocusId(filteredList[indexOfFocusId + 1]?.item || ''),
        'ctrl-p': () => {
          const idx = indexOfFocusId > 0 ? indexOfFocusId - 1 : filteredList.length - 1
          setFocusId(filteredList[idx]?.item || '')
        },
      },
    }),
    [filteredList, indexOfFocusId]
  )

  const maxFilterIndicatorLength = useMemo(() => {
    let calc = list.length
    let length = 0
    while (calc >= 1) {
      length++
      calc /= 10
    }
    length = Math.max(length, 1)
    return 3 + length * 2
  }, [list])
  const filteredIndicator = `(${list.length}/${filteredList.length})`
  const filteredIndicatorDisplay = chalk.yellow(
    filteredIndicator + '\u00A0'.repeat(maxFilterIndicatorLength - filteredIndicator.length)
  )

  return (
    <>
      <text top={0}>{filteredIndicatorDisplay + chalk.cyan('>\u00A0')}</text>
      <TextInput top={0} left={filteredIndicator.length + 2} combo={combo} onValueChange={setQuery} />
      <text top={1}>{chalk.bold(chalk.hex('#90adaf')(header))}</text>
      <List list={filteredList} focusedIdx={focusedIdx} focusId={focusId} />
    </>
  )
}

export default Fzf
