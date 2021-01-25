const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')
const defaultServerSettings = require('../scripts/defaultServerSettings')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(
      `^${settings.prefix}(?:repeatannouncetime|rat)[^\d]*(\d+)?`,
      'gi',
    )
  },
  async action({ msg, settings, match }) {
    const currentRepeatAnnounceTime =
      settings.repeatAnnounceTime || defaultServerSettings.repeatAnnounceTime
    let newTime = match[1]
    if (!newTime) {
      return send(
        msg,
        `The current minimum time span for announcing the same user's timezone is ${currentRepeatAnnounceTime} minutes. Use \`${settings.prefix}replytime <# of minutes>\` to change it.`,
        false,
        settings,
      )
    }

    newTime = parseInt(newTime)
    console.log(
      `${
        msg.guild ? msg.guild.name : 'Private Message'
      } - Set repeat announce time > ${newTime} (${msg.author.username}) `,
    )

    await db.setGuildSettings({
      guildId: msg.guild.id,
      repeatAnnounceTime: newTime,
    })

    send(
      msg,
      `The minimum time span for announcing the same user's timezone has been set to ${newTime} minutes.`,
      false,
      settings,
    )
  },
}
