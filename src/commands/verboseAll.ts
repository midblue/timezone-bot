import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  admin: true,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:verboseall)$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    const turnOff = settings.verboseAll === true
    console.log(
      `${
        msg.guild ? msg.guild.name : `Private Message`
      } - Toggle verbose all > ${turnOff ? `off` : `on`} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings(
      {
        verboseAll: !turnOff,
      },
      msg.guild?.id,
    )

    send(
      msg,
      `Verbose listings in '${settings.prefix}all' and '${
        settings.prefix
      }here' have been ${
        turnOff ? `turned off` : `turned on`
      }.`,
      false,
      settings,
    )
  },
}
