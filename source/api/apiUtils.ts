import type { RequestInit } from 'node-fetch'
import nodeFetch from 'node-fetch'
import fs from 'fs-extra'
import yml from 'YAML'
import os from 'os'
import chalk from 'chalk'
import hash from 'object-hash'
import { logger } from '../logger'
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
let debug = process.argv.includes('--debug')
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

const sep = key => chalk.grey('-'.repeat(40) + key + '-'.repeat(40))
function requestDebugger(url, options) {
  if (debug) {
    logger.log(sep('url'))
    logger.log(encodeURI(url))

    const { body, ...other } = options
    logger.log(sep('options'))
    logger.log(other)

    if (body) {
      logger.log(sep('body'))
      logger.log(body)
    }
    const encodedcurl = createCurlCommand(url, options)
    const decodedcurl = createCurlCommand(url, options, false)

    if (encodedcurl !== decodedcurl) {
      logger.log(decodedcurl + '\n')
    }
    logger.log(encodedcurl)
  }
}
export const fetch = (url: string, options = state.opts) => {
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
  let cache = null
  let cacheFile = ''
  if (options.method === 'GET') {
    cacheFile = `/tmp/jira-cache/${hash({ url, options })}.json`
    fs.ensureDir('/tmp/jira-cache')

    promise.then(json => fs.writeJSONSync(cacheFile, json))

    // todo: maybe we'd rather save cache to a location that will hold on computer restart... just a thought.

    if (fs.existsSync(cacheFile)) {
      // return fs.readJson(cacheFile);
      cache = fs.readJson(cacheFile)
    }
  }
  return { cache, cacheFile }
}

export const getUrl = path => `${state.apiRoot}${state.apiPath}${path}`

export const fetchJson = (url, options = state.opts) => {
  const serverRequest = fetch(url, options)
    .then(r => r.json())
    .catch(e => console.error(e))

  return {
    server: serverRequest,
    ...cacheResult(url, options, serverRequest),
  }
}
