import type { RequestInit } from 'node-fetch'
import { exec } from 'child_process'
import nodeFetch from 'node-fetch'
import fs from 'fs-extra'
import yml from 'YAML'
import os from 'os'
import chalk from 'chalk'
import hash from 'object-hash'

const loadedState = {} as ReturnType<typeof loadState>
let loaded = false
export const state = new Proxy(loadedState, {
  get: (_, prop) => {
    if (!loaded) loadState()
    return loadedState[prop]
  },
})

export const apiBaseUrl = () => state.apiRoot
export const getDefaultJQL = () => state.JQL
function loadState() {
  loaded = true
  const home = os.homedir()
  const config = yml.parse(fs.readFileSync(`${home}/.config/.jira/.config.yml`).toString())
  const apiRoot = config.server
  const JQL = `project=${config.project.key} AND status not in ("Done", "Closed", "Ready for QA") ORDER BY created DESC`
  const apiPath = '/rest/api/3/'
  const token = process.env['JIRA_API_TOKEN']
  const user = config.login
  const base64auth = Buffer.from(`${user}:${token}`).toString('base64')
  const headers = {
    Authorization: `Basic ${base64auth}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  const opts = { method: 'GET', headers } as RequestInit & {
    headers: Record<string, string>
  }
  const _loadedState = {
    home,
    config,
    JQL,
    apiRoot,
    apiPath,
    token,
    user,
    base64auth,
    headers,
    opts,
  }
  Object.assign(state, _loadedState)
  return _loadedState
}
let debug = false
export const setDebug = isDebugging => (debug = isDebugging)

function createCurlCommand(url, options, encode = true) {
  let str = `curl --request ${options.method} `
  for (const [key, value] of Object.entries(options.headers)) {
    str += `-H '${key}: ${value}' `
  }
  const urlstr = encode ? encodeURI(url) : url
  str += ` \\\n  --url '${urlstr}' `

  const { body } = options
  if (body) {
    str += ` \\\n  --data-raw '${body}' `
  }
  return str
}

function requestDebugger(url, options) {
  if (debug) {
    console.log(sep('url'))
    console.log(encodeURI(url))

    const { body, ...other } = options
    console.log(sep('options'))
    console.log(other)

    if (body) {
      console.log(sep('body'))
      console.log(body)
    }
    const encodedcurl = createCurlCommand(url, options)
    const decodedcurl = createCurlCommand(url, options, false)

    if (encodedcurl !== decodedcurl) {
      console.log(decodedcurl, '\n')
    }
    console.log(encodedcurl)
  }
}
const fetch = (url: string, options = state.opts) => {
  requestDebugger(url, options)
  return nodeFetch(encodeURI(url), options).then(response => {
    if (!response.ok) {
      console.error(url, '\n', 'call to endpoint errorer with message:\n', response.statusText)
      process.exit(1)
    }
    return response
  })
}

const cacheResult = (url, options, promise) => {
  if (options.method === 'GET') {
    fs.ensureDir('/tmp/jira-cache')

    promise.then(json => fs.writeJSONSync(cacheFile, json))

    // todo: maybe we'd rather save cache to a location that will hold on computer restart... just a thought.
    const cacheFile = `/tmp/jira-cache/${hash({ url, options })}.json`

    if (fs.existsSync(cacheFile)) {
      // return fs.readJson(cacheFile);
      return Promise.any([fs.readJson(cacheFile), promise])
    }
  }
  return promise
}

const fetchJson = (url, options = state.opts, refresh = false) => {
  const cacheFile = `/tmp/jira-cache/${hash({ url, options })}.json`

  const serverRequest = () =>
    fetch(url, options)
      .then(r => r.json())
      .catch(e => console.error(e))

  if (!refresh && fs.existsSync(cacheFile)) {
    const curl = createCurlCommand(url, options)
    requestDebugger(url, options)
    const t = exec(`${curl} > ${cacheFile}`)
    t.unref()
    return fs.readJson(cacheFile).catch(serverRequest)
  }

  if (refresh) {
    return serverRequest()
  }
  return cacheResult(url, options, serverRequest())
}

const fetchJson2 = (url, options = state.opts) => {
  const cacheFile = `/tmp/jira-cache/${hash({ url, options })}.json`

  const serverRequest = fetch(url, options)
    .then(r => r.json())
    .catch(e => console.error(e))

  return {
    server: serverRequest,
    cache: cacheResult(url, options, serverRequest),
    cacheFile,
  }
}

const getUrl = path => `${state.apiRoot}${state.apiPath}${path}`
export function search(params = state.JQL) {
  //todo hacky. this must be related to some version the account is in.
  const prefix = /dchamud/.test(state.apiRoot) ? '' : 'jql='
  const url = `${getUrl('search')}?${prefix}${params}&maxResults=100`
  return fetchJson2(url, {
    method: 'GET',
    headers: state.headers,
  })
}

//@ts-ignore
export async function addIssueToEpic(issueId, epicId) {
  const url = getUrl(`epic/${epicId}/issue`)
  const result = await fetchJson(url, state.opts)
  return result
}

export async function getIssue(key, fields = '', refresh = false) {
  let url = `issue/${key}`
  if (fields) {
    url += `?fields=${fields}`
  }

  const result = await fetchJson(getUrl(url), state.opts, refresh)
  return result
}

export const getCreateMeta = () => fetchJson(getUrl('issue/createmeta'), state.opts)
export const assignIssue = (issueId, accountId) =>
  fetch(getUrl(`issue/${issueId}`), {
    method: 'PUT',
    headers: state.headers,
    body: JSON.stringify({ fields: { assignee: { accountId } } }),
  })

export const getIssueLinkMeta = () => fetchJson(getUrl`issueLinkType`)
export const createIssueLink = ({ inwardIssue, outwardIssue, type }) =>
  fetch(getUrl`issueLink`, {
    method: 'POST',
    headers: state.headers,
    body: JSON.stringify({ inwardIssue, outwardIssue, type }),
  })

export async function callTransition(issueId, body?) {
  const url = getUrl(`issue/${issueId}/transitions`)
  if (!body) return fetchJson(url, { method: 'GET', headers: state.headers }, true)
  return fetch(url, {
    method: 'POST',
    headers: state.headers,
    body: JSON.stringify(body),
  })
}

export const getPriorities = () => fetchJson(getUrl('/priority'))
export const setPriority = (issueId, priorityId) =>
  fetch(getUrl(`issue/${issueId}`), {
    method: 'PUT',
    headers: state.headers,
    body: JSON.stringify({ fields: { priority: { id: priorityId } } }),
  })

function createIssueBodyCreator(title: any, meta: any, type: any, description: any) {
  return {
    update: {},
    fields: {
      // description,
      project: { key: state.config.project.key },
      summary: title,
      issuetype: {
        id: meta.projects[0].issuetypes.find(({ name }) => name.toLowerCase() === type.toLowerCase()).id,
      },
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                text: description,
                type: 'text',
              },
            ],
          },
        ],
      },
    } as any,
  }
}

const sep = key => chalk.grey('-'.repeat(40) + key + '-'.repeat(40))

export const searchUser = async partialName =>
  fetchJson(
    `${getUrl('user/assignable/multiProjectSearch')}?projectKeys=${state.config.project.key}&query=${partialName}`,
    state.opts
  )

// const createParentSettings =
export async function createIssue({ type, assignee, parent, title, description }) {
  setDebug(debug)
  const meta = await getCreateMeta()
  if (debug) {
    console.log('meta', JSON.stringify(meta, null, 4))
    console.log({ type })
  }
  const body = createIssueBodyCreator(title, meta, type, description)
  Object.assign(body.fields, await createIssueParentSettings(parent))
  if (assignee) {
    const users = await searchUser(assignee)
    const _user = users.find(({ emailAddress, displayName }) => {
      return (
        emailAddress?.toLowerCase?.() === assignee.toLowerCase() ||
        displayName?.toLowerCase?.() === assignee.toLowerCase()
      )
    })
    body.fields.assignee = { accountId: _user.accountId }
  }
  const url = getUrl('issue')
  if (debug) {
    console.log({ url })
    console.log('request\n', JSON.stringify(body), '\n\n')
    console.log(`curl --url '${url}' \\
                -H 'Accept: application/json' \\
                -H 'Content-Type: application/json' \\
                -H 'Authorization: ${state.opts.headers['Authorization']}' \\
                --data-raw '${JSON.stringify(body)}'`)
  }
  return fetchJson(url, {
    method: 'POST',
    headers: state.headers,
    body: JSON.stringify(body),
  })
}

//@ts-ignore
async function createIssueParentSettings(parent) {
  if (parent) {
    return { parent: { key: parent.toUpperCase() } }
  }
}
