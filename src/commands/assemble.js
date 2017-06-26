const Listr = require('listr')
const Command = require('../Command')
const createRestorePluginTask = require('../tasks/restorePlugin')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')

class AssembleCommand extends Command {
  init() {
    this.add([
      readProjectConfiguration,
      {
        title: 'Restore plugins',
        task: ctx => new Listr(
          ctx.configuration.plugins.map(createRestorePluginTask),
          { exitOnError: false }
        ),
      },
    ])
  }
}

AssembleCommand.commandName = 'assemble'
AssembleCommand.commandDescription = 'Assemble project'

module.exports = AssembleCommand
