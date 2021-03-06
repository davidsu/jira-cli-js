import { reduce } from '@atlaskit/adf-utils'
import { search } from './api'
import { Store, createAsyncAction, errorResult, successResult } from 'pullstate'
import React, { createContext, useCallback, useReducer } from 'react'

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

const getTitle = (data, id) => data.issues.find(({ key }) => key === id)?.fields?.summary
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
}

type Initial = {
  search: {
    displayList: Array<string>
    header: string
    data: Array<any>
  }
}

const initialState: Initial = {
  search: {
    displayList: [],
    header: makeDisplayRow({ issues: [] }, header),
    data: [],
  },
}

const setList = (state, data) => {
  state.search.displayList = data.issues.map(v => makeDisplayRow(data, v))
  state.search.rawData = data
}

export const State = new Store(initialState)

export const fetchList = async jql => {
  const { cache, server } = search(`${jql}&fields=${fields}`)
  for (const promise of [cache, server]) {
    promise.then(data => State.update(state => setList(state, data)))
  }
}
