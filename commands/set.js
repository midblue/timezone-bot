const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')
const {
  getUserInGuildFromId,
  getLightEmoji,
  currentTimeAt,
  getLabelFromUser,
} = require('../scripts/commonFunctions')
const allCommands = require('./index')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:set|s)(?!user) (.*)$`, 'gi')
  },
  async action({ msg, settings, match, client }) {
    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - ${msg.author.username} > set to ${match[1]}`,
    )

    if (!match[1])
      return send(
        msg,
        `Use this command in the format ${settings.prefix}set <city or country name> to set your timezone.`,
        false,
        settings,
      )

    // admin accidentally used this command to try to set someone
    const hasAt = match[1].indexOf('<@') >= 0
    const hasSpaceAfterAt = match[1].lastIndexOf(' ') > hasAt
    if (hasAt && hasSpaceAfterAt) {
      const commandRegex = new RegExp(`${settings.prefix}[^ ]* `, 'gi')
      msg.content = msg.content.replace(
        commandRegex,
        `${settings.prefix}setuser `,
      )
      return allCommands(msg, settings, client)
    } else if (hasAt)
      return send(
        msg,
        `Use this command in the format ${settings.prefix}set <city or country name> to set your timezone.`,
        false,
        settings,
      )

    const foundTimezone = await getTimezoneFromLocation(match[1])
    if (!foundTimezone)
      return send(
        msg,
        `Sorry, I couldn't find a timezone for ${match[1]}.`,
        false,
        settings,
      )
    await db.updateUserInGuild({
      guildId: msg.guild.id,
      userId: msg.author.id,
      updatedInfo: foundTimezone,
    })
    const authorInGuild = await getUserInGuildFromId(msg.guild, msg.author.id)
    send(
      msg,
      `Timezone for ${getLabelFromUser(authorInGuild)} set to ${
        foundTimezone.timezoneName
      }. (${getLightEmoji(foundTimezone.location)}${currentTimeAt(
        foundTimezone.location,
      )})`,
      false,
      settings,
    )
  },
}
