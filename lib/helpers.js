let options

const lower = (string) => string.toLowerCase()

const getAccessToken = (ctx) => {
  const accessToken = ctx.request.header[lower(options.header.tokenKey)]
  if (!accessToken) {
    throw new Error('Header key "' + options.header.tokenKey + '" is required field.')
  }
  const splitted = accessToken.split(' ')

  return (splitted[0].toLowerCase() === 'bearer' ? splitted[1] : splitted[0])
}

const getFID = (ctx) => {
  const fid = ctx.request.header[lower(options.header.fidKey)]
  if (!fid) {
    throw new Error('Header key "' + options.header.fidKey + '" is required field.')
  }

  return fid
}

module.exports = (_options) => {
  options = _options

  return {
    lower,
    getAccessToken,
    getFID
  }
}
