import { useStoreState } from 'pullstate'
import React from 'react'
import { State } from '../store'

const Popup: React.FC<{}> = ({ children }) => {
  const runningTasks = useStoreState(State, s => Object.values(s.runningTasks).map(({ display }) => display))
  return (
    <box border={{ fg: 246, type: 'line' }} height="50%" width="50%" top="center" left="center">
      {runningTasks.map((str, idx) => (
        <text key={idx} top={idx}>
          {str}
        </text>
      ))}
      <box top={runningTasks.length}>{children}</box>
    </box>
  )
}

export default Popup
