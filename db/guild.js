const defaultServerSettings = require('../scripts/defaultServerSettings')
const memo = require('../scripts/memo')

const memoedGuildData = memo(300)
let firestore

module.exports = function (passedFirestore) {
  if (passedFirestore) firestore = passedFirestore
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
      return newData
      // console.log(`Added guild ${guildId}`)
    },

    async getGuildSettings({ guildId }) {
      const memoed = memoedGuildData.get(guildId)
      if (memoed) return memoed.settings

      let data
      try {
        const document = firestore.doc(`guilds/${guildId}`)
        const doc = await document.get()
        data = doc.data()
      } catch (e) {}
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
      suppressWarnings,
      format24,
      repeatAnnounceTime,
      verboseAll,
    }) {
      const document = firestore.doc(`guilds/${guildId}`)
      const existingSettings = await this.getGuildSettings({
        guildId,
      })
      const newSettings = existingSettings
      if (prefix !== undefined) newSettings.prefix = prefix
      if (autoRespond !== undefined)
        newSettings.autoRespond = autoRespond
      if (adminOnly !== undefined)
        newSettings.adminOnly = adminOnly
      if (deleteCommand !== undefined)
        newSettings.deleteCommand = deleteCommand
      if (format24 !== undefined)
        newSettings.format24 = format24
      if (repeatAnnounceTime !== undefined)
        newSettings.repeatAnnounceTime = repeatAnnounceTime
      if (deleteResponse !== undefined)
        newSettings.deleteResponse = deleteResponse
      if (suppressWarnings !== undefined)
        newSettings.suppressWarnings = suppressWarnings
      if (verboseAll !== undefined)
        newSettings.verboseAll = verboseAll

      memoedGuildData.updateProp(
        guildId,
        'settings',
        newSettings,
      )
      await document.update({ settings: newSettings })
    },

    getGuildUsers,

    async getUserInGuildFromId({ guildId, userId }) {
      const users = await getGuildUsers(guildId)
      return users[userId]
    },

    async updateUserInGuild({
      guildId,
      guildName,
      userId,
      updatedInfo,
    }) {
      const guildDocRef = firestore.doc(`guilds/${guildId}`)
      const doc = await guildDocRef.get()
      let data = doc.data()

      // * had a bug where this was returning nothing
      if (!data)
        data = await this.addGuild({ guildId, guildName })

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

      if (!userId) {
        console.log(
          `Failed to remove user ${userId} from guild ${guildId}: No user ID supplied`,
        )
        return
      }
      if (!users[userId]) {
        console.log(
          `Failed to remove user ${userId} from guild ${guildId}: No user found by that ID`,
        )
        return 'No user found by that id.'
      }

      delete users[userId]
      memoedGuildData.updateProp(guildId, 'users', users)
      await guildDocRef.update({ users })
      return true
      // console.log(`Removed user ${userId} from guild ${guildId}`)
    },
  }
}

async function getGuildUsers(guildId) {
  const memoed = memoedGuildData.get(guildId)
  if (memoed) return memoed.users

  const guildDocRef = firestore.doc(`guilds/${guildId}`)
  const doc = await guildDocRef.get()
  const data = doc.data() || {}

  memoedGuildData.set(guildId, data)

  const users = data.users || {}
  return users
}
