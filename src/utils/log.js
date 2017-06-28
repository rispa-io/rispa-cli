const createDebug = require('debug')

const logError = createDebug('rispa:error:cli')

const handleError = e => {
  logError(e)
  if (e.errors) {
    e.errors.forEach(error => logError(error))
  }
  if (e.context) {
    logError('Context:')
    logError(e.context)
  }
  process.exit(1)
}

module.exports = {
  logError,
  handleError,
}
