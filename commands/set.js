const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')

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
        `\`Use this command in the format \`${settings.prefix}set <city or country name>\` to set your timezone.\``,
      )

    let foundTimezone
    // check for UTC command
    const UTCMatch = /^utc(\+|-)?(\d*)/gi.exec(match[1])
    if (UTCMatch)
      foundTimezone = {
        timezoneName: UTCMatch[0].toUpperCase(),
        offset: UTCMatch[2]
          ? parseInt(UTCMatch[2]) * (UTCMatch[1] === '-' ? -1 : 1)
          : 0,
        location: `Etc/${UTCMatch[0].toUpperCase().replace('UTC', 'GMT')}`,
      }
    else foundTimezone = await getTimezoneFromLocation(match[1])
    if (!foundTimezone)
      return send(msg, `\`Sorry, I couldn't find a timezone for ${match[1]}.\``)
    await db.updateUserInGuild({
      guildId: msg.guild.id,
      userId: msg.author.id,
      updatedInfo: foundTimezone,
    })
    send(
      msg,
      `\`Time zone for ${msg.author.username} set to ${foundTimezone.timezoneName}.\``,
    )
  },
}
