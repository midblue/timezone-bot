import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'
import {
  getLabelFromUser,
  getLightEmoji,
  currentTimeAt,
} from '../scripts/commonFunctions'
import getTimezoneFromLocation from '../actions/getTimezoneFromLocation'

export default {
  admin: true,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:setuser|su) ([^\s]*) (.*)`, // eslint-disable-line
      `gi`,
    )
  },
  expectsUserInRegexSlot: 1,
  async action({
    msg,
    match,
    settings,
    typedUser,
  }: ActionProps) {
    console.log(
      `${
        msg.guild?.name
          ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
          : `Private Message`
      }${
        msg.guild ? ` (${msg.guild.id})` : ``
      } - Admin set user ${
        typedUser ? getLabelFromUser(typedUser) : match[1]
      } > ${match[2]} (${msg.author.username})`,
    )
    if (!match[1] || !match[2]) {
      return send(
        msg,
        `Use this command in the format ${settings.prefix}setuser <@user> <location name> to set that user's timezone.`,
        false,
        settings,
      )
    }
    if (!typedUser) {
      return send(
        msg,
        `I couldn't find a user by the name ${match[1]}.`,
        false,
        settings,
      )
    }

    const foundTimezone = await getTimezoneFromLocation(
      match[2],
    )
    if (!foundTimezone)
      return send(
        msg,
        `Sorry, I couldn't find a timezone for ${match[2]}.`,
        false,
        settings,
      )

    await db.updateUserInGuild({
      guildId: msg.guild?.id,
      guildName: msg.guild?.name,
      userId: typedUser.id || typedUser.user.id,
      updatedInfo: foundTimezone,
    })

    send(
      msg,
      `Timezone for ${getLabelFromUser(typedUser)} set to ${
        foundTimezone.timezoneName
      } by admin. (${getLightEmoji(
        foundTimezone.location,
      )}${currentTimeAt(
        foundTimezone.location,
        false,
        Boolean(settings.format24),
      )})`,
      false,
      settings,
    )
  },
}
