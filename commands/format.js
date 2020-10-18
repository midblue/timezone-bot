const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:format)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    const turnOff = settings.format24 === true
    console.log(
      `${msg.guild ? msg.guild.name : 'Private Message'} - Toggle format > ${
        turnOff ? '12-hour' : '24-hour'
      } (${msg.author.username}) `,
    )

    await db.setGuildSettings({
      guildId: msg.guild.id,
      format24: turnOff ? false : true,
    })

    send(
      msg,
      `Times will now be shown in ${
        turnOff ? '12-hour AM/PM format' : '24-hour format'
      }.`,
      false,
      settings,
    )
  },
}
