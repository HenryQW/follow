import { useGeneralSettingKey } from "@renderer/atoms/settings/general"
import {
  useRouteParamsSelector,
  useRouteParms,
} from "@renderer/hooks/biz/useRouteParams"
import { levels, views } from "@renderer/lib/constants"
import { shortcuts } from "@renderer/lib/shortcuts"
import { useEntries } from "@renderer/queries/entries"
import { entryActions, useEntryIdsByFeedIdOrView } from "@renderer/store/entry"
import { useFolderFeedsByFeedId } from "@renderer/store/subscription"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import type { ListRange } from "react-virtuoso"
import { useDebounceCallback } from "usehooks-ts"

import { batchMarkUnread } from "./helper"

export const useEntryMarkReadHandler = (entriesIds: string[]) => {
  const renderAsRead = useGeneralSettingKey("renderMarkUnread")
  const scrollMarkUnread = useGeneralSettingKey("scrollMarkUnread")
  const feedView = useRouteParamsSelector((params) => params.view)

  const handleMarkReadInRange = useDebounceCallback(
    async ({ startIndex }: ListRange) => {
      const idSlice = entriesIds?.slice(0, startIndex)

      if (!idSlice) return
      batchMarkRead(idSlice)
    },
    1000,
    { leading: false },
  )

  const handleRenderAsRead = useCallback(
    async ({ startIndex, endIndex }: ListRange, enabled?: boolean) => {
      if (!enabled) return
      const idSlice = entriesIds?.slice(startIndex, endIndex)

      if (!idSlice) return
      batchMarkRead(idSlice)
    },
    [entriesIds],
  )

  return useMemo(() => {
    if (views[feedView].wideMode && renderAsRead) {
      return handleRenderAsRead
    }

    if (scrollMarkUnread) {
      return handleMarkReadInRange
    }
    return
  }, [
    feedView,
    handleMarkReadInRange,
    handleRenderAsRead,
    renderAsRead,
    scrollMarkUnread,
  ])
}
export const useEntriesByView = () => {
  const routeParams = useRouteParms()
  const unreadOnly = useGeneralSettingKey("unreadOnly")

  const { level, feedId, view, isAllFeeds, isCollection } = routeParams

  const folderIds = useFolderFeedsByFeedId(feedId)

  const query = useEntries({
    level,
    id: level === levels.folder ? folderIds?.join(",") : feedId,
    view,
    ...(unreadOnly === true && { read: false }),
  })
  const remoteEntryIds = query.data?.pages
    ?.map((page) => page.data?.map((entry) => entry.entries.id))
    .flat() as string[]

  const currentEntries = useEntryIdsByFeedIdOrView(
    isAllFeeds ? view : feedId!,
    {
      unread: unreadOnly,
      view,
    },
  )

  // If remote data is not available, we use the local data, get the local data length
  // FIXME: remote first, then local store data
  // NOTE: We still can't use the store's data handling directly.
  // Imagine that the local data may be persistent, and then if there are incremental updates to the data on the server side,
  // then we have no way to incrementally update the data.
  // We need to add an interface to incrementally update the data based on the version hash.

  const entries = remoteEntryIds || currentEntries

  useHotkeys(
    shortcuts.entries.refetch.key,
    () => {
      query.refetch()
    },
    { scopes: ["home"] },
  )

  // in unread only entries only can grow the data, but not shrink
  // so we memo this previous data to avoid the flicker
  const prevEntries = useRef(entries)

  useEffect(() => {
    prevEntries.current = []
  }, [routeParams.feedId, routeParams.view])
  const mergedEntries = useMemo(() => {
    if (!unreadOnly) {
      prevEntries.current = []
      return entries
    }
    if (!prevEntries.current) {
      prevEntries.current = entries
      return entries
    }
    // merge the new entries with the old entries, and unique them
    const nextIds = [...new Set([...prevEntries.current, ...entries])]
    prevEntries.current = nextIds
    return nextIds
  }, [entries, prevEntries, unreadOnly])

  const sortEntries = () =>
    isCollection ?
      sortEntriesIdByStarAt(mergedEntries) :
      sortEntriesIdByEntryPublishedAt(mergedEntries)

  return {
    ...query,

    entriesIds: sortEntries(),
    totalCount: query.data?.pages?.[0]?.total ?? mergedEntries.length,
  }
}

function batchMarkRead(ids: string[]) {
  const batchLikeIds = [] as [string, string][]
  const entriesId2Map = entryActions.getFlattenMapEntries()
  for (const id of ids) {
    const entry = entriesId2Map[id]

    if (!entry) continue
    const isRead = entry.read
    if (!isRead) {
      batchLikeIds.push([entry.feedId, id])
    }
  }

  if (batchLikeIds.length > 0) {
    for (const [feedId, id] of batchLikeIds) {
      batchMarkUnread([feedId, id])
    }
  }
}

function sortEntriesIdByEntryPublishedAt(entries: string[]) {
  const entriesId2Map = entryActions.getFlattenMapEntries()
  return entries
    .slice()
    .sort((a, b) =>
      entriesId2Map[b]?.entries.publishedAt.localeCompare(
        entriesId2Map[a]?.entries.publishedAt,
      ),
    )
}

function sortEntriesIdByStarAt(entries: string[]) {
  const entriesId2Map = entryActions.getFlattenMapEntries()
  return entries.slice().sort((a, b) => {
    const aStar = entriesId2Map[a].collections?.createdAt
    const bStar = entriesId2Map[b].collections?.createdAt
    if (!aStar || !bStar) return 0
    return bStar.localeCompare(aStar)
  })
}
