module.exports = {
  credential: null,
  databaseURL: null,
  mongo: {
    url: 'mongodb://localhost:27017/firebase_auth',
    userCollection: 'users',
    fields: {
      authFirebase: 'authFirebase',
      createdAt: 'createdAt',
      fid: 'fid'
    }
  },
  redis: {
    url: 'redis://localhost:6379/0',
    storeKey: 'fid:%(fid)s'
  },
  header: {
    tokenKey: 'Authorization',
    fidKey: 'FID'
  }
}
