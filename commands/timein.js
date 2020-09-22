const db = require('../db/firestore')
const {
  currentTimeAt,
  getLightEmoji,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:timein|ti(?!m))( ?)(.*)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Time for ${match[2]} (${msg.author.username})`,
    )

    if (!match[1] || !match[2])
      return send(
        msg,
        `Use this command in the format \`${settings.prefix}timein <city or country name>\` to see the time in a specific location.`,
        'none',
        settings,
      )

    // assuming it's a location
    const foundTimezone = await getTimezoneFromLocation(match[2])
    if (!foundTimezone)
      return send(
        msg,
        `Sorry, I couldn't find a timezone for ${match[2]}.`,
        false,
        settings,
      )

    send(
      msg,
      `It's ${getLightEmoji(foundTimezone.location)}${currentTimeAt(
        foundTimezone.location,
      )} in ${match[2]}. (${standardizeTimezoneName(
        foundTimezone.timezoneName,
      )})`,
      false,
      settings,
    )
  },
}
