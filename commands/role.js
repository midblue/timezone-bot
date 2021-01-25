const all = require('./all')
const { send } = require('../actions/replyInChannel')
const { getGuildMembers } = require('../scripts/commonFunctions')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:role|r) (.*)$`, 'gi')
  },
  async action({ msg, match, settings }) {
    const roleId = match[1].substring(3, match[1].length - 1)

    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Role (${roleId})`,
    )
    const role = await (await msg.guild.roles).fetch(roleId)
    console.log(roleId, role)
    if (!role)
      return send(
        msg,
        `The 'role' command lists the time for everyone in a certain role. I couldn't find a role by the name you entered.`,
        false,
        settings,
      )

    // this is just to prime the cache — if we don't, the cache doesn't necessarily have all users in it when we check for role members.
    await getGuildMembers({ msg })

    const members = await role.members.array()
    if (!members.length)
      return send(
        msg,
        `I couldn't find any members in that role.`,
        false,
        settings,
      )

    send(
      msg,
      `Users with saved timezones in \`@${role.name}\`:`,
      'none',
      settings,
    )

    all.action({ msg, settings, match, users: members })
  },
}
