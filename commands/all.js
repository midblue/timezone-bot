const db = require('../db/firestore')
const {
  currentTimeAt,
  getUserInGuildFromId,
  getLightEmoji,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const time = require('./time')
const Discord = require('discord.js')

module.exports = {
  regex(settings) {
    return new RegExp(
      `^${settings.prefix}(?:all|users|allusers|list|u|a) ?(.*)?$`,
      'gi',
    )
  },
  async action({ msg, settings, match }) {
    const onlyHere =
      (match[1] || '').toLowerCase() === 'here' ||
      (match[1] || '').toLowerCase() === 'h'

    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - All users ${onlyHere ? `in #${msg.channel.name} ` : ''}(${
        msg.author.username
      })`,
    )

    const allUsers = await db.getGuildUsers(msg.guild.id)

    if ((await Object.keys(allUsers)).length === 0)
      return send(
        msg,
        `No users in this server have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.`,
      )

    const timezonesWithUsers = await Object.keys(allUsers)
      .filter(id => (onlyHere ? msg.channel.members.get(id) : true)) // only members in this channel
      .reduce(async (acc, id) => {
        acc = await acc
        const userStub = allUsers[id]
        const userObject = await getUserInGuildFromId(msg.guild, id)

        if (userObject) {
          const timezoneName = standardizeTimezoneName(userStub.timezoneName)
          if (!acc[timezoneName]) {
            acc[timezoneName] = {
              timezoneName,
              locale: userStub.location,
              usernames: [],
              offset: userStub.offset,
            }
          }
          acc[timezoneName].usernames.push(
            userObject.nickname || userObject.user.username,
          )
        }
        return acc
      }, {})

    /*
    const hoursWithTimezonesAndUsers = Object.values(timezonesWithUsers).reduce(
      (hours, timezone) => {
        let hour = currentTimeAt(timezone.locale)
        if (!hours[hour]) hours[hour] = { timezones: [], usernames: [] }
        hours[hour].timezones.push({ ...timezone, usernames: undefined })
        hours[hour].usernames.push(...timezone.usernames)
        hours[hour].timeString = hour
        hours[hour].emoji = getLightEmoji(timezone.locale)
        return hours
      },
      {},
    )
    const hoursWithTimezonesAndUsersAsSortedArray = Object.values(
      hoursWithTimezonesAndUsers,
    ).sort((a, b) => a.timezones[0].offset - b.timezones[0].offset)

    const fields = []
    hoursWithTimezonesAndUsersAsSortedArray.forEach(time => {
      const header = `${time.emoji}${time.timeString}`
      const body =
        `**${time.timezones.map(t => t.timezoneName).join(', ')}**\n` +
        `${time.usernames.sort((a, b) => (b > a ? -1 : 1)).join(', ')}\n\u200B`
      fields.push({ name: header, value: body, inline: true })
    }, '')

    if (fields.length === 0)
      return send(
        msg,
        `No users in this server have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.`,
      )

    const richEmbed = new Discord.MessageEmbed()
      .setColor('#7B6FE5')
      .addFields(...fields)
		return send(msg, richEmbed)
		*/

    const timezonesWithUsersAsSortedArray = Object.values(
      await timezonesWithUsers,
    ).sort((a, b) => a.offset - b.offset)

    //  character limit is 2000, so, batching.
    if (onlyHere)
      send(msg, `Users with saved timezones in <#${msg.channel.id}>:`, 'none')
    let outputStrings = [''],
      currentString = 0
    timezonesWithUsersAsSortedArray.forEach(timezone => {
      if (outputStrings[currentString].length >= 1500) {
        outputStrings[currentString] = outputStrings[currentString].substring(
          0,
          outputStrings[currentString].length - 2,
        )
        currentString++
        outputStrings[currentString] = ''
      }

      const header = `${getLightEmoji(timezone.locale)}${currentTimeAt(
        timezone.locale,
        true,
      )} - ${timezone.timezoneName}` // (UTC${timezone.offset >= 0 ? '+' : ''}${timezone.offset})
      const body =
        '\n     ' +
        timezone.usernames.sort((a, b) => (b > a ? -1 : 1)).join('\n     ') +
        '\n\n'
      return (outputStrings[currentString] += header + body)
    }, '')

    outputStrings[currentString] = outputStrings[currentString].substring(
      0,
      outputStrings[currentString].length - 2,
    )

    outputStrings.forEach(s => send(msg, s, true))
  },
}
