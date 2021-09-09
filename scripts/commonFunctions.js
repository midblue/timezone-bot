const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
const fuse = require('fuse.js')
const fuseOptions = {
  shouldSort: true,
  location: 0,
  threshold: 0.18, // todo make more strict?
  distance: 1000,
  maxPatternLength: 20,
  minMatchCharLength: 2,
  keys: ['searchString'],
}

module.exports = {
  standardizeTimezoneName(name) {
    return name.replace(
      /(Standard |Daylight |Summer |Winter |Spring |Fall )/gi,
      '',
    )
  },

  getOffset(locale) {
    if (!locale) return 0
    let date
    try {
      if (typeof locale === 'object') date = locale
      else {
        locale = locale
          .replace(/ /g, '_')
          .replace(/UTC/gi, 'Etc/GMT')
        date = dayjs().tz(locale)
      }
      return date.utcOffset() / 60
    } catch (e) {
      console.log(e.message)
      return 0
    }
  },

  // * looks like {query} param does some sort of fuzzy search?
  async getUserInGuildFromText(msg, searchText) {
    if (searchText.length < 2) return
    const usersInGuild = await getGuildMembers({ msg })
    const usersInGuildWithSearchString = usersInGuild.map(
      (user) => ({
        ...user,
        searchString: `${user.user.username} ${
          user.user.username
        }#${user.user.discriminator} ${
          user.nickname ? user.nickname : ''
        } <@!${user.id}> <@${user.id}>`,
      }),
    )
    const fuzzySearch = new fuse(
      usersInGuildWithSearchString,
      fuseOptions,
    )
    const fuzzySearchResult = fuzzySearch.search(searchText)
    if (fuzzySearchResult[0]) return fuzzySearchResult[0]
  },

  getGuildMembers,

  getUserInGuildFromId,

  async getContactsOrOwnerOrModerator({ guild }) {
    let usersToContact
    // check guild.owner
    usersToContact = await getUserInGuildFromId(
      guild,
      guild.ownerID,
    )
    if (usersToContact) return [usersToContact]
    // at this point, we just look for an admin of any kind
    usersToContact = (
      await getGuildMembers({ guild })
    ).filter((member) =>
      member.permissions.has('ADMINISTRATOR'),
    )
    if (usersToContact && usersToContact.length > 0)
      return usersToContact
    return []
  },

  getLabelFromUser(user) {
    if (!user) return
    return `${user.nickname ? user.nickname + ' (' : ''}${
      user.username || user.user.username
    }#${user.discriminator || user.user.discriminator}${
      user.nickname ? ')' : ''
    }`
  },

  currentTimeAt(location, leadingZero = false, format24) {
    location = location.replace('UTC', 'Etc/GMT')

    const utcOffset =
      location.toLowerCase().indexOf('gmt') === 0 ||
      location.toLowerCase().indexOf('etc/gmt') === 0
        ? /.*([+-].*)/gi.exec(location)?.[1]
        : undefined
    let dayObject = dayjs()
    if (utcOffset !== undefined)
      dayObject = dayObject.utcOffset(utcOffset)
    else dayObject = dayObject.tz(location)
    const localeString = dayObject.format(
      format24
        ? 'HH:mm on dddd, MMMM D'
        : 'hh:mm A on dddd, MMMM D',
    )

    if (leadingZero) return localeString
    const twoDigitHourRegex = /[0-9]{2}:/
    return localeString.replace(
      twoDigitHourRegex,
      (match) => {
        if (match && match.substring(0, 1) === '0')
          return match.substring(1)
        return match
      },
    )
  },

  toTimeString(dayObject, leadingZero, format24) {
    let formatString = 'ddd '
    if (format24) formatString += 'H'
    else formatString += 'h'
    if (leadingZero) {
      if (format24) formatString += 'H'
      else formatString += 'h'
    }
    formatString += ':mm'
    if (!format24) formatString += ' A'
    return dayObject.format(formatString)
  },

  dateObjectAt(location) {
    const utcOffset =
      location.toLowerCase().indexOf('utc') === 0 ||
      location.toLowerCase().indexOf('gmt') === 0 ||
      location.toLowerCase().indexOf('etc/gmt') === 0
        ? /.*([+-].*)/gi.exec(location)?.[1]
        : undefined
    let dayObject = dayjs()
    if (utcOffset !== undefined)
      dayObject = dayObject.utcOffset(utcOffset)
    else dayObject = dayObject.tz(location)
    return dayObject
  },

  getLightEmoji(location) {
    let hour
    if (typeof location === 'number') hour = location
    else {
      try {
        const utcOffset =
          location.toLowerCase().indexOf('utc') === 0 ||
          location.toLowerCase().indexOf('gmt') === 0 ||
          location.toLowerCase().indexOf('etc/gmt') === 0
            ? /.*([+-].*)/gi.exec(location)?.[1]
            : undefined
        let dayObject = dayjs()
        if (utcOffset !== undefined)
          dayObject = dayObject.utcOffset(utcOffset)
        else dayObject = dayObject.tz(location)
        hour = dayObject.hour()
      } catch (e) {
        console.log(
          'failed to get light emoji for',
          location,
          e.message,
        )
        return ''
      }
    }
    if (hour <= 5) return '🌙'
    // if (hour <= 7) return '🌇'
    if (hour <= 18) return '☀️'
    // if (hour <= 19) return '🌅'
    return '🌙'
  },

  async getAuthorDisplayName(msg) {
    const isGuild = msg.guild !== undefined
    return isGuild
      ? (await msg.guild.members.fetch(msg.author.id))
          .nickname || msg.author.username
      : msg.author.username
  },
}

async function getUserInGuildFromId(guild, id) {
  if (!guild || !id) return
  try {
    const userInGuild = await guild.members.fetch({
      user: id,
    })
    return userInGuild
  } catch (e) {
    return false
  }
}

async function getGuildMembers({ msg, guild, ids }) {
  if (msg) guild = msg.guild
  let members = []
  if (!ids) {
    // just get everything
    try {
      members = (
        await guild.members.fetch().catch((e) => {
          console.log(e)
          return
        })
      ).array()
    } catch (e) {
      members = guild.members.cache.array()
      console.log(
        `failed to get ${members.length} guild members, falling back to cache`,
      )
    }
  }
  // get specific ids
  else members = await guild.members.fetch({ user: ids })

  return members
}
