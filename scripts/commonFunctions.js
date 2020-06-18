const fuse = require('fuse.js')
const fuseOptions = {
  shouldSort: true,
  location: 0,
  threshold: 0.3,
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

  async getUserInGuildFromText(msg, searchText) {
    if (searchText.length < 2) return
    // todo check for @names too
    const usersInGuild = (await msg.guild.members.fetch()).array()
    const usersInGuildWithSearchString = usersInGuild.map(user => ({
      ...user,
      searchString: `${user.user.username} ${user.user.username}#${
        user.user.discriminator
      } ${user.nickname ? user.nickname : ''} <@!${user.id}> <@${user.id}>`,
    }))
    const fuzzySearch = new fuse(usersInGuildWithSearchString, fuseOptions)
    const fuzzySearchResult = fuzzySearch.search(searchText)
    if (fuzzySearchResult[0]) return fuzzySearchResult[0]

    // const foundUser = usersInGuildWithSearchString.find(
    //   userName => userName.searchString.indexOf(searchText.toLowerCase()) >= 0,
    // )
    // return foundUser
  },

  async getUsersInGuild(guild) {
    return (await guild.members.fetch()).array()
  },

  getUserInGuildFromId,

  getContactsOrOwnerOrModerator({ guild, contact }) {
    // backwards compatible with old single contact method
    if (contact && !Array.isArray(contact)) contact = [contact]
    // default to contact list
    let thePeople = contact
      ? contact
          .map(singleContact => getUserInGuildFromId(guild, singleContact))
          .filter(c => c)
      : false
    if (thePeople && thePeople.length > 0) return thePeople
    // check guild.owner
    thePeople = getUserInGuildFromId(guild, guild.ownerID)
    if (thePeople) return [thePeople]
    // at this point, we just look for an admin of any kind
    thePeople = guild.members
      .array()
      .filter(member => member.permissions.has('ADMINISTRATOR'))
    if (thePeople && thePeople.length > 0) return thePeople
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

  currentTimeAt(location, leadingZero = false) {
    const localeString = new Date().toLocaleTimeString(undefined, {
      timeZone: location.replace('UTC', 'Etc/GMT'),
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    if (!leadingZero) return localeString
    const singleDigitHourRegex = / ([0-9]{1}):[0-9]+/
    return localeString.replace(singleDigitHourRegex, match => {
      if (match) return ' 0' + match.trim()
    })
  },
  getLightEmoji(location) {
    const hour = new Date(
      new Date().toLocaleString(undefined, {
        timeZone: location.replace('UTC', 'Etc/GMT'),
      }),
    ).getHours()
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
  const usersInGuild = (await guild.members.fetch()).array()
  return usersInGuild.find(user => user.user.id == id)
}
