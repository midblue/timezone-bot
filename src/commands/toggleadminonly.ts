import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  admin: true,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:admins?only)$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    const turnOff = settings.adminOnly === true
    console.log(
      `${
        msg.guild ? msg.guild.name : `Private Message`
      } - Toggle admin mode > ${turnOff ? `off` : `on`} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings(
      {
        adminOnly: !turnOff,
      },
      msg.guild?.id,
    )

    send(
      msg,
      `Commands ${
        turnOff
          ? `may now be used by all users`
          : `may now only be used by admins`
      }.`,
      false,
      settings,
    )
  },
}
