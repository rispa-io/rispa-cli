const chalk = require('chalk')
const { checkout: gitCheckout, pullRepository: gitPull } = require('../utils/git')

const createCheckoutPlugin = (name, path, branch) => ({
  title: `Checkout plugin ${chalk.cyan(name)}`,
  task: () => {
    gitCheckout(path, branch)
    gitPull(path)
  },
})

module.exports = createCheckoutPlugin
