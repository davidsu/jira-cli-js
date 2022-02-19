/* eslint-disable no-case-declarations */
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
// import { Text, Box } from 'react-blessed'
import List from './List'
// import TextInput from './TextInput'
import Fuse from 'fuse.js'
import chalk from 'chalk'

function debounce(func, timeout = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, timeout)
  }
}

const exitOnEscape = (_, key) => {
  if (key.name === 'escape') {
    process.exit(0)
  }
}

const refFunc = (ref, func, ...args) => ref.current[func](...args)
const Fzf = ({ list, header }: { list: Array<string>; header: string }) => {
  const [query, setQuery] = useState('')
  const [focusId, setFocusId] = useState('')
  const [filteredList, setFilteredList] = useState([] as Fuse.FuseResult<string>[])
  const ref = useRef(null)

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

  const onCombo = useCallback(
    function onCombo(input, key) {
      //todo handle delete, ctrl-u, arrows
      if (key.ctrl) {
        switch (key.name) {
          case 'n':
            setFocusId(filteredList[indexOfFocusId + 1]?.item || '')
            break
          case 'p':
            const idx = indexOfFocusId > 0 ? indexOfFocusId - 1 : filteredList.length - 1
            setFocusId(filteredList[idx]?.item || '')
            break
        }
      }
      setTimeout(() => {
        const value = refFunc(ref, 'getValue')
        if (value !== query) {
          setQuery(value)
        }
      }, 0)
    },
    [filteredList, indexOfFocusId, ref]
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

  useEffect(() => {
    if (ref.current) {
      refFunc(ref, 'focus')
      refFunc(ref, 'on', 'keypress', exitOnEscape)
    }
    return () => refFunc(ref, 'off', 'keypress', exitOnEscape)
  }, [ref])
  useEffect(() => {
    if (ref.current) {
      refFunc(ref, 'on', 'keypress', onCombo)
    }
    return () => refFunc(ref, 'off', 'keypress', onCombo)
  }, [ref, onCombo])
  return (
    <>
      <text top={0}>{filteredIndicatorDisplay + chalk.cyan('>\u00A0')}</text>
      <textarea top={0} left={filteredIndicator.length + 2} inputOnFocus={true} input={true} ref={ref} />
      <text top={1}>{header}</text>
      <List list={filteredList} focusedIdx={focusedIdx} focusId={focusId} />
    </>
  )
}

export default Fzf
