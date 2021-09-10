import db from '../db/firestore'
import {
  getLightEmoji,
  standardizeTimezoneName,
  currentTimeAt,
} from '../scripts/commonFunctions'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  ignoreAdminOnly: true,
  regex(settings: Settings) {
    return new RegExp(`^${settings.prefix}(?:me|m)$`, `gi`)
  },
  async action({
    msg,
    settings,
    senderIsAdmin,
  }: ActionProps) {
    console.log(
      `${
        msg.guild?.name
          ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
          : `Private Message`
      }${msg.guild ? ` (${msg.guild.id})` : ``} - Me (${
        msg.author.username
      })`,
    )
    const foundUser = await db.getUserInGuildFromId({
      guildId: msg.guild?.id,
      userId: msg.author.id,
    })
    if (!foundUser) {
      if (settings.adminOnly && !senderIsAdmin)
        return send(
          msg,
          `There's no timezone set for you.`,
          false,
          settings,
        )
      return send(
        msg,
        `You haven't set a timezone for yourself yet! Use "${settings.prefix}set <location name>" to set your timezone.`,
        false,
        settings,
      )
    }
    return send(
      msg,
      `Your timezone is set to ${standardizeTimezoneName(
        foundUser.timezoneName,
      )}. (${getLightEmoji(
        foundUser.location,
      )}${currentTimeAt(
        foundUser.location,
        false,
        Boolean(settings.format24),
      )})`,
      false,
      settings,
    )
  },
}
