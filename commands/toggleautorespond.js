const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(
      `^${settings.prefix}(?:auto[-]?re(spon(d|se|ses)|ply))$`,
      'gi',
    )
  },
  async action({ msg, settings, match }) {
    const turnOff = settings.autoRespond === true
    console.log(
      `${
        msg.guild ? msg.guild.name : 'Private Message'
      } - Toggle autorespond > ${turnOff ? 'off' : 'on'} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings({
      guildId: msg.guild.id,
      autoRespond: turnOff ? false : true,
    })

    send(
      msg,
      `Auto-responding to @s has been turned ${turnOff ? 'off' : 'on'}.`,
    )
  },
}
