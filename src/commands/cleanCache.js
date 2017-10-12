const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const cleanCache = require('../tasks/cleanCache')

class CleanCacheCommand extends Command {
  init() {
    return [
      readProjectConfiguration,
      cleanCache,
    ]
  }
}

CleanCacheCommand.commandName = 'clean-cache'
CleanCacheCommand.commandDescription = 'Clean up plugins cache'

module.exports = CleanCacheCommand
