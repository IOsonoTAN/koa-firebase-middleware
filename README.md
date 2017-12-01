# Koa Firebase Middleware
A simple middleware for authentication in KOA2 with Firebase, This middleware use the [Firebase Admin](https://github.com/firebase/firebase-admin-node) for verify and authentication from Firebase database.

## Requires
* KOA.js version 2
* Node.js version 7 or newer (should support async/await or Babel)
* MongoDB
* Redis

## Install
```javascript
npm install koa-firebase-middleware
```

## Before usage
### Start servers
To use this library you have to start MongoDB  and Redis server before, Redis for caching the token and expiry time and MongoDB for store fid and insert a new user.

### Implement with Koa
This library is a middleware in Koa.js only support in version 2.

## Usage

Will show an example and how to use this library in CommonJS.

1) You have to require Koa, Koa-router and this lib.
```javascript
const Koa = require('koa')
const Router = require('koa-router')
const firebaseAuth = require('koa-firebase-middleware')
...
```

2) Create new Koa application and using Koa router.
```javascript
...
const app = new Koa()
const router = new Router()
...
```

3) Create initialize for middleware and prepaid datas from Firebase.

Where can i get it? Going to [Firebase Admin SDK (https://console.firebase.google.com/project/{YOU_PROJECT_ID}/settings/serviceaccounts/adminsdk)](https://console.firebase.google.com/project/.../settings/serviceaccounts/adminsdk)

* `credential` is json object get it from Firebase database.
* `databaseURL` is url from Firebase database.

```javascript
...
firebaseAuth.init({
  credential: require('./FIREBASE_ACCESS_KEY.json'),
  databaseURL: 'https://SOME_ID.firebaseio.com'
})
...
```

4) Create a router and listen the application with one middleware `firebaseAuth.verifyAccessToken` and these keys are require in headers.
```json
{
	"Authorization": "ACCESS_TOKEN_FROM_FIREBASE",
	"FID": "FIREBOASE_FROM_FIREBASE"
}
```
* `Authorization` is access token from Firebase.
* `FID` is unique id from Firebase.

```javascript
...
router.get('/', firebaseAuth.verifyAccessToken, (ctx, next) => {
  ctx.body = 'Welcome to Firebase Middleware'
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000, () => {
  console.log('listening on port 3000')
})
```

## Example
This an example for basic authorization with Firebase, simple and very easy to use it.

```javascript
const Koa = require('koa')
const Router = require('koa-router')
const firebaseAuth = require('koa-firebase-middleware')

const app = new Koa()
const router = new Router()

firebaseAuth.init({
  credential: require('./FIREBASE_ACCESS_KEY.json'),
  databaseURL: 'https://SOME_ID.firebaseio.com'
})

router.get('/', firebaseAuth.verifyAccessToken, (ctx, next) => {
  ctx.body = 'Welcome to Firebase Middleware'
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000, () => {
  console.log('listening on port 3000')
})
```
## Customize
this library is support custom to any fields in init option's object, by the way we provide default values for using like this:
```javascript
{
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
```
You can custom any field in above just create an object and put it in `init` see example below:
```javascript
firebaseAuth.init({
  credential: require('./key.json'),
  databaseURL: 'https://traova.firebaseio.com',
  mongo: {
    url: 'mongodb://docker:27010/traova',
    userCollection: '_users',
    fields: {
      authFirebase: '_auth_firebase',
      createdAt: '_created_at',
      fid: 'firebase_id'
    }
  }
})
```
I did custom in mongo section, set url to connect to docker on port 27010, database name "traova", connection to user collection named "_users" and store custom fields.

It should be store into you MongoDB like this:
```javascript
{
  "_id" : ObjectId("5a1d10cf5b5f4c85e5f2477f"),
  "_auth_firebase": {
    "firebase_id": "AfBru1sf5b5f4c85e5f10Sd9"
  },
  "_created_at": ISODate("2017-11-28T14:31:27.138+0700")
}
```

## License
[The MIT License](https://opensource.org/licenses/MIT)