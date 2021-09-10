import all from './all'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'
import { getGuildMembers } from '../scripts/commonFunctions'

export default {
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:role)( )?(.*)$`,
      `gi`,
    )
  },
  async action({ msg, match, settings }: ActionProps) {
    let roleId = match[2]
    if (roleId.indexOf(`<@&`) === 0)
      roleId = roleId.substring(3, roleId.length - 1)

    console.log(
      `${
        msg.guild?.name
          ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
          : `Private Message`
      }${
        msg.guild ? ` (${msg.guild.id})` : ``
      } - Role (${roleId})`,
    )
    const roles = [
      ...((await msg.guild?.roles.fetch()) || []).values(),
    ]
    const role = roles.find(
      (r) => r.id === roleId || r.name === roleId,
    )
    if (!role)
      return send(
        msg,
        `The 'role' command lists the time for everyone in a certain role. I couldn't find a role by the name you entered. Use \`${settings.prefix}role <@role or role name>\` to run this command.`,
        `none`,
        settings,
      )

    // this is just to prime the cache — if we don't, the cache doesn't necessarily have all users in it when we check for role members.
    await getGuildMembers({ msg })

    const members = [...(await role.members.values())]
    if (!members.length)
      return send(
        msg,
        `I couldn't find any members in that role.`,
        false,
        settings,
      )

    all.action({
      msg,
      settings,
      match,
      users: members,
      prependText: `in \`@${role.name}\``,
    })
  },
}
