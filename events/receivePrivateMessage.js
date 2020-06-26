module.exports = async msg => {
  console.log(`PM - ${msg.content} (${msg.author.username})`)
  msg.channel.send(`I only work in a server channel for now.`)
}
