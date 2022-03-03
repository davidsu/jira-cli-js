import chalk from 'chalk'
import type Fuse from 'fuse.js'
import React from 'react'
type Props = {
  list: Fuse.FuseResult<string>[]
  focusedIdx: number
  focusId: string
}

function createMatchedTextNode(fuseItem: Fuse.FuseResult<string>, width: number) {
  let coloredItem = fuseItem.item.substring(0, width)
  if (fuseItem.matches?.length) {
    const indices = [...fuseItem.matches[fuseItem.matches.length - 1].indices]
      .filter(([start]) => start < width)
      .sort(([sa], [sb]) => sa - sb)
    let last = Number.POSITIVE_INFINITY
    for (let i = indices.length - 1; i >= 0; i--) {
      let [start, finish] = indices[i]
      finish = Math.min(finish, last - 1)
      last = Math.min(start, last)
      if (finish < width && finish - start > 1) {
        coloredItem =
          coloredItem.substring(0, start) +
          chalk.green(coloredItem.substring(start, finish + 1)) +
          coloredItem.substring(finish + 1)
      }
    }
  }
  return coloredItem
}

function createRow(fuseItem: Fuse.FuseResult<string>, width: number, focusId: string, idx: number) {
  let coloredItem = createMatchedTextNode(fuseItem, width)
  const color = fuseItem.item === focusId ? chalk.bgHex('#282828').hex('#F0F0F0')(coloredItem) : coloredItem
  return (
    <text top={idx} key={fuseItem.item}>
      {color}
    </text>
  )
}

const createRows = (
  list: Fuse.FuseResult<string>[],
  focusedIdx: number,
  focusId: string,
  width: number,
  height: number
) =>
  list
    .slice(Math.max(focusedIdx - height + 3, 0), Math.max(height - 2, focusedIdx + 1))
    .map((fuseItem, idx) => createRow(fuseItem, width, focusId, idx))

const List = React.memo(function List({ list, focusedIdx, focusId }: Props) {
  const width = process.stdout.columns
  const height = process.stdout.rows
  return <>{createRows(list, focusedIdx, focusId, width, height)}</>
})

export default List
