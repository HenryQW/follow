/* eslint-disable @eslint-react/no-children-to-array */
/* eslint-disable @eslint-react/no-children-map */

import type { FC, PropsWithChildren, ReactNode } from "react"
import { cloneElement } from "react"
import * as React from "react"

import { SettingDescription, SettingSwitch } from "./control"

export const SettingSectionTitle: FC<{
  title: string
}> = ({ title }) => (
  <div className="mb-4 mt-8 text-sm font-medium capitalize text-gray-400 first:mt-0 dark:text-neutral-500">
    {title}
  </div>
)

export const SettingItemGroup: FC<PropsWithChildren> = ({ children }) => {
  const childrenArray = React.Children.toArray(children)
  return React.Children.map(children, (child, index) => {
    if (typeof child !== "object") return child

    if (child === null) return child

    const compType = (child as React.ReactElement).type
    if (compType === SettingDescription) {
      const prevIndex = index - 1
      const prevChild = childrenArray[prevIndex]
      const prevType = getChildType(prevChild)

      switch (prevType) {
        case SettingSwitch: {
          // eslint-disable-next-line @eslint-react/no-clone-element
          return cloneElement(child as React.ReactElement, {
            className: "!-mt-2",
          })
        }
        default: {
          return child
        }
      }
    }

    return child
  })
}

const getChildType = (child: ReactNode) => {
  if (typeof child !== "object") return null

  if (child === null) return null

  return (child as React.ReactElement).type
}
