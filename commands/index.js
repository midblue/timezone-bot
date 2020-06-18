const { getUserInGuildFromText } = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')

// get all commands from files
const fs = require('fs')
const replyToAts = require('../actions/replyToAts')
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
    const match = command.regex(settings).exec(msg.content)
    if (match) {
      const senderIsAdmin =
        msg.guild &&
        msg.guild.member(msg.author) &&
        msg.guild.member(msg.author).permissions.has('ADMINISTRATOR')
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
        settings,
        match,
        typedUser,
        sender,
        client,
      })

      return true
    }
  }

  await replyToAts(msg)
}
