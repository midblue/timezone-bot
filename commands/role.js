const all = require('./all')
const { send } = require('../actions/replyInChannel')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:role) (.*)$`, 'gi')
  },
  async action({ msg, match, settings }) {
    const roleId = match[1].substring(3, match[1].length - 1)

    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Role (${roleId})`,
    )
    const role = await (await msg.guild.roles).fetch(roleId)
    const members = await role.members.array()
    console.log(members.length)

    send(
      msg,
      `Users with saved timezones in \`@${role.name}\`:`,
      'none',
      settings,
    )

    all.action({ msg, settings, match, users: members })
  },
}
