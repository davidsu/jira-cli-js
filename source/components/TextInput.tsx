/* eslint-disable no-unused-expressions */
import React, { useEffect, useRef } from 'react'
import type { Widgets } from 'blessed'
import blessed, { textarea } from 'blessed'
type TextInputProps = Widgets.TextareaOptions & {
  ref?: ReturnType<typeof useRef>
  onValueChange?: (value: string) => any
  combo?: {
    [key: string]: (...args: any) => any
  }
}
const noop = () => {}
const cursorBackward = (self, offset) => offset > 0 && self.screen.program.cursorBackward()
const cursorForward = (self, offset) => offset < self.value.length && self.screen.program.cursorForward()

function _updateCursor(this: ReturnType<typeof textarea>) {
  if (this.value === '' && this.lpos) {
    const { xi: col, yi: row } = this.lpos
    this.screen.program.cursorPos(row, col)
  }
}

type TextInputType = {
  combo: Record<string, (i?: string, k?: any) => any>
  onValueChange: (...args: any) => any
} & ReturnType<typeof textarea>

function _listener(this: TextInputType, ch, key) {
  const zero = this.lpos.xi
  const row = this.lpos.yi
  const value = this.value
  const offset = this.screen.program.x - zero
  if (key.ctrl) {
    ;(this.combo[`ctrl-${key.name}`] || noop)(ch, key)
    if (key.name === 'a') {
      this.screen.program.cursorPos(row, zero)
    }
    if (key.name === 'e') {
      this.screen.program.cursorPos(row, zero + this.value.length)
    }
    if (key.name === 'u') {
      this.value = ''
      this.screen.program.cursorPos(zero, this.lpos.yi)
    }
  }
  if (key.name === 'escape') {
    ;(this.combo.escape || noop)()
    return
  }

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
    this.onValueChange(value)
    this.screen.render()
  }
}
function textInput(this: any, props: TextInputProps) {
  Object.assign(this, { _listener, _updateCursor })
  textarea.call(this, { inputOnFocus: true, input: true, ...props })
}

Object.setPrototypeOf(textInput.prototype, textarea.prototype)

//@ts-ignore
//this is needed cuz this is how blessed-react finds blessed components
blessed.textinput = (options: TextInputProps) => new textInput(options)

export default function TextInput({ combo = {}, onValueChange = noop, ref, ...props }: TextInputProps) {
  const TextInputRef: any = ref || useRef(null)
  useEffect(
    () => Object.assign(TextInputRef.current || {}, { combo, onValueChange }),
    [TextInputRef, combo, onValueChange]
  )
  useEffect(() => {
    if (TextInputRef?.current) {
      TextInputRef.current.focus()
    }
    return () => {
      TextInputRef.current.free()
    }
  }, [TextInputRef])
  //@ts-ignore
  return <textinput ref={TextInputRef} combo={combo} onValueChange={onValueChange} {...props} />
}
