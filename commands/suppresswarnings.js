const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:suppresswarnings)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    const turnOff = settings.suppressWarnings === true
    console.log(
      `${
        msg.guild ? msg.guild.name : 'Private Message'
      } - Toggle suppress warnings > ${turnOff ? 'off' : 'on'} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings({
      guildId: msg.guild.id,
      suppressWarnings: turnOff ? false : true,
    })

    send(
      msg,
      `Admin warnings have been ${turnOff ? 'turned on' : 'suppressed'}.`,
      false,
      settings,
    )
  },
}
