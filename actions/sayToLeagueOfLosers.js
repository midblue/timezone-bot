module.exports = async (client, msg) => {
  const channelId = '355735157094744075' //'605053799404666882' //
  const channel = await client.channels.fetch(channelId)
  channel.send(msg.content.substring(msg.content.indexOf('Losers ') + 7))
}
