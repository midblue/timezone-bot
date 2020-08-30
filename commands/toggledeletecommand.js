const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:deletecommands?)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    const turnOff = settings.deleteCommand === true
    console.log(
      `${
        msg.guild ? msg.guild.name : 'Private Message'
      } - Toggle deletecommand > ${turnOff ? 'off' : 'on'} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings({
      guildId: msg.guild.id,
      deleteCommand: turnOff ? false : true,
    })

    send(
      msg,
      `Bot command messages will ${turnOff ? 'not ' : ''}be deleted.`,
      false,
      settings,
    )
  },
}
