let options

const lower = (string) => string.toLowerCase()

const getAccessToken = (ctx) => {
  const accessToken = ctx.request.header[lower(options.header.tokenKey)]
  if (!accessToken) {
    throw new Error(lower('Header key "' + options.header.tokenKey + '" is required field.'))
  }
  const splitted = accessToken.split(' ')

  return (splitted[0].toLowerCase() === 'bearer' ? splitted[1] : splitted[0])
}

const getFID = (ctx, fnOptions = {}) => {
  const fid = ctx.request.header[lower(options.header.fidKey)]

  if (!fid && fnOptions.skipThrowError === false) {
    throw new Error(lower('Header key "' + options.header.fidKey + '" is required field.'))
  }

  return fid || null
}

module.exports = (_options) => {
  options = _options

  return {
    lower,
    getAccessToken,
    getFID
  }
}
