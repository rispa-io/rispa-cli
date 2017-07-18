const dotenv = require('dotenv')

const initDotenv = () => dotenv.config({ silent: true })

module.exports = {
  initDotenv,
}
