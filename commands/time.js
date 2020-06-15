const db = require('../db/firestore')
const { currentTimeAt } = require('../commonFunctions')
const { send } = require('../actions/replyInChannel')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')

module.exports = {
  expectsUserInRegexSlot: 1,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:time|t) (.*)$`, 'gi')
  },
  async action({ msg, settings, match, typedUser }) {
    console.log(`${msg.guild.name} - time for ${match[1]}`)

    if (!match[1])
      return send(
        msg,
        `Use this command in the format \`${settings.prefix}timein <city or country name>\` to see the time in a specific location.`,
      )

    // if they typed a username
    if (typedUser) {
      const username = typedUser.nickname || typedUser.user.username
      const foundUser = await db.getUserInGuildFromId({
        guildId: msg.guild.id,
        userId: typedUser.user.id,
      })
      if (!foundUser)
        return send(
          msg,
          `\`It doesn't look like ${username} has set a timezone for themselves yet.\``,
        )
      else
        return send(
          msg,
          `\`It's ${currentTimeAt(foundUser.location)} for ${username}. (${
            foundUser.timezoneName
          })\``,
        )
    }

    // otherwise, default back to assuming it's a location
    const foundTimezone = await getTimezoneFromLocation(match[1])
    if (!foundTimezone)
      return send(msg, `\`Sorry, I couldn't find a timezone for ${match[1]}.\``)
    console.log(foundTimezone)
    send(
      msg,
      `\`It's ${currentTimeAt(foundTimezone.location)} in ${
        foundTimezone.timezoneName
      }.\``,
    )
  },
}
