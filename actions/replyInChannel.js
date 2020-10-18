const contactGuildAdmin = require('./contactGuildAdmin')

module.exports = {
  send(msg, text, block = false, settings) {
    const messages = []
    const prefix = block === 'none' ? '' : block ? '```' : '`'
    if (typeof text === 'object') messages.push(text)
    else {
      let remainingText = text
      while (remainingText.length > 0) {
        messages.push(`${prefix}${remainingText.substring(0, 1990)}${prefix}`)
        remainingText = remainingText.substring(1990)
      }
    }
    for (let message of messages)
      msg.channel
        .send(message)
        .then(sentMsg => {
          if (
            settings &&
            settings.deleteResponse &&
            !settings.suppressWarnings
          ) {
            setTimeout(async () => {
              try {
                const msgToDelete = await sentMsg.channel.messages.fetch(
                  sentMsg.id,
                )
                msgToDelete.delete().catch(err => {
                  contactGuildAdmin({
                    guild: msg.guild,
                    message: `I failed to delete a message in your server. It's most likely because I don't have delete permissions on your server. Kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
                  })
                  console.error('Missing permissions to delete!', err.message)
                })
              } catch (e) {}
            }, 5 * 60 * 1000)
          }
        })
        .catch(err => {
          if (!settings.suppressWarnings)
            contactGuildAdmin({
              guild: msg.guild,
              message: `I failed to send a message in your server. It's most likely because I don't have the right permissions. Kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
            })
          console.error('Missing permissions to send!', err.message)
        })
  },
  reply(msg, text) {
    const messages = []
    let remainingText = text
    while (remainingText.length > 0) {
      messages.push(remainingText.substring(0, 1998))
      remainingText = remainingText.substring(1998)
    }
    for (let message of messages)
      msg.channel.send(message).catch(err => {
        if (!settings.suppressWarnings)
          contactGuildAdmin({
            guild: msg.guild,
            message: `I failed to send a message in your server. It's most likely because I don't have the right permissions. Kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
          })
        console.error('Missing permissions to reply!', err.message)
      })
  },
}
