import React, { useState, useMemo } from 'react'
import { Text, Box } from 'ink'
import TextInput from './TextInput'
import Fuse from 'fuse.js'
import useScreenSize from './useScreenSize.js'

function makeDisplayList(
  list: unknown[],
  focusedIdx: number,
  focusId: string,
  width: number,
  height: number
): React.ReactNode {
  const fillHeight = Math.max(height - 3 - list.length, 0)
  return (
    <>
      {list.slice(Math.max(focusedIdx - height + 3, 0), Math.max(height - 2, focusedIdx + 1)).map(txt => (
        <Box key={txt as string} flexGrow={4}>
          {txt === focusId ? (
            <Text backgroundColor="#303030" color="#FFFFFF">
              {txt.substring(0, width)}
            </Text>
          ) : (
            <Text>{(txt as string).substring(0, width - 5)}</Text>
          )}
        </Box>
      ))}
      <Box height={fillHeight} />
    </>
  )
}
const App = ({ list, header }: { list: Array<string>; header: string }) => {
  console.log({ list })
  const [query, setQuery] = useState('')
  const [focusId, setFocusId] = useState('')
  const { height, width } = useScreenSize()

  const fuse = useMemo(
    () =>
      new Fuse(list, { useExtendedSearch: true, includeMatches: true, ignoreLocation: true, ignoreFieldNorm: true }),
    [list]
  )

  const filteredList = useMemo(() => {
    if (!fuse.search || !query) return list //.slice(0, height - 3)
    return fuse.search(query).map(({ item }) => item) as string[]
  }, [list, fuse, query])

  const focusedIdx = useMemo(() => Math.max(filteredList.indexOf(focusId), 0), [filteredList, focusId])

  function onCombo(input, key) {
    if (key.ctrl) {
      switch (input) {
        case 'n':
          setFocusId(filteredList[filteredList.indexOf(focusId) + 1] || '')
          break
        case 'p':
          setFocusId(filteredList[filteredList.indexOf(focusId) - 1] || filteredList[filteredList.length - 1] || '')
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

export default App
