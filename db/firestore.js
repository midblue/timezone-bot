const { Firestore } = require('@google-cloud/firestore')
const firestore = new Firestore({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
})
const guild = require('./guild')(firestore)
const location = require('./location')(firestore)
// const overall = require('./overall')(firestore)

// const toAddToMasterStats = {
//   infractions: 0,
//   forgiven: 0,
// }
// setInterval(() => updateMasterStats(), 5 * 60 * 1000) //5m

module.exports = {
  //   async addInfraction({ userId, infraction }) {
  //     // do we want to be able to batch add? could cut down on writes and reads
  //     if (!userId || !infraction)
  //       return console.log('invalid data to addInfraction!', userId, infraction)
  //     const document = firestore.doc(`users/${userId}`)
  //     const doc = await document.get()
  //     const data = doc.data()
  //     // first infraction
  //     if (!doc || !data) {
  //       console.log(`Added first infraction for user ${userId}`)
  //       toAddToMasterStats.infractions++
  //       await document.set({
  //         infractions: [infraction],
  //       })
  //       memoedOffenderUserIds.add(userId)
  //       return
  //     }
  //     // 2nd+ infraction
  //     const existingInfractions = data.infractions || []
  //     if (
  //       existingInfractions.find(
  //         existing => existing.messageId == infraction.messageId
  //       )
  //     )
  //       return console.log('skipping existing infraction')
  //     await document.update({
  //       infractions: [...existingInfractions, infraction],
  //     })
  //     memoedOffenderUserIds.add(userId)
  //     console.log(`Added new infraction for user ${userId}`)
  //     toAddToMasterStats.infractions++
  //   },
  //   async forgiveUserOnServer({ userId, guildId }) {
  //     if (!userId || !guildId)
  //       return console.log('invalid data to getInfractions!', userId, guildId)
  //     const document = firestore.doc(`users/${userId}`)
  //     const doc = await document.get()
  //     const data = doc.data() || {}
  //     const existingInfractions = data.infractions || []
  //     const forgivenInfractions = existingInfractions.filter(
  //       i => i.guildId == guildId
  //     )
  //     const remainingInfractions = existingInfractions.filter(
  //       i => i.guildId != guildId
  //     )
  //     if (forgivenInfractions.length > 0) {
  //       await document.update({
  //         infractions: remainingInfractions,
  //       })
  //       console.log(
  //         `Forgave ${
  //           forgivenInfractions.length
  //         } infractions on server ${guildId} for user ${userId}`
  //       )
  //       toAddToMasterStats.forgiven += forgivenInfractions.length
  //     }
  //     if (existingInfractions.length === 0) memoedOffenderUserIds.delete(userId)
  //     return { forgivenInfractions, remainingInfractions }
  //   },
  //   async getUserInfractions({ userId }) {
  //     if (!userId) return console.log('invalid data to getInfractions!', userId)
  //     if (!memoedOffenderUserIds.has(userId)) return []
  //     const document = firestore.doc(`users/${userId}`)
  //     const doc = await document.get()
  //     const data = doc.data() || {}
  //     const existingInfractions = data.infractions || []
  //     return existingInfractions
  //   },
  //   async getAllMemberInfractions({ memberIds }) {
  //     if (!memberIds)
  //       return console.log('invalid data to getInfractions!', memberIds)
  //     const promises = memberIds
  //       .filter(userId => memoedOffenderUserIds.has(userId))
  //       .map(
  //         userId =>
  //           new Promise(async resolve => {
  //             const document = firestore.doc(`users/${userId}`)
  //             const doc = await document.get()
  //             const data = doc.data() || {}
  //             const infractionsCount = data.infractions
  //               ? data.infractions.length
  //               : 0
  //             resolve({ userId, infractionsCount })
  //           })
  //       )
  //     return await Promise.all(promises)
  //   },
  //   getOverallOffenderCount() {
  //     return memoedOffenderUserIds.size
  //   },
  ...guild,
  ...location,
  //   ...overall,
}
// async function updateMasterStats() {
//   if (toAddToMasterStats.infractions === 0 && toAddToMasterStats.forgiven === 0)
//     return
//   const document = firestore.doc(`master/stats`)
//   const doc = await document.get()
//   const stats = doc.data() || {}
//   const newInfractions =
//     (stats.totalInfractions || 0) + toAddToMasterStats.infractions
//   const newForgiven = (stats.totalForgiven || 0) + toAddToMasterStats.forgiven
//   if (!stats.totalInfractions || !stats.totalForgiven)
//     return document.set({
//       totalInfractions: newInfractions,
//       totalForgiven: newForgiven,
//       totalMessagesScanned: 0,
//     })
//   await document.update({
//     totalInfractions: newInfractions,
//     totalForgiven: newForgiven,
//   })
//   toAddToMasterStats.infractions = 0
//   toAddToMasterStats.forgiven = 0
//   console.log(
//     'Updated master stats. Total infractions:',
//     newInfractions,
//     'Total forgiven:',
//     newForgiven,
//     'Total offenders:',
//     memoedOffenderUserIds.size
//   )
// }
