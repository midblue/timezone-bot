import admin from 'firebase-admin'
/* eslint-disable camelcase */

admin.initializeApp({
  credential: admin.credential.cert({
    project_id: process.env.FIREBASE_PROJECT_ID!,
    client_email: process.env.FIREBASE_CLIENT_EMAIL!,
    private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(
      /\\n/g,
      `\n`,
    ),
  } as admin.ServiceAccount),
})

import guild from './guild'
import location from './location'

export default {
  ...guild,
  ...location,
}
