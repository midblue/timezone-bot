const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:verboseall)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    const turnOff = settings.verboseAll === true
    console.log(
      `${
        msg.guild ? msg.guild.name : 'Private Message'
      } - Toggle verbose all > ${turnOff ? 'off' : 'on'} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings({
      guildId: msg.guild.id,
      verboseAll: turnOff ? false : true,
    })

    send(
      msg,
      `Verbose listings in \'${settings.prefix}all\' and \'${
        settings.prefix
      }here\' have been ${turnOff ? 'turned off' : 'turned on'}.`,
      false,
      settings,
    )
  },
}
