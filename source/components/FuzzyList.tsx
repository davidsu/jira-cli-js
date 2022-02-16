import type { FC } from 'react'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Text, Box } from 'ink'
import TextInput from './TextInput'
import Fuse from 'fuse.js'
import { getDefaultJQL, search, state } from '../api'
import { reduce } from '@atlaskit/adf-utils'
import useScreenSize from './useScreenSize.js'

const header = {
  key: 'KEY',
  fields: {
    issuetype: { name: 'TYPE' },
    summary: 'SUMMARY',
    status: { name: 'STATUS' },
    assignee: { displayName: 'ASSIGNEE' },
    priority: { name: 'PRIORITY' },
    description: 'DESCRIPTION',
  },
}

const fields = [
  'accountId',
  'assignee',
  'description',
  'displayName',
  'fields',
  'id',
  'issues',
  'issuetype',
  'key',
  'name',
  'parent',
  'priority',
  'self',
  'status',
  'summary',
].join(',')

function makeCol(val, len, maxLen = len) {
  if (!val) return ' '.repeat(len)
  // eslint-disable-next-line no-param-reassign
  val = val.replace(/^\s+/, '')
  if (val.length > maxLen) {
    return `${val.substring(0, len - 3)}...`
  }
  return val.padEnd(len, ' ')
}

function makePath(data, issue) {
  const issuePath = [issue.key]
  //todo use different data-structure for performance
  const findIssue = id => data.issues.find(({ key }) => key === id)
  while (issue?.fields?.parent && issue.fields.parent.key !== issue.key) {
    issuePath.push(issue.fields.parent.key)
    // eslint-disable-next-line no-param-reassign
    issue = findIssue(issue.fields.parent.key)
  }
  return issuePath.reverse().join('/')
}

const makeUiPath = (str, nameMap = id => id) =>
  str
    .split('/')
    .map(s => nameMap(s))
    .join('/')

const parseDescription = description => {
  if (!description || typeof description === 'string') return description || ''
  return reduce(
    description,
    (res, val) => {
      switch (val.type) {
        case 'hardBreak':
        case 'paragraph':
          return res.length ? res + '\n' : res
        case 'text':
          return res + val.text
        case 'link':
          return res + val.attr.href
      }
      return res
    },
    ''
  ).replace(/^\s+/, '')
}
const makeFuse = list =>
  new Fuse(list, { useExtendedSearch: true, includeMatches: true, ignoreLocation: true, ignoreFieldNorm: true })
const getTitle = (data, id) => data.issues.find(({ key }) => key === id)?.fields?.summary

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
              {txt.substring(0, width - 5)}
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
const App: FC<{ name?: string }> = () => {
  const [query, setQuery] = useState('')
  const [rawList, setList] = useState([] as string[])
  const [fuse, setFuse] = useState(makeFuse(rawList))
  const [focusId, setFocusId] = useState('')
  const [displayHeader, setDisplayHeader] = useState('')
  const { height, width } = useScreenSize()

  const makeDisplayRow = useCallback(
    function makeDisplayRow(data, v): string {
      return [
        makeCol(makePath(data, v), 25),
        makeCol(v.fields.issuetype?.name, 9),
        makeCol(v.fields.summary, 60),
        makeCol(v.fields.status?.name, 12),
        makeCol(v.fields.assignee?.displayName, 15),
        makeCol(v.fields.priority?.name, 15),
        makeCol(parseDescription(v.fields.description).replace?.(/\n/g, '-'), 40, Infinity),
        makeUiPath(makePath(data, v), getTitle.bind(null, data)),
      ].join(' ')
    },
    [width]
  )
  const list = useMemo(() => {
    if (!fuse.search || !query) return rawList //.slice(0, height - 3)
    return (
      fuse
        .search(query)
        // .slice(0, height - 3)
        .map(({ item }) => item) as string[]
    )
  }, [rawList, fuse, query])

  const focusedIdx = useMemo(() => Math.max(list.indexOf(focusId), 0), [list, focusId])

  useEffect(() => {
    ;(async () => {
      const all = false
      const JQL = all ? `project=${state.config.project.key}` : getDefaultJQL()
      const data = await search(`${JQL}&fields=${fields}`, false)
      const dataString = data.issues.map(v => makeDisplayRow(data, v))
      setList(dataString)
      setDisplayHeader(makeDisplayRow(data, header))
      setFuse(makeFuse(dataString))
    })()
  }, [])

  function onCombo(input, key) {
    if (key.ctrl) {
      switch (input) {
        case 'n':
          setFocusId(list[list.indexOf(focusId) + 1] || '')
          break
        case 'p':
          setFocusId(list[list.indexOf(focusId) - 1] || list[list.length - 1] || '')
          break
      }
    }
  }
  return (
    <Box flexDirection="column" height="100%">
      <Box width={'100%'} height={1}>
        <Text color="yellow">{`(${rawList.length}/${list.length})`}</Text>
        <Text color="cyan">&gt;&nbsp;</Text>
        <TextInput value={query} onChange={setQuery} onCombo={onCombo}></TextInput>
      </Box>
      <Box>
        <Text>{displayHeader}</Text>
      </Box>
      {makeDisplayList(list, focusedIdx, focusId, width, height)}
    </Box>
  )
}

export default App
