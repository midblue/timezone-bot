const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')
const defaultServerSettings = require('../scripts/defaultServerSettings')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(
      `^${settings.prefix}(?:repeatannouncetime|rat)( )?(.*)?$`,
      'gi',
    )
  },
  async action({ msg, settings, match }) {
    const currentRepeatAnnounceTime =
      settings.repeatAnnounceTime || defaultServerSettings.repeatAnnounceTime
    let newTime = match[2]
    if (!newTime && newTime !== 0 && newTime !== '0') {
      return send(
        msg,
        `The current minimum time span for announcing the same user's timezone is ${currentRepeatAnnounceTime} minutes. Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change it.`,
        false,
        settings,
      )
    }

    console.log(
      `${
        msg.guild ? msg.guild.name : 'Private Message'
      } - Set repeat announce time > ${newTime} (${msg.author.username}) `,
    )

    try {
      newTime = parseInt(newTime)
    } catch (e) {
      return send(
        msg,
        `Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change the minimum time span for announcing the same user's timezone.`,
        false,
        settings,
      )
    }
    if (isNaN(newTime))
      return send(
        msg,
        `Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change the minimum time span for announcing the same user's timezone.`,
        false,
        settings,
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
