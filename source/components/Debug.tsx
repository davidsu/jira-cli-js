#!/usr/bin/env node
import React from 'react'
export default function Debug({ content, popup }: { content?: string; popup?: string }) {
  return (
    <box height="50%" width="50%" top="center" left="center">
      <box height="50%" width="50%" top="center" left="center">
        {content || popup}
      </box>
    </box>
  )
}
