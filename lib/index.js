const admin = require('firebase-admin')
const bluebird = require('bluebird')
const redis = require('redis')
const { sprintf } = require('sprintf-js')
const moment = require('moment')
const { MongoClient } = require('mongodb')

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

const datetimeFormat = 'MM/DD/YYYY HH:mm:ss'
const options = {
  credential: null,
  databaseURL: null,
  mongo: {
    url: 'mongodb://localhost:27017/firebase_auth',
    userCollection: 'users'
  },
  redis: {
    url: 'redis://localhost:6379/0',
    storeKey: 'fid:%(fid)s'
  }
}
let redisClient
let User
let dbResult

const init = (_options = {}) => {
  Object.assign(options, _options)

  admin.initializeApp({
    credential: admin.credential.cert(options.credential),
    databaseURL: options.databaseURL
  })
}

const getAccessToken = (ctx) => {
  const accessToken = ctx.request.header.access_token
  if (!accessToken) {
    ctx.throw(403, 'unauthorized, access_token is required.')
    return
  }
  const splitted = ctx.request.header.access_token.split(' ')

  return (splitted[0].toLowerCase() === 'bearer' ? splitted[1] : splitted[0])
}

const getFID = (ctx) => {
  const fid = ctx.request.header.fid
  if (!fid) {
    ctx.throw(403, 'unauthorized, fid is required.')
    return
  }

  return fid
}

const verifyAccessToken = async (ctx, next) => {
  try {
    const accessToken = getAccessToken(ctx)
    const fid = getFID(ctx)

    redisClient = await redis.createClient({
      url: options.redis.url
    })
    const getRedisKey = sprintf(options.redis.storeKey, {
      fid
    })
    const redisValue = await redisClient.getAsync(getRedisKey)
    if (redisValue) {
      return next()
    }

    const db = await MongoClient.connect(options.mongo.url)
    User = db.collection(options.mongo.userCollection)

    const authData = await admin.auth().verifyIdToken(accessToken)
    if (authData.uid !== fid) {
      ctx.throw(400, 'unauthorized.')
    }

    const redisKey = sprintf(options.redis.storeKey, {
      fid: authData.uid
    })
    const nowTime = moment(moment().format(datetimeFormat), datetimeFormat)
    const expTime = moment.unix(authData.exp, datetimeFormat)
    const redisTTL = Math.round(((expTime.diff(nowTime) / 1000) / 60) * 60)
    redisClient.setAsync(redisKey, accessToken, 'EX', redisTTL)

    dbResult = await User.find({ fid }).toArray()
    if (dbResult.length === 0) {
      User.insert({
        fid,
        createdAt: new Date()
      })
    }

    next()
  } catch (e) {
    ctx.throw(400, e.message)
  }
}

module.exports = {
  init,
  verifyAccessToken
}
