#!/usr/bin/env node
import React from 'react'
import Fzf from './Fzf'
export default function Debug() {
  const list = [{ display: 'firs bob aasdf' }, { display: 'secong' }]
  return (
    <Fzf isFocused={true} top="center" left="center" list={list} header="some random header" height="50%" width="50%" />
  )
}
