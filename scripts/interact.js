const db = require('./db')
const format = require('./format')
const get = require('./get')

const MINIMUM_LAST_SEEN_TIME_SPAN = 2 * 60 * 60 * 1000 // first number is hours
const MINIMUM_TIMEZONE_DIFFERENCE = 3 // hours

module.exports = {
  help(msg) {
    msg.channel.send(`Valid commands:

\`!time <user, city, or country name>\` to see the current time for a specific user or in a specific place.
\`!timein <city or country name>\` to see the current time in a specific place.
\`!set <city or country name>\` to set your own timezone. (UTC codes work, e.g. 'UTC+3', 'UTC-8')
\`!users\` or \`!all\` to see all users' set timezones.
\`!removeme\` to delete your set timezone.
\`!help\` to show this message.`)
  },

  at(msg, atsInMessage, senderTimezoneOffset) {
    if (!senderTimezoneOffset) return
    for (let id of atsInMessage) {
      const userInfo = db.get(id)
      if (!userInfo || !userInfo.lastSeen) continue
      const msSince = Date.now() - new Date(userInfo.lastSeen).getTime()
      if (
        msSince >= MINIMUM_LAST_SEEN_TIME_SPAN &&
        Math.abs(senderTimezoneOffset - userInfo.offset) >=
          MINIMUM_TIMEZONE_DIFFERENCE
      ) {
        db.update(id)
        msg.channel.send(
          `\`It's ${format.currentTimeAt(userInfo.location)} for ${
            userInfo.username
          }. (${userInfo.timezoneName})\``,
        )
      }
    }
  },

  me(msg, senderUsername) {
    const userInfo = db.get(msg.author.id)
    if (!userInfo)
      return msg.channel.send(`No timezone has been set for ${senderUsername}.`)
    msg.channel.send(
      `\`It's ${format.currentTimeAt(userInfo.location)} for ${
        userInfo.username
      }. (${userInfo.timezoneName})\``,
    )
  },

  removeMe(msg, senderUsername) {
    db.remove(msg.author.id || msg.author.user.id)
    return msg.channel.send(
      `Removed you (${senderUsername}) from timezone tracking.`,
    )
  },

  async set(msg) {
    const regex = /!(?:set|s) (.*)/g
    const location = regex.exec(msg.content)
    if (location && location[1]) {
      let foundTimezone
      // check for UTC command
      const UTCMatch = /^utc(\+|-)?(\d*)/gi.exec(location[1])
      if (UTCMatch)
        foundTimezone = {
          timezoneName: UTCMatch[0].toUpperCase(),
          offset: UTCMatch[2]
            ? parseInt(UTCMatch[2]) * (UTCMatch[1] === '-' ? -1 : 1)
            : 0,
          location: `Etc/${UTCMatch[0].toUpperCase().replace('UTC', 'GMT')}`,
        }
      else foundTimezone = await get.timezoneFromLocation(location[1])
      if (foundTimezone) {
        db.update(msg.author.id, {
          ...foundTimezone,
          username: msg.author.username,
        })
        msg.channel.send(
          `Time zone for ${msg.author.username} set to ${foundTimezone.timezoneName}.`,
        )
      } else msg.channel.send(`Time zone lookup failed.`)
    } else
      msg.channel.send(
        `Use this command in the format \`!set <city or country name>\` to set your timezone.`,
      )
  },

  async time(msg) {
    const regex = /!(?:time|t) (.*)/g
    const searchString = regex.exec(msg.content)
    if (!searchString) {
      msg.channel.send(
        `Use this command in the format \`!time <user, city, or country name>\` to see the current time there.`,
      )
      return
    }
    const users = msg.guild
      ? msg.guild.members.map(m => ({
          username: m.nickname || m.user.username,
        }))
      : [{ username: msg.author.username }]
    let foundUsername = get.usernameInMessage(searchString[1], users)
    if (foundUsername) {
      const foundTimezone = db.getByUsername(foundUsername)
      if (!foundTimezone)
        return msg.channel.send(`No timezone listed for user ${foundUsername}.`)
      msg.channel.send(
        `\`It's ${format.currentTimeAt(foundTimezone.location)} for ${
          foundTimezone.username
        }. (${foundTimezone.timezoneName})\``,
      )
    } else {
      const foundTimezone = await get.timezoneFromLocation(searchString[1])
      if (!foundTimezone)
        return msg.channel.send(`No timezone found for ${searchString[1]}.`)
      msg.channel.send(`\`\`\`${format.timezone(foundTimezone)}\`\`\``)
    }
  },

  async timeIn(msg) {
    const regex = /!(?:timein|ti) (.*)/g
    const searchString = regex.exec(msg.content)
    if (!searchString) {
      msg.channel.send(
        `Use this command in the format \`!timein <city or country name>\` to see the current time there.`,
      )
      return
    }
    const foundTimezone = await get.timezoneFromLocation(searchString[1])
    if (!foundTimezone)
      return msg.channel.send(`No timezone found for ${searchString[1]}.`)
    msg.channel.send(`\`\`\`${format.timezone(foundTimezone)}\`\`\``)
  },

  listUsers(msg) {
    const allUsers = db.getAll()
    const timezonesWithUsers = Object.values(allUsers).reduce((acc, user) => {
      const timezoneName = user.timezoneName.replace(
        /(Standard |Daylight )/gi,
        '',
      )
      if (!acc[timezoneName]) {
        acc[timezoneName] = {
          timezoneName,
          locale: user.location,
          label: `${user.timezoneName} (UTC ${user.offset >= 0 ? '+' : ''}${
            user.offset
          })`,
          usernames: [],
          offset: user.offset,
        }
      }
      acc[timezoneName].usernames.push(user.username)
      return acc
    }, {})

    const timezonesWithUsersAsSortedArray = Object.values(
      timezonesWithUsers,
    ).sort((a, b) => b.offset - a.offset)

    const outputString = timezonesWithUsersAsSortedArray.reduce(
      (acc, timezone) => {
        const header = `${format.currentTimeAt(
          timezone.locale,
          true,
        )} - ${timezone.label.replace(/(Standard |Daylight )/gi, '')}`
        const body =
          '\n  ' +
          timezone.usernames.sort((a, b) => (b > a ? -1 : 1)).join('\n  ') +
          '\n\n'
        return acc + header + body
      },
      '',
    )

    if (!outputString)
      return msg.channel.send(
        `No users in this server have added their timezone yet. Use \`!set <city or country name>\` to set your timezone.`,
      )

    msg.channel.send(`\`\`\`${outputString}\`\`\``)
  },
}
