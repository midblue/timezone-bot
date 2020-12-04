const { getUserInGuildFromText } = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const defaultServerSettings = require('../scripts/defaultServerSettings')
const replyToAts = require('../actions/replyToAts')
const contactGuildAdmin = require('../actions/contactGuildAdmin')

// get all commands from files
const fs = require('fs')
const { getUserInGuildFromId } = require('../db/firestore')
const commands = []
fs.readdir('./commands', (err, files) => {
  files.forEach((file) => {
    if (!file.endsWith('.js') || file === 'index.js') return
    commands.push(require(`./${file}`))
  })
})

module.exports = async function (msg, settings, client) {
  const sender = msg.author
  if (!settings) settings = defaultServerSettings
  for (let command of commands) {
    const match = command.regex(settings).exec(msg.content)
    if (match) {
      const senderIsAdmin =
        msg.guild &&
        msg.guild.member(msg.author) &&
        msg.guild.member(msg.author).permissions.has('BAN_MEMBERS') // was 'ADMINISTRATOR', sneakily switched
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

      //* This section is currently changed to @s only because of discord permissions issue
      // let typedUser
      // const mentionedUserIds = msg.mentions.members.array()
      // if (mentionedUserIds.length)
      //   typedUser = {
      //     ...(await getUserInGuildFromId({
      //       guildId: msg.guild.id,
      //       userId: mentionedUserIds[0].id,
      //     })),
      //     nickname:
      //       mentionedUserIds[0].nickname || mentionedUserIds[0].user.username,
      //     user: mentionedUserIds[0].user,
      //   }
      // embedded user check
      let typedUser
      if (
        command.expectsUserInRegexSlot &&
        match[command.expectsUserInRegexSlot]
      ) {
        const usernameInPlainText = match[command.expectsUserInRegexSlot]
        typedUser = await getUserInGuildFromText(msg, usernameInPlainText)
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

      if (
        settings.deleteCommand &&
        !settings.suppressWarnings &&
        !command.doNotDelete
      )
        msg.delete().catch((e) => {
          console.log('failed to delete message:', e.code)
          contactGuildAdmin({
            guild: msg.guild,
            message: `I don't have permission to delete messages on your server. Kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
          })
        })

      return true
    }
  }

  if (settings.autoRespond !== false) await replyToAts(msg, settings)
}
