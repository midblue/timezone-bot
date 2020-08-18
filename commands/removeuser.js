const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')
const { getLabelFromUser } = require('../scripts/commonFunctions')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:removeuser|r) (.*)`, 'gi')
  },
  expectsUserInRegexSlot: 1,
  async action({ msg, match, typedUser }) {
    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Admin remove user ${match[1]} (${msg.author.username})`,
    )
    if (!match[1]) {
      return send(
        msg,
        `Use this command in the format ${settings.prefix}removeuser <username> to remove that user's timezone.`,
      )
    }
    if (!typedUser) {
      return send(msg, `I couldn't find a user by the name ${match[1]}.`)
    }
    db.removeUserFromGuild({
      guildId: msg.guild.id,
      userId: typedUser.id || typedUser.user.id,
    })
    return send(
      msg,
      `Removed ${await getLabelFromUser(typedUser)} from timezone tracking.`,
    )
  },
}
