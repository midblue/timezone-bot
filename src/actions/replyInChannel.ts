import Discord from 'discord.js-light'
import contactGuildAdmin from './contactGuildAdmin'

export function send(
  msg: Discord.Message,
  text: string | Discord.MessageOptions,
  block: boolean | `none` = false,
  settings: Settings,
) {
  const messages = []
  const prefix =
    block === `none` ? `` : block ? `\`\`\`` : `\``
  if (typeof text === `object`) messages.push(text)
  else {
    let remainingText = text
    while (remainingText.length > 0) {
      messages.push(
        `${prefix}${remainingText.substring(
          0,
          1990,
        )}${prefix}`,
      )
      remainingText = remainingText.substring(1990)
    }
  }
  for (let message of messages)
    msg.channel
      .send(message)
      .then((sentMsg) => {
        // console.log(
        //   msg.guild.name,
        //   settings && typeof settings.deleteResponse,
        //   settings && settings.deleteResponse,
        // )
        if (settings && settings.deleteResponse) {
          setTimeout(
            async () => {
              try {
                const msgToDelete =
                  await sentMsg.channel.messages.fetch(
                    sentMsg.id,
                  )
                msgToDelete.delete().catch((err) => {
                  if (!settings.suppressWarnings)
                    contactGuildAdmin({
                      guild: msg.guild,
                      message: `I failed to delete a message in your server. It's most likely because I don't have delete permissions on your server or in the channel I attempted to delete from. Make sure I have delete permissions in the channels where I'm used, or kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
                    })
                  console.error(
                    `Failed to delete!`,
                    err.message,
                  )
                })
              } catch (e: any) {
                console.error(
                  `Failed to delete!!`,
                  e.message,
                )
              }
            },
            typeof settings.deleteResponse === `number`
              ? settings.deleteResponse * 1000
              : 5 * 60 * 1000,
          )
        }
      })
      .catch((err) => {
        if (!settings.suppressWarnings)
          contactGuildAdmin({
            guild: msg.guild,
            message: `I failed to send a message in your server. It's most likely because I don't have the right permissions on the server or in the channel I attempted to post in. Make sure I have post permissions in the channels where I'm used, or kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
          })
        console.error(`Failed to send!`, err.message)
      })
}

export function reply(
  msg: Discord.Message,
  text: string,
  settings: Settings,
) {
  const messages = []
  let remainingText = text
  while (remainingText.length > 0) {
    messages.push(remainingText.substring(0, 1998))
    remainingText = remainingText.substring(1998)
  }
  for (let message of messages)
    msg.channel.send(message).catch((err) => {
      if (!settings.suppressWarnings)
        contactGuildAdmin({
          guild: msg.guild,
          message: `I failed to send a message in your server. It's most likely because I don't have the right permissions. Make sure I have post permissions in the channels where I'm used, or kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
        })
      console.error(`Failed to reply!`, err.message)
    })
}
