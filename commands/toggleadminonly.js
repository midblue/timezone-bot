const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:admins?only)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    const turnOff = settings.adminOnly === true
    console.log(
      `${
        msg.guild ? msg.guild.name : 'Private Message'
      } - Toggle admin mode > ${turnOff ? 'off' : 'on'} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings({
      guildId: msg.guild.id,
      adminOnly: turnOff ? false : true,
    })

    send(
      msg,
      `Commands ${
        turnOff
          ? 'may now be used by all users'
          : 'may now only be used by admins'
      }.`,
    )
  },
}
