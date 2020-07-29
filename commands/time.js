const db = require('../db/firestore')
const {
  currentTimeAt,
  getLightEmoji,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')
const all = require('./all')

module.exports = {
  expectsUserInRegexSlot: 2,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:time|t)( ?)(.*)$`, 'gi')
  },
  async action({ msg, settings, match, typedUser }) {
    console.log(
      `${msg.guild.name} - Time for ${match[2]} (${msg.author.username})`,
    )

    if (!match[1] || !match[2])
      return send(
        msg,
        `Use this command in the format \`${settings.prefix}time <user, city, or country name>\` to see the time in a specific location or for a specific user.`,
        'none',
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
          `It doesn't look like ${username} has set a timezone for themselves yet.`,
        )
      else
        return send(
          msg,
          `It's ${getLightEmoji(foundUser.location)}${currentTimeAt(
            foundUser.location,
          )} for ${username}. (${standardizeTimezoneName(
            foundUser.timezoneName,
          )})`,
        )
    }

    // some people type "all" here expecting time for all users. let's oblige them.
    if (
      match[2].toLowerCase() === 'all' ||
      match[2].toLowerCase() === 'users' ||
      match[2].toLowerCase() === 'allusers'
    )
      return all.action({ msg, settings, match, typedUser })

    // otherwise, default back to assuming it's a location
    const foundTimezone = await getTimezoneFromLocation(match[2])
    if (!foundTimezone)
      return send(msg, `Sorry, I couldn't find a timezone for ${match[2]}.`)

    send(
      msg,
      `It's ${getLightEmoji(foundTimezone.location)}${currentTimeAt(
        foundTimezone.location,
      )} in ${match[2]}. (${standardizeTimezoneName(
        foundTimezone.timezoneName,
      )})`,
    )
  },
}
