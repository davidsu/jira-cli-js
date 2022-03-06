import { useStoreState } from 'pullstate'
import React, { useEffect, useRef } from 'react'
import { State } from '../store'

const Popup: React.FC<{}> = ({ children }) => {
  const ref: any = useRef(null)
  const runningTasks = useStoreState(State, s => Object.values(s.runningTasks).map(({ display }) => display))
  useEffect(() => {
    if (ref.current) {
      ref.current.setIndex(1000)
    }
  }, [ref])
  return (
    <box ref={ref} border={{ fg: 246, type: 'line' }} height="50%" width="50%" top="center" left="center">
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
