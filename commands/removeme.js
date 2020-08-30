const db = require('../db/firestore')
const { getAuthorDisplayName } = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')

module.exports = {
  ignoreAdminOnly: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:removeme|r)$`, 'gi')
  },
  async action({ msg, settings }) {
    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Remove ${msg.author.username}`,
    )
    db.removeUserFromGuild({
      guildId: msg.guild.id,
      userId: msg.author.id || msg.author.user.id,
    })
    return send(
      msg,
      `Removed you (${await getAuthorDisplayName(
        msg,
      )}) from timezone tracking.`,
      false,
      settings,
    )
  },
}
