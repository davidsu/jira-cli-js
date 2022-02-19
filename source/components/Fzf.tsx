/* eslint-disable no-case-declarations */
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Text, Box } from 'ink'
import List from './List'
import TextInput from './TextInput'
import Fuse from 'fuse.js'

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
  const applyQuery = useCallback(
    debounce(() => {
      const _query = (query || '')
        .replace(/'\s*$/, '')
        .replace(/(\w+(?:\\\s\w+)+)/g, (_match, g1) => `"${g1.replace(/\\/g, '')}"`) //make it behave like fzf
      if (fuse.search && _query) {
        setFilteredList(fuse.search(_query))
        return
      }
      setFilteredList(list.map(item => ({ item })) as Fuse.FuseResult<string>[])
    }, 90),
    [list, fuse, query]
  )
  useEffect(applyQuery, [list, fuse, query])
  const indexOfFocusId = useMemo(
    () => filteredList.findIndex(fuseItem => fuseItem.item === focusId),
    [focusId, filteredList]
  )
  const focusedIdx = useMemo(() => Math.max(indexOfFocusId, 0), [indexOfFocusId])

  function onCombo(input, key) {
    //todo handle delete, ctrl-u, arrows
    if (key.ctrl) {
      switch (input) {
        case 'n':
          setFocusId(filteredList[indexOfFocusId + 1]?.item || '')
          break
        case 'p':
          const idx = indexOfFocusId > 0 ? indexOfFocusId - 1 : filteredList.length - 1
          setFocusId(filteredList[idx]?.item || '')
          break
      }
    }
  }
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
  const filteredIndicatorDisplay =
    filteredIndicator + '\u00A0'.repeat(maxFilterIndicatorLength - filteredIndicator.length)
  return (
    <Box flexDirection="column" height="100%">
      <Box width={'100%'} height={1}>
        <Text color="yellow">{filteredIndicatorDisplay}</Text>
        <Text color="cyan"> &gt;&nbsp; </Text>
        <TextInput value={query} onChange={setQuery} onCombo={onCombo}></TextInput>
      </Box>
      <Box>
        <Text wrap="truncate-end">{header}</Text>
      </Box>
      <List list={filteredList} focusedIdx={focusedIdx} focusId={focusId} />
    </Box>
  )
}

export default Fzf
