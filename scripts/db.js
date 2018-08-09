const logger = require('./log.js')
const log = logger('db', 'yellow')
const err = logger('db', 'red')
const debug = logger('db', 'yellow', true)



/*

Hi! Our SQL database schema looks like this:

place
+-------+-------------+------+-----+---------+-------+
| Field | Type        | Null | Key | Default | Extra |
+-------+-------------+------+-----+---------+-------+
| name  | varchar(50) | NO   | PRI |         |       |
| lat   | float       | YES  |     | NULL    |       |
| lng   | float       | YES  |     | NULL    |       |
+-------+-------------+------+-----+---------+-------+

user
+----------+-------------+------+-----+---------+-------+
| Field    | Type        | Null | Key | Default | Extra |
+----------+-------------+------+-----+---------+-------+
| id       | varchar(20) | NO   | PRI | NULL    |       |
| location | varchar(50) | YES  |     | NULL    |       |
+----------+-------------+------+-----+---------+-------+

server_user
+----------+-------------+------+-----+---------+-------+
| Field    | Type        | Null | Key | Default | Extra |
+----------+-------------+------+-----+---------+-------+
| lastSeen | datetime    | YES  |     | NULL    |       |
| username | varchar(50) | YES  |     | NULL    |       |
| serverId | varchar(20) | NO   | PRI |         |       |
| userId   | varchar(20) | NO   | PRI |         |       |
+----------+-------------+------+-----+---------+-------+

*/


const mysql = require('mysql').createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: 'timezonebot',
  timezone: 'Z' // +0
})

mysql.query(
  `SELECT *
        FROM server_user
        LEFT JOIN user ON user.id = server_user.userId
        LEFT JOIN place ON place.name = user.location;`,
  (e, results, fields) => {
    if (e) return err('MySQL error:', e)
    debug(results)
  })

mysql.query(`SELECT * FROM user;`,
  (e, results, fields) => {
    if (e) err('MySQL error:', e)
    log(`Connected to MySQL (${results.length} saved users)`)
  })

function mySqlTimestamp () {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

module.exports = {
  getUser (userId, serverId) {
    debug('getUser', userId)
    return new Promise ((resolve, reject) => {
      mysql.query(
        `SELECT server_user.username, server_user.lastSeen, user.location, place.lat, place.lng
        FROM server_user
        LEFT JOIN user ON user.id = '${userId}'
        LEFT JOIN place ON place.name = user.location
        WHERE serverId = '${serverId}' AND userId = '${userId}';`,
        (e, results, fields) => {
          if (e) return err('MySQL error:', e)
          // debug(results)
          resolve(results[0])
        })
    })
  },

  getUserLocation (userId) {
    debug('getUserLocation', userId)
    return new Promise((resolve, reject) => {
      mysql.query(
        `SELECT location FROM user
        WHERE id = '${userId}';`,
        (e, results, fields) => {
          if (e) return err('MySQL error:', e)
          debug(results)
          resolve(results[0])
        })
    })
  },

  getUserByUsername(username, serverId) {
    debug('getUserByUsername', username)
    return new Promise((resolve, reject) => {
      mysql.query(
        `SELECT server_user.lastSeen, user.location, place.lat, place.lng
        FROM server_user
        LEFT JOIN user ON user.id = server_user.userId
        LEFT JOIN place ON place.name = user.location
        WHERE serverId = '${serverId}' AND username = '${username}';`,
        (e, results, fields) => {
          if (e) return err('MySQL error:', e)
          debug(`serverId = '${serverId}' AND username = '${username}'`, results)
          resolve(results[0])
        })
    })
  },

  getUsersInServer(serverId) {
    debug('getUsersInServer', serverId)
    return new Promise((resolve, reject) => {
      mysql.query(
        `SELECT server_user.username, server_user.userId AS id, server_user.lastSeen, user.location, place.lat, place.lng
        FROM server_user
        LEFT JOIN user ON user.id = server_user.userId
        LEFT JOIN place ON place.name = user.location
        WHERE serverId = '${serverId}';`,
        (e, results, fields) => {
          if (e) err('MySQL error:', e)
          debug(results)
          resolve(results)
        })
    })
  },

  updateUser (userId, serverId, settings) {
    debug('updateUser', userId, serverId, settings)
    return new Promise((resolve, reject) => {
      // null is a trigger to unset a user's location
      if (settings.location || settings.location === null)
        mysql.query(
          `INSERT INTO user (id, location)
          VALUES ('${userId}', ${settings.location == null ? null : `'${settings.location}'`})
          ON DUPLICATE KEY
          UPDATE 
            location = ${settings.location == null ? null : `'${settings.location}'`};`,
          (e, results, fields) => {
            if (e) err('MySQL error:', e)
            if (results.message) debug(results)
          })
      mysql.query(
        `INSERT INTO server_user (lastSeen, username, serverId, userId)
        VALUES (
          '${mySqlTimestamp()}',
          '${settings.username || null}', 
          '${serverId}', 
          '${userId}')
        ON DUPLICATE KEY
        UPDATE 
          lastSeen = '${mySqlTimestamp()}',
          ${ settings.username ?
            `username = '${settings.username}'` : ''
          };`,
        (e, results, fields) => {
          if (e) err('MySQL error:', e)
          if (results.message) debug(results)
          resolve(results)
        })
    })
  },

  getUserLastSeenInServer (userId, serverId) {
    debug('getUserLastSeen', userId)
    return new Promise((resolve, reject) => {
      mysql.query(
        `SELECT lastSeen FROM server_user
        WHERE serverId = '${serverId}' AND userId = '${userId}';`,
        (e, results, fields) => {
          if (e) err('MySQL error:', e)
          resolve(results[0] ? results[0].lastSeen : null)
        })
    })
  },

  getCoords (location) {
    debug('getCoords', location)
    location = location.replace('\'', '').toLowerCase()
    return new Promise((resolve, reject) => {
      mysql.query(
        `SELECT lat, lng FROM place
        WHERE name = '${location}';`,
        (e, results, fields) => {
          if (e) err('MySQL error:', e)
          resolve(results[0] ? [results[0].lat, results[0].lng] : null)
        })
    })
  },

  setCoords(location, coords) {
    debug('setCoords', location)
    location = location.replace('\'', '').toLowerCase()
    mysql.query(
      `INSERT INTO place (name, lat, lng)
      VALUES (
        '${location}', 
        '${coords[0]}', 
        '${coords[1]}')
      ON DUPLICATE KEY
      UPDATE
        lat = '${coords[0]}', 
        lng = '${coords[1]}';`,
      (e, results, fields) => {
        if (e) err('MySQL error:', e)
        if (results.message) debug(results)
      })
  },

}
