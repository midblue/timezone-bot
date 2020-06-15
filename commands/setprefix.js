const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:prefix|setprefix|p) ?(.*)`, 'gi')
  },
  async action({ msg, settings, match }) {
    console.log(
      `${msg.guild ? msg.guild.name : 'Private Message'} - Prefix > ${
        match[1]
      }`,
    )
    const newPrefix = match[1]
    if (!newPrefix)
      return send(
        msg,
        `The current prefix is: \`${settings.prefix}\`
Type \`${settings.prefix}prefix <t!/t-/t~>\` to set the command prefix for this bot to one of the options listed.`,
      )

    if (!['t!', 't-', 't~'].includes(newPrefix))
      return send(msg, `The bot command prefix must be either t!, t-, or t~.`)

    await db.setGuildSettings({ guildId: msg.guild.id, prefix: newPrefix })

    send(
      msg,
      `The bot command prefix been changed from \`${settings.prefix}\` to \`${newPrefix}\``,
    )
  },
}
