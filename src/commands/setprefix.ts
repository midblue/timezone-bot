import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  admin: true,
  regex(settings: Settings) {
    return new RegExp(
      `^(?:${settings.prefix}|t!)(?:prefix|setprefix|p)( ?)(.*)`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    console.log(
      `${
        msg.guild
          ? msg.guild.name?.substring(0, 25).padEnd(25, ` `)
          : `Private Message`
      }${
        msg.guild ? ` (${msg.guild.id})` : ``
      } - Prefix > ${match[2]} (${msg.author.username})`,
    )
    const previousPrefix = settings.prefix
    let newPrefix = match[2]
    if (!newPrefix || !match[1])
      return send(
        msg,
        `The current prefix is: \`${settings.prefix}\`
Type \`${settings.prefix}prefix <new prefix>\` to change the command prefix for this bot.`,
        `none`,
        settings,
      )

    const illegalCharacters = [
      `?`,
      `\\`,
      `^`,
      `$`,
      `@`,
      `#`,
      `{`,
      `}`,
      `[`,
      `]`,
      `(`,
      `)`,
      `<`,
      `>`,
      `:`,
      `*`,
      `|`,
      `+`,
      `.`,
      `\``,
    ]
    let foundIllegalCharacter: boolean | string = false
    for (let char of illegalCharacters)
      if (newPrefix.indexOf(char) > -1)
        foundIllegalCharacter = char
    if (foundIllegalCharacter === `\``)
      return send(
        msg,
        `The backtick character is not allowed in prefixes. Please try a different prefix.
(Disallowed characters are \`${illegalCharacters.join(
          ``,
        )} and the backtick character. Your prefix has not been changed.)`,
        `none`,
        settings,
      )
    if (foundIllegalCharacter)
      return send(
        msg,
        `The character \`${foundIllegalCharacter}\` is not allowed in prefixes. Please try a different prefix.
(Disallowed characters are \`${illegalCharacters.join(
          ``,
        )} and the backtick character. Your prefix has not been changed.)`,
        `none`,
        settings,
      )

    newPrefix = newPrefix.substring(0, 12)
    await db.setGuildSettings(
      {
        prefix: newPrefix,
      },
      msg.guild?.id,
    )

    send(
      msg,
      `The timezone command prefix been changed from \`${previousPrefix}\` to \`${newPrefix}\``,
      `none`,
      settings,
    )
  },
}
