import type { FC } from 'react'
import Fzf from './Fzf'
import React, { useEffect } from 'react'
import { getDefaultJQL, state } from '../api'
import { fetchList } from '../state/listSlice'
import { useSelector, useDispatch } from 'react-redux'

const App: FC<{ name?: string }> = () => {
  //@ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { displayList, header } = useSelector(state => state.search)
  const dispatch = useDispatch()

  useEffect(() => {
    const all = false
    const jql = all ? `project=${state.config.project.key}` : getDefaultJQL()
    dispatch(fetchList(jql))
  }, [])

  debugger
  //@ts-ignore
  return <Fzf list={displayList} header={header} />
}

export default App
