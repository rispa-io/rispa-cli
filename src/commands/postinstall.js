const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const scanPlugins = require('../tasks/scanPlugins')
const postinstall = require('../tasks/postinstall')

class CommitCommand extends Command {
  init() {
    this.add([
      readProjectConfiguration,
      scanPlugins,
      postinstall,
    ])
  }
}

CommitCommand.commandName = 'postinstall'
CommitCommand.commandDescription = 'Postinstall script'

module.exports = CommitCommand
