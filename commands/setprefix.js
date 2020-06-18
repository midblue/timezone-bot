const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:prefix|setprefix|p) ?(.*)`, 'gi')
  },
  async action({ msg, settings, match }) {
    // todo across the board, make blank commands that expect an operand respond explaining how to use it
    console.log(
      `${msg.guild ? msg.guild.name : 'Private Message'} - Prefix > ${
        match[1]
      } (${msg.author.username})`,
    )
    const newPrefix = match[1]
    if (!newPrefix)
      return send(
        msg,
        `The current prefix is: \`${settings.prefix}\`
Type \`${settings.prefix}prefix <t!/t-/t~>\` to set the command prefix for this bot to one of the options listed.`,
        'none',
      )

    if (!['t!', 't-', 't~'].includes(newPrefix))
      return send(msg, `The command prefix must be either t!, t-, or t~.`)

    await db.setGuildSettings({ guildId: msg.guild.id, prefix: newPrefix })

    send(
      msg,
      `The timezone command prefix been changed from \`${settings.prefix}\` to \`${newPrefix}\``,
      'none',
    )
  },
}
