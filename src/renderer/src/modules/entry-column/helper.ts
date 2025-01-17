import { apiClient } from "@renderer/lib/api-fetch"
import { entryActions, getEntry } from "@renderer/store/entry"
import { create, keyResolver, windowScheduler } from "@yornaath/batshit"

type EntryId = string
type FeedId = string
const unread = create({
  fetcher: async (ids: [FeedId, EntryId][]) => {
    await apiClient.reads.$post({ json: { entryIds: ids.map((i) => i[1]) } })

    return []
  },
  resolver: keyResolver("id"),
  scheduler: windowScheduler(1000),
})

export const batchMarkUnread = (...args: Parameters<typeof unread.fetch>) => {
  const [, entryId] = args[0]
  const currentIsRead = getEntry(entryId)?.read
  if (currentIsRead) return
  entryActions.markRead(args[0][0], args[0][1], true)
  return unread.fetch.apply(null, args)
}
