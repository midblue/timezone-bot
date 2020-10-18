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
  threshold: 0.18, // was .3 for a long time
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

  // todo find a way to do this where we don't get EVERY guild member
  // * looks like {query} param does some sort of fuzzy search?
  async getUserInGuildFromText(msg, searchText) {
    if (searchText.length < 2) return
    const usersInGuild = await getGuildMembers({ msg })
    const usersInGuildWithSearchString = usersInGuild.map(user => ({
      ...user,
      searchString: `${user.user.username} ${user.user.username}#${
        user.user.discriminator
      } ${user.nickname ? user.nickname : ''} <@!${user.id}> <@${user.id}>`,
    }))
    const fuzzySearch = new fuse(usersInGuildWithSearchString, fuseOptions)
    const fuzzySearchResult = fuzzySearch.search(searchText)
    if (fuzzySearchResult[0]) return fuzzySearchResult[0]
  },

  getGuildMembers,

  getUserInGuildFromId,

  async getContactsOrOwnerOrModerator({ guild }) {
    let usersToContact
    // check guild.owner
    usersToContact = await getUserInGuildFromId(guild, guild.ownerID)
    if (usersToContact) return [usersToContact]
    // at this point, we just look for an admin of any kind
    usersToContact = (await getGuildMembers({ guild })).filter(member =>
      member.permissions.has('ADMINISTRATOR'),
    )
    if (usersToContact && usersToContact.length > 0) return usersToContact
    return []
  },

  getLabelFromUser(user) {
    if (!user) return
    return `${user.nickname ? user.nickname + ' (' : ''}${user.username ||
      user.user.username}#${user.discriminator || user.user.discriminator}${
      user.nickname ? ')' : ''
    }`
  },

  currentTimeAt(location, leadingZero = false, format24) {
    // todo does not support .5s in UTC codes
    const localeString = new Date().toLocaleTimeString(undefined, {
      timeZone: location.replace('UTC', 'Etc/GMT'),
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: !format24,
    })
    if (leadingZero) return localeString
    const twoDigitHourRegex = /[0-9]{2}:/
    return localeString.replace(twoDigitHourRegex, match => {
      if (match && match.substring(0, 1) === '0') return match.substring(1)
      return match
    })
  },

  toTimeString(date, location, leadingZero, format24) {
    let formatString = 'ddd '
    if (format24) formatString += 'H'
    else formatString += 'h'
    if (leadingZero) {
      if (format24) formatString += 'H'
      else formatString += 'h'
    }
    formatString += ':mm'
    if (!format24) formatString += ' A'
    return dayjs(date).format(formatString)
  },

  dateObjectAt(location) {
    return new Date(
      new Date().toLocaleString(undefined, {
        timeZone: location.replace(/UTC/gi, 'Etc/GMT'),
      }),
    )
  },

  getLightEmoji(location) {
    let hour
    if (typeof location === 'number') hour = location
    else {
      try {
        hour = new Date(
          new Date().toLocaleString(undefined, {
            timeZone: location.replace(/UTC/gi, 'Etc/GMT').replace(/\s*/g, ''),
          }),
        ).getHours()
      } catch (e) {
        console.log(e)
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
      ? (await msg.guild.members.fetch(msg.author.id)).nickname ||
          msg.author.username
      : msg.author.username
  },
}

async function getUserInGuildFromId(guild, id) {
  if (!guild || !id) return
  const usersInGuild = await getGuildMembers({ guild, ids: [id] })
  return usersInGuild.find(user => user.user.id == id)
}

async function getGuildMembers({ msg, guild, ids }) {
  if (msg) guild = msg.guild
  let members = []
  if (!ids) {
    // just get everything
    try {
      members = (
        await guild.members.fetch().catch(e => {
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
