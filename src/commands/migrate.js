const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const saveProjectConfiguration = require('../tasks/saveProjectConfiguration')
const migrateProjectConfiguration = require('../tasks/migrateProjectConfiguration')

class MigrateCommand extends Command {
  init() {
    return [
      readProjectConfiguration,
      migrateProjectConfiguration,
      saveProjectConfiguration,
    ]
  }
}

MigrateCommand.commandName = 'migrate'
MigrateCommand.commandDescription = 'Migrate existing project'

module.exports = MigrateCommand
