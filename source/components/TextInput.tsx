/* eslint-disable no-unused-expressions */
import type { DetailedBlessedProps, TextareaElement } from 'react-blessed'
import React, { useEffect, useRef } from 'react'
import { widget } from 'blessed'
const refFunc = (ref, func, ...args) => ref.current[func](...args)
type TextInputProps = Debug<
  DetailedBlessedProps<TextareaElement> & {
    ref?: ReturnType<typeof useRef>
    onValueChange?: (value: string) => any
    combo?: {
      [key: string]: (...args: any) => any
    }
  }
>
const noop = () => {}
const cursorBackward = (self, offset) => offset > 0 && self.screen.program.cursorBackward()
const cursorForward = (self, offset) => offset < self.value.length && self.screen.program.cursorForward()
//@ts-ignore
widget.Textarea.prototype._updateCursor = function () {
  if (this.value === '' && this.lpos) {
    const { xi: col, yi: row } = this.lpos
    this.screen.program.cursorPos(row, col)
  }
}
//@ts-ignore
widget.Textarea.prototype._listener = function (ch, key) {
  const zero = this.lpos.xi
  const value = this.value
  const offset = this.screen.program.x - zero
  if (/(enter|return)/.test(key.name)) return

  if (key.name === 'left') {
    cursorBackward(this, offset)
  } else if (key.name === 'right') {
    cursorForward(this, offset)
  } else if (key.name === 'delete') {
    this.value = value.substring(0, offset) + value.substring(offset + 1)
  } else if (key.name === 'backspace') {
    this.value = value.substring(0, offset - 1) + value.substring(offset)
    cursorBackward(this, offset)
  } else if (ch) {
    // eslint-disable-next-line no-control-regex
    if (!/^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/.test(ch)) {
      this.value = value.substring(0, offset) + ch + value.substring(offset)
      cursorForward(this, offset)
    }
  }

  if (this.value !== value) {
    this.screen.render()
  }
}
const navigation = ref => ({
  'ctrl-a': () => {
    const { xi: col, yi: row } = ref.current.lpos
    ref.current.screen.program.cursorPos(row, col)
  },
  'ctrl-e': () => {
    const { xi: col, yi: row } = ref.current.lpos
    ref.current.screen.program.cursorPos(row, col + ref.current.value.length)
  },
  'ctrl-u': () => {
    const { xi: col, yi: row } = ref.current.lpos
    ref.current.screen.program.cursorPos(row, col)
    ref.current.value = ''
  },
})

function handleKey({ combo = {}, onValueChange = noop, ref }: TextInputProps) {
  if (!ref?.current) return
  global.ref = ref
  Object.assign(combo, navigation(ref))
  function onKeyPress(input, key) {
    if (key.ctrl) {
      ;(combo[`ctrl-${key.name}`] || noop)(input, key)
    }
    if (key.name === 'escape') {
      ;(combo.escape || noop)()
    }
    setTimeout(() => {
      onValueChange(refFunc(ref, 'getValue'))
    }, 0)
  }

  if (ref?.current) {
    refFunc(ref, 'focus')
    refFunc(ref, 'on', 'keypress', onKeyPress)
  }
  return () => refFunc(ref, 'off', 'keypress', onKeyPress)
}
const TextInput = ({ combo = {}, onValueChange = noop, ref, ...props }: TextInputProps) => {
  const TextInputRef = ref || useRef(null)
  useEffect(() => handleKey({ combo, onValueChange, ref: TextInputRef }), [TextInputRef, combo, onValueChange])

  return <textarea inputOnFocus={true} input={true} ref={TextInputRef} {...props} />
}

export default TextInput
