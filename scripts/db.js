require("dotenv").config();
const firebase = require("firebase");

var config = {
  databaseURL: process.env.DB_URL
};

let app = firebase.initializeApp(config);
let db = app.database();
let ref = db.ref("Users");

let savedUsers;

async function getDB() {
  const x = await ref.once("value");
  savedUsers = (await x.val()) || {};
  console.log(`Loaded ${Object.keys(savedUsers).length} saved users`);
}

getDB();

module.exports = {
  get(id) {
    return savedUsers[id];
  },

  getByUsername(username) {
    return savedUsers[
      Object.keys(savedUsers).find(key => savedUsers[key].username === username)
    ];
  },

  getAll() {
    return savedUsers;
  },

  timezonesIn(serverOrChannelObject) {
    let relevantTimezones = [];
    const userIdsInCurrentServer = serverOrChannelObject.recipient
      ? [serverOrChannelObject.recipient.id]
      : serverOrChannelObject.members.keyArray();
    Object.keys(savedUsers).map(k => {
      if (
        userIdsInCurrentServer.find(i => i === k) &&
        !relevantTimezones.find(
          z => z.timezoneName === savedUsers[k].timezoneName
        )
      ) {
        relevantTimezones.push(savedUsers[k]);
      }
    });
    return relevantTimezones.sort((a, b) => a.offset > b.offset);
  },

  async update(id, settings) {
    savedUsers[id] = savedUsers[id] || {};
    for (let prop in settings) savedUsers[id][prop] = settings[prop];
    savedUsers[id].lastSeen = new Date();
    await ref.update(savedUsers);
    return savedUsers[id];
  },

  lastSeen(id) {
    return savedUsers[id] ? savedUsers[id].lastSeen : undefined;
  }
};
