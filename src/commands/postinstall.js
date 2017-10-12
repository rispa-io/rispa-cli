const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const scanPlugins = require('../tasks/scanPlugins')
const postinstall = require('../tasks/postinstall')
const cleanCache = require('../tasks/cleanCache')
const bootstrapProjectDeps = require('../tasks/bootstrapProjectDeps')

class PostinstallCommand extends Command {
  init() {
    return [
      readProjectConfiguration,
      bootstrapProjectDeps,
      cleanCache,
      scanPlugins,
      postinstall,
    ]
  }
}

PostinstallCommand.commandName = 'postinstall'
PostinstallCommand.commandDescription = 'Postinstall script'

module.exports = PostinstallCommand
