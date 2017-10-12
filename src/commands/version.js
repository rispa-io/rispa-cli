const path = require('path')
const Command = require('../Command')
const { readPackageJson } = require('../utils/plugin')

class VersionCommand extends Command {
  init() {
    const { version } = readPackageJson(path.resolve(__dirname, '../../'))

    console.log(`v${version}`)
  }
}

VersionCommand.commandName = 'version'
VersionCommand.commandDescription = 'Get current version'

module.exports = VersionCommand
