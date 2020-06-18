const db = require('../db/firestore')
const {
  currentTimeAt,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:time(?:in|at)) (.*)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    console.log(
      `${msg.guild.name} - time in ${match[1]} (${msg.author.username})`,
    )

    if (!match[1])
      return send(
        msg,
        `Use this command in the format \`${settings.prefix}timein <city or country name>\` to see the time in a specific location.`,
        'none',
      )

    const foundTimezone = await getTimezoneFromLocation(match[1])
    if (!foundTimezone)
      return send(msg, `Sorry, I couldn't find a timezone for ${match[1]}.`)
    send(
      msg,
      `It's ${currentTimeAt(
        foundTimezone.location,
      )} in ${standardizeTimezoneName(foundTimezone.timezoneName)}.`,
    )
  },
}
