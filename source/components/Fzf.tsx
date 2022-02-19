/* eslint-disable no-case-declarations */
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Text, Box } from 'ink'
import TextInput from './TextInput'
import Fuse from 'fuse.js'
import useScreenSize from './useScreenSize.js'
import chalk from 'chalk'

function createMatchedTextNode(fuseItem: Fuse.FuseResult<string>, width: number) {
  let coloredItem = fuseItem.item.substring(0, width)
  if (fuseItem.matches?.length) {
    const indices = [...fuseItem.matches[fuseItem.matches.length - 1].indices].sort(([sa], [sb]) => sa - sb)
    let last = Number.POSITIVE_INFINITY
    for (let i = indices.length - 1; i >= 0; i--) {
      let [start, finish] = indices[i]
      finish = Math.min(finish, last - 1)
      last = Math.min(start, last)
      if (finish < width && finish - start > 1) {
        coloredItem =
          coloredItem.substring(0, start) +
          chalk.green(coloredItem.substring(start, finish + 1)) +
          coloredItem.substring(finish + 1)
      }
    }
  }
  return coloredItem
}

function createRow(fuseItem: Fuse.FuseResult<string>, width: number, focusId: string) {
  let coloredItem = createMatchedTextNode(fuseItem, width)
  const props = fuseItem.item === focusId ? { backgroundColor: '#303030', color: '#FFFFFF' } : {}
  return (
    <Box key={fuseItem.item} flexGrow={4}>
      <Text {...props}>{coloredItem}</Text>
    </Box>
  )
}

const createRows = (
  list: Fuse.FuseResult<string>[],
  focusedIdx: number,
  focusId: string,
  width: number,
  height: number
) =>
  list
    .slice(Math.max(focusedIdx - height + 3, 0), Math.max(height - 2, focusedIdx + 1))
    .map(fuseItem => createRow(fuseItem, width, focusId))

function makeDisplayList(
  list: Fuse.FuseResult<string>[],
  focusedIdx: number,
  focusId: string,
  width: number,
  height: number
) {
  const fillHeight = Math.max(height - 3 - list.length, 0)
  return (
    <>
      {createRows(list, focusedIdx, focusId, width, height)}
      <Box height={fillHeight} />
    </>
  )
}

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
  const { height, width } = useScreenSize()

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
  return (
    <Box flexDirection="column" height="100%">
      <Box width={'100%'} height={1}>
        <Text color="yellow">{`(${list.length}/${filteredList.length})`}</Text>
        <Text color="cyan">&gt;&nbsp;</Text>
        <TextInput value={query} onChange={setQuery} onCombo={onCombo}></TextInput>
      </Box>
      <Box>
        <Text>{header}</Text>
      </Box>
      {makeDisplayList(filteredList, focusedIdx, focusId, width, height)}
    </Box>
  )
}

export default Fzf
