const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')
const {
  getUserInGuildFromId,
  getLightEmoji,
  currentTimeAt,
} = require('../scripts/commonFunctions')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:set|s) (.*)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    console.log(
      `${msg.guild.name} - ${msg.author.username} > set to ${match[1]}`,
    )

    if (!match[1])
      return send(
        msg,
        `Use this command in the format ${settings.prefix}set <city or country name> to set your timezone.`,
      )

    const foundTimezone = await getTimezoneFromLocation(match[1])
    if (!foundTimezone)
      return send(msg, `Sorry, I couldn't find a timezone for ${match[1]}.`)
    await db.updateUserInGuild({
      guildId: msg.guild.id,
      userId: msg.author.id,
      updatedInfo: foundTimezone,
    })
    // todo use nickname if it exists
    const authorInGuild = await getUserInGuildFromId(msg.guild, msg.author.id)
    send(
      msg,
      `Timezone for ${
        authorInGuild.nickname || authorInGuild.user.username
      } set to ${foundTimezone.timezoneName}. (${getLightEmoji(
        foundTimezone.location,
      )}${currentTimeAt(foundTimezone.location)})`,
    )
  },
}
