import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
import * as Discord from 'discord.js-light'
const fuse = require(`fuse.js`)
const fuseOptions = {
  shouldSort: true,
  location: 0,
  threshold: 0.18, // todo make more strict?
  distance: 1000,
  maxPatternLength: 20,
  minMatchCharLength: 2,
  keys: [`searchString`],
}

export function standardizeTimezoneName(name: string) {
  return name.replace(
    /(Standard |Daylight |Summer |Winter |Spring |Fall )/gi,
    ``,
  )
}

export function getOffset(locale: any) {
  if (!locale) return 0
  let date
  try {
    if (typeof locale === `object`) date = locale
    else {
      locale = locale
        .replace(/ /g, `_`)
        .replace(/UTC/gi, `Etc/GMT`)
      date = dayjs().tz(locale)
    }
    return date.utcOffset() / 60
  } catch (e: any) {
    console.log(e.message)
    return 0
  }
}

// * looks like {query} param does some sort of fuzzy search?
export async function getUserInGuildFromText(
  msg: Discord.Message,
  searchText: string,
): Promise<Discord.GuildMember | undefined> {
  if (searchText.length < 2) return
  const usersInGuild = await getGuildMembers({ msg })
  const usersInGuildWithSearchString = usersInGuild.map(
    (user) => ({
      user,
      searchString: `${user.user.username} ${
        user.user.username
      }#${user.user.discriminator} ${
        user.nickname ? user.nickname : ``
      } <@!${user.id}> <@${user.id}>`,
    }),
  )
  const fuzzySearch = new fuse(
    usersInGuildWithSearchString,
    fuseOptions,
  )
  const fuzzySearchResult = fuzzySearch.search(searchText)
  if (fuzzySearchResult[0])
    return fuzzySearchResult[0].item
      .user as Discord.GuildMember
}

export async function getContactsOrOwnerOrModerator({
  guild,
}: {
  guild: Discord.Guild
}): Promise<Discord.GuildMember[]> {
  let usersToContact
  // check guild.owner
  usersToContact = await getUserInGuildFromId(
    guild,
    guild.ownerId,
  )
  if (usersToContact) return [usersToContact]
  // at this point, we just look for an admin of any kind
  usersToContact = (
    await getGuildMembers({ guild })
  ).filter((member) =>
    member.permissions.has(`ADMINISTRATOR`),
  )
  if (usersToContact && usersToContact.length > 0)
    return usersToContact
  return []
}

export function getLabelFromUser(
  user: Discord.GuildMember | Discord.User,
) {
  if (!user) return
  const nickname =
    `nickname` in user ? user.nickname : false
  const username =
    `username` in user ? user.username : user.user.username
  const discriminator =
    `discriminator` in user
      ? user.discriminator
      : user.user.discriminator
  return `${
    nickname ? nickname + ` (` : ``
  }${username}#${discriminator}${nickname ? `)` : ``}`
}

export function currentTimeAt(
  location: string,
  leadingZero = false,
  format24: boolean,
) {
  location = location.replace(`UTC`, `Etc/GMT`)

  const utcOffset =
    location.toLowerCase().indexOf(`gmt`) === 0 ||
    location.toLowerCase().indexOf(`etc/gmt`) === 0
      ? /.*([+-].*)/gi.exec(location)?.[1]
      : undefined
  let dayObject = dayjs()
  if (utcOffset !== undefined)
    dayObject = dayObject.utcOffset(parseFloat(utcOffset))
  else dayObject = dayObject.tz(location)
  const localeString = dayObject.format(
    format24
      ? `HH:mm on dddd, MMMM D`
      : `hh:mm A on dddd, MMMM D`,
  )

  if (leadingZero) return localeString
  const twoDigitHourRegex = /[0-9]{2}:/
  return localeString.replace(
    twoDigitHourRegex,
    (match: string) => {
      if (match && match.substring(0, 1) === `0`)
        return match.substring(1)
      return match
    },
  )
}

export function toTimeString(
  dayObject: dayjs.Dayjs,
  leadingZero: boolean,
  format24: boolean | undefined,
) {
  let formatString = `ddd `
  if (format24) formatString += `H`
  else formatString += `h`
  if (leadingZero) {
    if (format24) formatString += `H`
    else formatString += `h`
  }
  formatString += `:mm`
  if (!format24) formatString += ` A`
  return dayObject.format(formatString)
}

export function dateObjectAt(location: string) {
  const utcOffset =
    location.toLowerCase().indexOf(`utc`) === 0 ||
    location.toLowerCase().indexOf(`gmt`) === 0 ||
    location.toLowerCase().indexOf(`etc/gmt`) === 0
      ? /.*([+-].*)/gi.exec(location)?.[1]
      : undefined
  let dayObject = dayjs()
  if (utcOffset !== undefined)
    dayObject = dayObject.utcOffset(parseFloat(utcOffset))
  else dayObject = dayObject.tz(location)
  return dayObject
}

export function getLightEmoji(location: string | number) {
  let hour
  if (typeof location === `number`) hour = location
  else {
    try {
      const utcOffset =
        location.toLowerCase().indexOf(`utc`) === 0 ||
        location.toLowerCase().indexOf(`gmt`) === 0 ||
        location.toLowerCase().indexOf(`etc/gmt`) === 0
          ? /.*([+-].*)/gi.exec(location)?.[1]
          : undefined
      let dayObject = dayjs()
      if (utcOffset !== undefined)
        dayObject = dayObject.utcOffset(
          parseFloat(utcOffset),
        )
      else dayObject = dayObject.tz(location)
      hour = dayObject.hour()
    } catch (e: any) {
      console.log(
        `failed to get light emoji for`,
        location,
        e.message,
      )
      return ``
    }
  }
  if (hour <= 5) return `🌙`
  // if (hour <= 7) return '🌇'
  if (hour <= 18) return `☀️`
  // if (hour <= 19) return '🌅'
  return `🌙`
}

export async function getAuthorDisplayName(
  msg: Discord.Message,
) {
  const isGuild = msg.guild !== undefined
  return isGuild
    ? (await msg.guild?.members.fetch(msg.author.id))
        ?.nickname || msg.author.username
    : msg.author.username
}

export async function getUserInGuildFromId(
  guild?: Discord.Guild,
  id?: string,
) {
  if (!guild || !id) return
  try {
    const userInGuild = await guild.members.fetch({
      user: id,
    })
    return userInGuild
  } catch (e) {}
}

export async function getGuildMembers({
  msg,
  guild,
  ids,
}: {
  msg?: Discord.Message
  guild?: Discord.Guild
  ids?: string[]
}) {
  if (msg && msg.guild) guild = msg.guild
  if (!guild) return []
  let members: Discord.GuildMember[] = []
  if (!ids) {
    // just get everything
    try {
      members = [
        ...(
          await guild.members.fetch().catch((e) => {
            console.log(e)
            return []
          })
        ).values(),
      ]
    } catch (e) {
      members = [...(await guild.members.fetch()).values()]
      console.log(
        `failed to get ${members.length} guild members`,
      )
    }
  }
  // get specific ids
  else {
    try {
      members = [
        ...(
          await guild.members
            .fetch({ user: ids })
            .catch((e) => {
              console.log(e)
              return []
            })
        ).values(),
      ]
    } catch (e) {
      console.log(
        `failed to get ${members.length} guild members`,
      )
    }
  }

  return members
}
