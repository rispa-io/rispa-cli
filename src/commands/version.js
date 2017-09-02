const path = require('path')
const Command = require('../Command')
const { readPackageJson } = require('../utils/plugin')

class VersionCommand extends Command {
  // eslint-disable-next-line class-methods-use-this
  init() {
    const { version } = readPackageJson(path.resolve(__dirname, '../../'))

    console.log(`v${version}`)
  }
}

VersionCommand.commandName = 'version'
VersionCommand.commandDescription = 'Get current version'

module.exports = VersionCommand
