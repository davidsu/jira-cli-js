import chalk from 'chalk'
import type Fuse from 'fuse.js'
import { Box, Text } from 'ink'
import React from 'react'
import useScreenSize from './useScreenSize'
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

function createRow(fuseItem: Fuse.FuseResult<string>, width: number, focusId: string) {
  let coloredItem = createMatchedTextNode(fuseItem, width)
  const props = fuseItem.item === focusId ? { backgroundColor: '#303030', color: '#FFFFFF' } : {}
  return (
    <Box key={fuseItem.item} flexGrow={4}>
      <Text {...props} wrap="truncate-end">
        {coloredItem}
      </Text>
    </Box>
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
    .map(fuseItem => createRow(fuseItem, width, focusId))

const List = React.memo(function List({ list, focusedIdx, focusId }: Props) {
  const { height, width } = useScreenSize()
  const fillHeight = Math.max(height - 3 - list.length, 0)
  return (
    <>
      {createRows(list, focusedIdx, focusId, width, height)}
      <Box height={fillHeight} />
    </>
  )
})

export default List
