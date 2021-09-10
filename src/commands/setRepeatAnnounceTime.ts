import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'
import defaultServerSettings from '../scripts/defaultServerSettings'

export default {
  admin: true,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:repeatannouncetime|rat)( )?(.*)?$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    const currentRepeatAnnounceTime =
      settings.repeatAnnounceTime ||
      defaultServerSettings.repeatAnnounceTime
    let newTime: number
    try {
      newTime = parseInt(match[2] || `0`)
    } catch (e) {
      newTime = 0
      return send(
        msg,
        `Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change the minimum time span for announcing the same user's timezone.`,
        false,
        settings,
      )
    }
    if (isNaN(newTime) || !newTime || newTime === 0) {
      return send(
        msg,
        `The current minimum time span for announcing the same user's timezone is ${currentRepeatAnnounceTime} minutes. Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change it.`,
        false,
        settings,
      )
    }

    console.log(
      `${msg.guild ? msg.guild.name : `Private Message`}${
        msg.guild ? ` (${msg.guild.id})` : ``
      } - Set repeat announce time > ${newTime} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings(
      {
        repeatAnnounceTime: newTime,
      },
      msg.guild?.id,
    )

    send(
      msg,
      `The minimum time span for announcing the same user's timezone has been set to ${newTime} minutes.`,
      false,
      settings,
    )
  },
}
