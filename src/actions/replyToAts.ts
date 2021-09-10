import Discord from 'discord.js-light'
import db from '../db/firestore'
import {
  getLightEmoji,
  currentTimeAt,
  standardizeTimezoneName,
  getGuildMembers,
  getOffset,
} from '../scripts/commonFunctions'
import { send } from './replyInChannel'

const onlyRespondIfNotAnnouncedInMs = 30 * 60 * 1000
const onlyRespondIfTimezoneOffsetDifferenceIsGreaterThanOrEqualTo = 1.5

let recentlyAnnounced: string[] = []

module.exports = async (
  msg: Discord.Message,
  settings: Settings,
) => {
  if (msg.author.bot) return

  if (!msg.mentions)
    // preload full message data
    msg = await msg.fetch()

  const mentionedUserIds =
    msg.mentions.members?.map(
      (m: Discord.GuildMember) => m.id,
    ) || []
  if (mentionedUserIds.length === 0) return

  const authorId = msg.author.id

  const savedUsers =
    (await db.getGuildUsers(msg.guild?.id)) || []
  const authorTimezoneData = savedUsers[authorId]
  const matchedUsers = mentionedUserIds
    .map((id) =>
      savedUsers[id] ? { ...savedUsers[id], id } : null,
    )
    .filter((u) => u)

  const userDataWithLastMessageTime = (
    await getGuildMembers({ msg, ids: mentionedUserIds })
  ).map(
    async (
      fullMember,
    ): Promise<null | {
      [key: string]: any
      displayName: string
      isActive: boolean
    }> => {
      if (fullMember.id === msg.author.id) return null
      let isActive = false
      const found = matchedUsers.find(
        (matched) =>
          matched && matched.id === fullMember.user.id,
      )
      if (!found) return null
      // * uses online/offline status instead of lastMessage, which seems to have been deprecated
      // status will be available if presence intent is available on bot, will always be 'offline' otherwise
      else if (fullMember.presence?.status === `online`) {
        isActive = true
        // console.log('status:', fullMember.presence?.status)
      }

      return {
        ...found,
        displayName:
          fullMember.nickname || fullMember.user.username,
        isActive,
      }
    },
  )

  let usersToList = (
    await Promise.all(userDataWithLastMessageTime)
  ).filter((u) => u) as {
    [key: string]: any
    displayName: string
    isActive: boolean
  }[]

  // filter out the author themselves
  usersToList = usersToList.filter((u) => u.id !== authorId)

  // filter out anyone who has been recently announced
  usersToList = usersToList.filter(
    (u) =>
      !recentlyAnnounced.find(
        (id) => id === msg.guildId + ` ` + u.id,
      ),
  )

  // filter out anyone who is active now
  usersToList = usersToList.filter((u) => !u.isActive)

  // filter out anyone whose timezone is very close to the author
  usersToList = usersToList.filter(
    (u) =>
      !authorTimezoneData ||
      Math.abs(
        getOffset(authorTimezoneData.location) -
          getOffset(u.location),
      ) >=
        onlyRespondIfTimezoneOffsetDifferenceIsGreaterThanOrEqualTo,
  )

  if (!usersToList.length) return

  // add to recently announced list
  usersToList
    .map((u) => u.id)
    .forEach((id) => {
      const pushId = msg.guildId + ` ` + id
      recentlyAnnounced.push(pushId)
      setTimeout(
        () => {
          recentlyAnnounced = recentlyAnnounced.filter(
            (existingId) => existingId !== pushId,
          )
        },
        settings.repeatAnnounceTime
          ? settings.repeatAnnounceTime * 60 * 1000
          : onlyRespondIfNotAnnouncedInMs,
      )
    })

  let outputString = `It's `
  for (let index = 0; index < usersToList.length; index++) {
    const user = usersToList[index]
    const isLast = index === usersToList.length - 1
    const isNextToLast = index === usersToList.length - 2
    outputString += `${getLightEmoji(
      user.location,
    )}${currentTimeAt(
      user.location,
      false,
      Boolean(settings.format24),
    )} for ${user.displayName} (${standardizeTimezoneName(
      user.timezoneName,
    )})`
    if (!isLast && usersToList.length > 2)
      outputString += `, `
    if (isNextToLast) outputString += ` and `
    if (!isLast && usersToList.length > 2)
      outputString += `\n`
  }
  outputString += `.`

  console.log(
    `${
      msg.guild && msg.guild.name
        ? msg.guild.name?.substring(0, 25).padEnd(25, ` `)
        : `Private Message`
    }${msg.guild ? ` (${msg.guild.id})` : ``} - ${
      usersToList.length
    } @${usersToList.length === 1 ? `` : `s`} (${
      msg.author.username
    } > ${usersToList
      .map((u) => u.displayName)
      .join(`, `)})`,
  )

  send(msg, outputString, false, settings)
}
