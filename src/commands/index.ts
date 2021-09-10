import { getUserInGuildFromText } from '../scripts/commonFunctions'
const { send } = require(`../actions/replyInChannel`)
import defaultServerSettings from '../scripts/defaultServerSettings'
const replyToAts = require(`../actions/replyToAts`)
const contactGuildAdmin = require(`../actions/contactGuildAdmin`)
import * as Discord from 'discord.js-light'

import all from './all'
import at from './at'
import count from './count'
import deleteresponse from './deleteresponse'
import format from './format'
import here from './here'
import info from './info'
import invite from './invite'
import me from './me'
import removeme from './removeme'
import removeuser from './removeuser'
import role from './role'
import set from './set'
import setprefix from './setprefix'
import setRepeatAnnounceTime from './setRepeatAnnounceTime'
import setuser from './setuser'
import stamp from './stamp'
import support from './support'
import suppresswarnings from './suppresswarnings'
import time from './time'
import timein from './timein'
import toggleadminonly from './toggleadminonly'
import toggleautorespond from './toggleautorespond'
import toggledeletecommand from './toggledeletecommand'
import verboseAll from './verboseAll'
const commands: any[] = [
  all,
  at,
  count,
  deleteresponse,
  format,
  here,
  info,
  invite,
  me,
  removeme,
  removeuser,
  role,
  set,
  setprefix,
  setRepeatAnnounceTime,
  setuser,
  stamp,
  support,
  suppresswarnings,
  time,
  timein,
  toggleadminonly,
  toggleautorespond,
  toggledeletecommand,
  verboseAll,
]

module.exports = async function (
  msg: Discord.Message,
  settings: any,
  client: Discord.Client,
) {
  if (!settings) settings = defaultServerSettings
  for (let command of commands) {
    const match = command.regex(settings).exec(msg.content)
    if (match) {
      const sender = await msg.guild?.members.fetch({
        user: msg.author,
      })
      const senderIsAdmin =
        sender && sender.permissions.has(`BAN_MEMBERS`) // was 'ADMINISTRATOR', sneakily switched
      if (
        settings.adminOnly === true &&
        !command.ignoreAdminOnly &&
        !senderIsAdmin
      ) {
        send(
          msg,
          `This command is currently disabled for non-admins.`,
          false,
          settings,
        )
        return true
      }
      if (command.admin && !senderIsAdmin) {
        send(
          msg,
          `That command is only available to server admins.`,
          false,
          settings,
        )
        return true
      }

      // embedded user check
      let typedUser
      if (
        command.expectsUserInRegexSlot &&
        match[command.expectsUserInRegexSlot]
      ) {
        const usernameInPlainText =
          match[command.expectsUserInRegexSlot]
        typedUser = await getUserInGuildFromText(
          msg,
          usernameInPlainText,
        )
      }

      // execute command
      await command.action({
        msg,
        settings: settings || defaultServerSettings,
        match,
        typedUser,
        senderIsAdmin,
        sender,
        client,
      })

      if (settings.deleteCommand && !command.doNotDelete)
        msg.delete().catch((e) => {
          console.log(`failed to delete message:`, e.code)
          if (!settings.suppressWarnings)
            contactGuildAdmin({
              guild: msg.guild,
              message: `I don't have permission to delete messages on your server. Kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
            })
        })

      return true
    }
  }

  if (settings.autoRespond !== false)
    await replyToAts(msg, settings)
}
