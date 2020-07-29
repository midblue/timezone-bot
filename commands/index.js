const { getUserInGuildFromText } = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const defaultServerSettings = require('../scripts/defaultServerSettings')
const replyToAts = require('../actions/replyToAts')
const contactGuildAdmin = require('../actions/contactGuildAdmin')

// get all commands from files
const fs = require('fs')
const commands = []
fs.readdir('./commands', (err, files) => {
  files.forEach(file => {
    if (!file.endsWith('.js') || file === 'index.js') return
    commands.push(require(`./${file}`))
  })
})

module.exports = async function (msg, settings, client) {
  const sender = msg.author
  for (let command of commands) {
    const match = command
      .regex(settings || defaultServerSettings)
      .exec(msg.content)
    if (match) {
      const senderIsAdmin =
        msg.guild &&
        msg.guild.member(msg.author) &&
        msg.guild.member(msg.author).permissions.has('ADMINISTRATOR')
      if (
        settings.adminOnly === true &&
        !command.ignoreAdminOnly &&
        !senderIsAdmin
      ) {
        send(msg, `This command is currently disabled for non-admins.`)
        return true
      }
      if (command.admin && !senderIsAdmin) {
        send(msg, `That command is only available to server admins.`)
        return true
      }

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

      if (settings.deleteCommand && !command.doNotDelete)
        msg.delete().catch(e => {
          console.log('failed to delete message:', e.code)
          contactGuildAdmin({
            guild: msg.guild,
            message: `I don't have permission to delete messages on your server. Kick TimezoneBot and use this link to re-add with proper permissions. https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=68672&scope=bot`,
          })
        })

      return true
    }
  }

  if (settings.autoRespond !== false) await replyToAts(msg)
}
