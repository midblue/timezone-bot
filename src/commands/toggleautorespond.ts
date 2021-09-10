import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  admin: true,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:auto[-]?re(spon(d|se|ses)|ply))$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    const turnOff = settings.autoRespond === true
    console.log(
      `${
        msg.guild ? msg.guild.name : `Private Message`
      } - Toggle autorespond > ${turnOff ? `off` : `on`} (${
        msg.author.username
      }) `,
    )

    await db.setGuildSettings(
      {
        autoRespond: !turnOff,
      },
      msg.guild?.id,
    )

    send(
      msg,
      `Auto-responding to @s has been turned ${
        turnOff ? `off` : `on`
      }.`,
      false,
      settings,
    )
  },
}
