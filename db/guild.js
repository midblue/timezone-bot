const defaultServerSettings = require('../scripts/defaultServerSettings')
const memo = require('../scripts/memo')

const memoedGuildData = memo(100)

module.exports = function (firestore) {
  return {
    async hasGuild({ guildId }) {
      const document = firestore.doc(`guilds/${guildId}`)
      const doc = await document.get()
      if (doc.data()) return true
      return false
    },

    async addGuild({ guildId, guildName }) {
      const document = firestore.doc(`guilds/${guildId}`)
      const newData = {
        dateAdded: Date.now(),
        name: guildName,
        users: {},
        settings: defaultServerSettings,
      }
      memoedGuildData.set(guildId, newData)
      await document.set(newData)
      // console.log(`Added guild ${guildId}`)
    },

    async getGuildSettings({ guildId }) {
      const memoed = memoedGuildData.get(guildId)
      if (memoed) return memoed.settings

      const document = firestore.doc(`guilds/${guildId}`)
      const doc = await document.get()
      const data = doc.data()
      if (!data) return defaultServerSettings

      const settings = {
        ...defaultServerSettings,
        ...(data.settings || {}),
      }
      memoedGuildData.set(guildId, { ...data, settings })
      return settings
    },

    async setGuildSettings({
      guildId,
      prefix,
      autoRespond,
      adminOnly,
      deleteCommand,
      deleteResponse,
    }) {
      const document = firestore.doc(`guilds/${guildId}`)
      const existingSettings = await this.getGuildSettings({ guildId })
      const newSettings = existingSettings
      if (prefix !== undefined) newSettings.prefix = prefix
      if (autoRespond !== undefined) newSettings.autoRespond = autoRespond
      if (adminOnly !== undefined) newSettings.adminOnly = adminOnly
      if (deleteCommand !== undefined) newSettings.deleteCommand = deleteCommand
      if (deleteResponse !== undefined)
        newSettings.deleteResponse = deleteResponse

      memoedGuildData.updateProp(guildId, 'settings', newSettings)
      await document.update({ settings: newSettings })
    },

    async getGuildUsers(guildId) {
      const memoed = memoedGuildData.get(guildId)
      if (memoed) return memoed.users

      const guildDocRef = firestore.doc(`guilds/${guildId}`)
      const doc = await guildDocRef.get()
      const data = doc.data() || {}

      memoedGuildData.set(guildId, data)

      const users = data.users || {}
      return users
    },

    async getUserInGuildFromId({ guildId, userId }) {
      const users = await this.getGuildUsers(guildId)
      return users[userId]
    },

    async updateUserInGuild({ guildId, userId, updatedInfo }) {
      const guildDocRef = firestore.doc(`guilds/${guildId}`)
      const doc = await guildDocRef.get()
      const data = doc.data()
      const users = data.users
      users[userId] = updatedInfo

      memoedGuildData.updateProp(guildId, 'users', users)
      await guildDocRef.update({ users })
    },

    async removeUserFromGuild({ guildId, userId }) {
      const guildDocRef = firestore.doc(`guilds/${guildId}`)
      const doc = await guildDocRef.get()
      const data = doc.data()
      if (!data) return
      const users = data.users

      if (!userId)
        return console.log(
          `Failed to remove user ${userId} from guild ${guildId}: No user ID supplied`,
        )
      if (!users[userId])
        return console.log(
          `Failed to remove user ${userId} from guild ${guildId}: No user found by that ID`,
        )

      delete users[userId]
      memoedGuildData.updateProp(guildId, 'users', users)
      await guildDocRef.update({ users })
      // console.log(`Removed user ${userId} from guild ${guildId}`)
    },
  }
}
