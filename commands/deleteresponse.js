const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:deleteresponses?) ?(.*)?$`, 'gi')
  },
  async action({ msg, settings, match }) {
    let seconds = 5 * 60,
      turnOff = false
    if (match[1]) {
      try {
        seconds = parseInt(match[1])
        if (seconds === 0) seconds = 1
      } catch (e) {
        return send(
          msg,
          `Use this command in the format \`${settings.prefix}deleteresponse <number of seconds (optional)>\` to auto-delete responses. Repeat the command with no number to turn deletion off.`,
          'none',
          settings,
        )
      }
    } else {
      turnOff = settings.deleteResponse !== false
    }

    console.log(
      `${
        msg.guild ? msg.guild.name : 'Private Message'
      } - Set deleteResponse > ${turnOff ? 'off' : seconds} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings({
      guildId: msg.guild.id,
      deleteResponse: turnOff ? false : seconds,
    })

    send(
      msg,
      `Bot response messages will ${
        turnOff ? 'not be deleted.' : `be deleted after ${seconds} seconds.`
      }`,
      false,
      settings,
    )
  },
}
