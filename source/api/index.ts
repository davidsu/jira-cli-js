import { fetch, fetchJson, state, getUrl, getDefaultJQL } from './apiUtils'
export { getDefaultJQL, state }

export const searchUser = partialName =>
  fetchJson(
    `${getUrl('user/assignable/multiProjectSearch')}?projectKeys=${state.config.project.key}&query=${partialName}`,
    state.opts
  )

export function search(params = state.JQL) {
  //todo hacky. this must be related to some version the account is in.
  const prefix = /dchamud/.test(state.apiRoot) ? '' : 'jql='
  const url = `${getUrl('search')}?${prefix}${params}&maxResults=100`
  return fetchJson(url, {
    method: 'GET',
    headers: state.headers,
  })
}

export const assignIssue = (issueId, accountId) =>
  fetch(getUrl(`issue/${issueId}`), {
    method: 'PUT',
    headers: state.headers,
    body: JSON.stringify({ fields: { assignee: { accountId } } }),
  })
