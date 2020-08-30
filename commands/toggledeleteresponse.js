const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:deleteresponses?)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    const turnOff = settings.deleteResponse === true
    console.log(
      `${
        msg.guild ? msg.guild.name : 'Private Message'
      } - Toggle deleteResponse > ${turnOff ? 'off' : 'on'} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings({
      guildId: msg.guild.id,
      deleteResponse: turnOff ? false : true,
    })

    send(
      msg,
      `Bot response messages will ${
        turnOff ? 'not ' : ''
      }be deleted after 5 minutes.`,
      false,
      settings,
    )
  },
}
