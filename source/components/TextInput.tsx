import type { DetailedBlessedProps, TextareaElement } from 'react-blessed'
import React, { useEffect, useRef } from 'react'
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
function handleKey({ combo = {}, onValueChange = noop, ref }: TextInputProps) {
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
