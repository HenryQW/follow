import { getOS } from "@renderer/lib/utils"
import type { FC } from "react"

const SpecialKeys = {
  Windows: {
    meta: "⊞",
    ctrl: "Ctrl",
    alt: "Alt",
    shift: "Shift",
  },
  macOS: {
    meta: "⌘",
    ctrl: "⌃",
    alt: "⌥",
    shift: "⇧",
  },
  Linux: {
    meta: "Super",
    ctrl: "Ctrl",
    alt: "Alt",
    shift: "Shift",
  },
}

export const Kbd: FC<{
  children: string
}> = ({ children }) => {
  const specialKeys = SpecialKeys[getOS()]
  let key = children
  if (children.toLowerCase() in specialKeys) {
    key = specialKeys[children.toLowerCase()]
  }

  return <kbd className="kbd ml-1">{key}</kbd>
}
