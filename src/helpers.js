let options

const throwError = (message, statusCode = 400) => {
  const e = new Error(message)
  e.statusCode = statusCode
  throw e
}

const lower = (string) => string.toLowerCase()

const getAccessToken = (ctx) => {
  const accessToken = ctx.request.header[lower(options.header.tokenKey)]
  if (!accessToken) {
    throwError(lower('Header key "' + options.header.tokenKey + '" is required field.'))
  }
  const splitted = accessToken.split(' ')

  return (splitted[0].toLowerCase() === 'bearer' ? splitted[1] : splitted[0])
}

const getFID = (ctx, fnOptions = {}) => {
  const fid = ctx.request.header[lower(options.header.fidKey)]

  if (!fid && fnOptions.skipThrowError === false) {
    throwError(lower('Header key "' + options.header.fidKey + '" is required field.'))
  }

  return fid || null
}

module.exports = (_options) => {
  options = _options

  return {
    throwError,
    lower,
    getAccessToken,
    getFID
  }
}
