const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:support)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    console.log(
      `${msg.guild ? msg.guild.name : 'Private Message'} - Support (${
        msg.author.username
      }) `,
    )

    send(
      msg,
      `Join the TimezoneBot Support server here: <https://discord.gg/9MKpMCV>`,
      'none',
      settings,
    )
  },
}
