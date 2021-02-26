require('dotenv').config()
const { ShardingManager } = require('discord.js')
const manager = new ShardingManager('./bot.js', {
  token: process.env.DISCORD_TOKEN,
})

manager.on('shardCreate', (shard) => {
  console.log(`Launched shard ${shard.id}`)
})

const shards = 10
console.log('Launching with', shards, 'shards')
manager.spawn(shards, 10000, 100000)
