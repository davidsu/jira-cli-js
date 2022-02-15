//@ts-nocheck
import type { FC } from 'react'
import React, { useEffect, useState, useMemo } from 'react'
import { Text, Box } from 'ink'
import TextInput from './TextInput'
import Fuse from 'fuse.js'
import { getDefaultJQL, search } from '../api'
import { reduce } from '@atlaskit/adf-utils'

const width = process.stdout.columns
const height = process.stdout.rows
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
    .map((s, idx) => nameMap(s))
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
const App: FC<{ name?: string }> = () => {
  const [query, setQuery] = useState('')
  const [rawList, setList] = useState([])
  const [fuse, setFuse] = useState(makeFuse(rawList))
  const [focusId, setFocusId] = useState('')

  const list = useMemo(() => {
    if (!fuse.search || !query) return rawList
    return fuse
      .search(query)
      .slice(0, height - 4)
      .map(({ item }) => item)
  }, [rawList, fuse, query])

  useEffect(async () => {
    const all = false
    const JQL = all ? `project=${state.config.project.key}` : getDefaultJQL()
    const data = await search(`${JQL}&fields=${fields}`, false)
    const dataString = [header, ...data.issues].map(v =>
      [
        makeCol(makePath(data, v), 25),
        makeCol(v.fields.issuetype?.name, 9),
        makeCol(v.fields.summary, 60),
        makeCol(v.fields.status?.name, 12),
        makeCol(v.fields.assignee?.displayName, 15),
        makeCol(v.fields.priority?.name, 15),
        makeCol(parseDescription(v.fields.description).replace?.(/\n/g, '-'), 40, Infinity),
        makeUiPath(makePath(data, v), getTitle.bind(null, data)),
      ].join(' ')
    )
    setList(dataString)
    setFuse(makeFuse(dataString))
  }, [])

  function onCombo(input, key) {
    if (key.ctrl) {
      switch (input) {
        case 'n':
          setFocusId(list[list.indexOf(focusId) + 1])
          break
        case 'p':
          setFocusId(list[list.indexOf(focusId) - 1])
          break
      }
    }
  }
  return (
    <>
      <Box borderStyle="single" marginRight={2}>
        <TextInput value={query} onChange={setQuery} onCombo={onCombo}></TextInput>
      </Box>
      {list.slice(0, height - 4).map(txt => (
        <Box key={txt}>
          {txt === focusId ? (
            <Text backgroundColor="#303030" color="#FFFFFF">
              {txt.substring(0, width - 5)}
            </Text>
          ) : (
            <Text>{txt.substring(0, width - 5)}</Text>
          )}
        </Box>
      ))}
    </>
  )
}

module.exports = App
export default App
