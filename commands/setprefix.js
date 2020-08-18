const db = require('../db/firestore')
const { send } = require('../actions/replyInChannel')

module.exports = {
  admin: true,
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:prefix|setprefix|p)( ?)(.*)`, 'gi')
  },
  async action({ msg, settings, match }) {
    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Prefix > ${match[2]} (${msg.author.username})`,
    )
    const previousPrefix = settings.prefix
    let newPrefix = match[2]
    if (!newPrefix || !match[1])
      return send(
        msg,
        `The current prefix is: \`${settings.prefix}\`
Type \`${settings.prefix}prefix <new prefix>\` to change the command prefix for this bot.`,
        'none',
      )

    newPrefix = newPrefix.substring(0, 12)
    await db.setGuildSettings({ guildId: msg.guild.id, prefix: newPrefix })

    send(
      msg,
      `The timezone command prefix been changed from \`${previousPrefix}\` to \`${newPrefix}\``,
      'none',
    )
  },
}
