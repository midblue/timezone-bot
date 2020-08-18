const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.cert({
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
})

let firestore = admin.firestore()

const guild = require('./guild')(firestore)
const location = require('./location')(firestore)

module.exports = {
  ...guild,
  ...location,
}
