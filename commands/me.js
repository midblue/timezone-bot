const db = require('../db/firestore')
const {
  getLightEmoji,
  standardizeTimezoneName,
  currentTimeAt,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')

module.exports = {
  ignoreAdminOnly: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:me|m)$`, 'gi')
  },
  async action({ msg, settings, senderIsAdmin }) {
    console.log(
      `${
        msg.guild
          ? msg.guild.name.substring(0, 25).padEnd(25, ' ')
          : 'Private Message'
      }${msg.guild ? ` (${msg.guild.id})` : ''} - Me (${msg.author.username})`,
    )
    const foundUser = await db.getUserInGuildFromId({
      guildId: msg.guild.id,
      userId: msg.author.id,
    })
    if (!foundUser) {
      if (settings.adminOnly && !senderIsAdmin)
        return send(msg, `There's no timezone set for you.`, false, settings)
      else
        return send(
          msg,
          `You haven't set a timezone for yourself yet! Use "${settings.prefix}set <location name>" to set your timezone.`,
          false,
          settings,
        )
    } else
      return send(
        msg,
        `Your timezone is set to ${standardizeTimezoneName(
          foundUser.timezoneName,
        )}. (${getLightEmoji(foundUser.location)}${currentTimeAt(
          foundUser.location,
          false,
          settings.format24,
        )})`,
        false,
        settings,
      )
  },
}
