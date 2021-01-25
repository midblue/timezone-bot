const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')
const { getLabelFromUser } = require('../scripts/commonFunctions')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:removeuser|ru) (.*)`, 'gi')
  },
  expectsUserInRegexSlot: 1,
  async action({ msg, match, typedUser, settings }) {
    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Admin remove user ${match[1]} (${msg.author.username})`,
    )
    if (!match[1]) {
      return send(
        msg,
        `Use this command in the format ${settings.prefix}removeuser <username> to remove that user's timezone.`,
        false,
        settings,
      )
    }
    if (!typedUser) {
      return send(
        msg,
        `I couldn't find a user by the name ${match[1]}.`,
        false,
        settings,
      )
    }
    const success = await db.removeUserFromGuild({
      guildId: msg.guild.id,
      userId: typedUser.id || typedUser.user.id,
    })
    if (success === true)
      return send(
        msg,
        `Removed ${await getLabelFromUser(typedUser)} from timezone tracking.`,
        false,
        settings,
      )
    else if (success) return send(msg, success, false, settings)
    else return send(msg, `An unknown error occurred.`, false, settings)
  },
}
