const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')
const {
  getLabelFromUser,
  getLightEmoji,
  currentTimeAt,
} = require('../scripts/commonFunctions')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:setuser|su) ([^\s]*) (.*)`, 'gi')
  },
  expectsUserInRegexSlot: 1,
  async action({ msg, match, typedUser }) {
    console.log(
      `${msg.guild ? msg.guild.name : 'Private Message'} - Admin set user ${
        match[1]
      } > ${match[2]} (${msg.author.username})`,
    )
    if (!match[1] || !match[2]) {
      return send(
        msg,
        `Use this command in the format ${settings.prefix}setuser <@user> <location name> to set that user's timezone.`,
      )
    }
    if (!typedUser) {
      return send(msg, `I couldn't find a user by the name ${match[1]}.`)
    }

    const foundTimezone = await getTimezoneFromLocation(match[2])
    if (!foundTimezone)
      return send(msg, `Sorry, I couldn't find a timezone for ${match[2]}.`)

    await db.updateUserInGuild({
      guildId: msg.guild.id,
      userId: typedUser.id || typedUser.user.id,
      updatedInfo: foundTimezone,
    })

    send(
      msg,
      `Timezone for ${getLabelFromUser(typedUser)} set to ${
        foundTimezone.timezoneName
      } by admin. (${getLightEmoji(foundTimezone.location)}${currentTimeAt(
        foundTimezone.location,
      )}) `,
    )
  },
}
