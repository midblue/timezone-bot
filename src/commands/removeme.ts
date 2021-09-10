import db from '../db/firestore'
import { getAuthorDisplayName } from '../scripts/commonFunctions'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  ignoreAdminOnly: true,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:removeme|rm)$`,
      `gi`,
    )
  },
  async action({ msg, settings }: ActionProps) {
    console.log(
      `${
        msg.guild
          ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
          : `Private Message`
      }${msg.guild ? ` (${msg.guild.id})` : ``} - Remove ${
        msg.author.username
      }`,
    )
    db.removeUserFromGuild({
      guildId: msg.guild?.id,
      userId: msg.author.id,
    })
    return send(
      msg,
      `Removed you (${await getAuthorDisplayName(
        msg,
      )}) from timezone tracking.`,
      false,
      settings,
    )
  },
}
