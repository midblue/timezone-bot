import admin from 'firebase-admin'
import defaultServerSettings from '../scripts/defaultServerSettings'
import memo from '../scripts/memo'

const memoedGuildData = memo(300)

let firestore = admin.firestore()

export default {
  async hasGuild({ guildId }: { guildId: string }) {
    const document = firestore.doc(`guilds/${guildId}`)
    const doc = await document.get()
    if (doc.data()) return true
    return false
  },

  async addGuild({
    guildId,
    guildName,
  }: {
    guildId?: string
    guildName?: string
  }) {
    if (!guildId || !guildName) return
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

  async getGuildSettings({
    guildId,
  }: {
    guildId?: string
  }) {
    if (!guildId) return
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

  async setGuildSettings(
    newSettings: Settings,
    guildId?: string,
  ) {
    if (!guildId) return

    const document = firestore.doc(`guilds/${guildId}`)
    const existingSettings = await this.getGuildSettings({
      guildId,
    })
    const finalSettings = existingSettings
    if (newSettings.prefix !== undefined)
      finalSettings.prefix = newSettings.prefix
    if (newSettings.autoRespond !== undefined)
      finalSettings.autoRespond = newSettings.autoRespond
    if (newSettings.adminOnly !== undefined)
      finalSettings.adminOnly = newSettings.adminOnly
    if (newSettings.deleteCommand !== undefined)
      finalSettings.deleteCommand =
        newSettings.deleteCommand
    if (newSettings.format24 !== undefined)
      finalSettings.format24 = newSettings.format24
    if (newSettings.repeatAnnounceTime !== undefined)
      finalSettings.repeatAnnounceTime =
        newSettings.repeatAnnounceTime
    if (newSettings.deleteResponse !== undefined)
      finalSettings.deleteResponse =
        newSettings.deleteResponse
    if (newSettings.suppressWarnings !== undefined)
      finalSettings.suppressWarnings =
        newSettings.suppressWarnings
    if (newSettings.verboseAll !== undefined)
      finalSettings.verboseAll = newSettings.verboseAll

    memoedGuildData.updateProp(
      guildId,
      `settings`,
      finalSettings,
    )
    await document.update({ settings: finalSettings })
  },

  getGuildUsers,

  async getUserInGuildFromId({
    guildId,
    userId,
  }: {
    guildId?: string
    userId: string
  }) {
    if (!guildId) return null
    const users = await getGuildUsers(guildId)
    return users[userId]
  },

  async updateUserInGuild({
    guildId,
    guildName,
    userId,
    updatedInfo,
  }: {
    guildId?: string
    guildName?: string
    userId: string
    updatedInfo: any
  }) {
    if (!guildId || !guildName) return

    const guildDocRef = firestore.doc(`guilds/${guildId}`)
    const doc = await guildDocRef.get()
    let data = doc.data()

    // * had a bug where this was returning nothing
    if (!data)
      data = await this.addGuild({ guildId, guildName })
    if (!data) return

    const users = data.users
    users[userId] = updatedInfo

    memoedGuildData.updateProp(guildId, `users`, users)
    await guildDocRef.update({ users })
  },

  async removeUserFromGuild({
    guildId,
    userId,
  }: {
    guildId?: string
    userId?: string
  }) {
    if (!guildId || !userId) return

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
      return `No user found by that id.`
    }

    delete users[userId]
    memoedGuildData.updateProp(guildId, `users`, users)
    await guildDocRef.update({ users })
    return true
    // console.log(`Removed user ${userId} from guild ${guildId}`)
  },
}

async function getGuildUsers(
  guildId?: string,
): Promise<{ [key: string]: UserData }> {
  if (!guildId) return {}
  const memoed = memoedGuildData.get(guildId)
  if (memoed) return memoed.users

  const guildDocRef = firestore.doc(`guilds/${guildId}`)
  const doc = await guildDocRef.get()
  const data = doc.data() || {}

  memoedGuildData.set(guildId, data)

  const users = data.users || {}
  return users
}
