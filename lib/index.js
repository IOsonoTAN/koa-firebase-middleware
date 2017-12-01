const { merge } = require('lodash')
const admin = require('firebase-admin')
const bluebird = require('bluebird')
const moment = require('moment')
const redis = require('redis')
const { sprintf } = require('sprintf-js')
const { MongoClient } = require('mongodb')

const options = require('./options')
const { getAccessToken, getFID } = require('./helpers')(options)

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

const datetimeFormat = 'MM/DD/YYYY HH:mm:ss'
let redisClient
let User
let userInfo

const init = (_options = {}) => {
  merge(options, _options)

  admin.initializeApp({
    credential: admin.credential.cert(options.credential),
    databaseURL: options.databaseURL
  })
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
      ctx.user = JSON.parse(redisValue)
      return next()
    }

    const db = await MongoClient.connect(options.mongo.url)
    User = db.collection(options.mongo.userCollection)

    const authData = await admin.auth().verifyIdToken(accessToken)
    if (authData.uid !== fid) {
      const e = new Error('Unauthorized.')
      e.statusCode = 401
      throw e
    }

    const redisKey = sprintf(options.redis.storeKey, {
      fid: authData.uid
    })
    const nowTime = moment(moment().format(datetimeFormat), datetimeFormat)
    const expTime = moment.unix(authData.exp, datetimeFormat)
    const redisTTL = Math.round(((expTime.diff(nowTime) / 1000) / 60) * 60)

    userInfo = await User.find({
      [options.mongo.fields.fid]: fid
    }).toArray()

    if (userInfo.length === 0) {
      userInfo = await User.insert({
        [options.mongo.fields.authFirebase]: {
          [options.mongo.fields.fid]: fid
        },
        [options.mongo.fields.createdAt]: new Date()
      })
      userInfo = userInfo.ops[0]
    }

    const dataContext = {
      accessToken,
      fid,
      ...userInfo
    }
    redisClient.set(redisKey, JSON.stringify(dataContext), 'EX', redisTTL)
    ctx.user = dataContext

    next()
  } catch (e) {
    ctx.throw((!e.statusCode ? 400 : e.statusCode), e.message)
  }
}

const moduleExports = {
  init,
  verifyAccessToken
}

exports.default = moduleExports
module.exports = moduleExports
