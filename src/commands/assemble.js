const fs = require('fs-extra')
const Listr = require('listr')
const Command = require('../Command')
const { extendsTask, skipMode } = require('../utils/tasks')
const { DEV_MODE } = require('../constants')
const createRestorePluginTask = require('../tasks/restorePlugin')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const bootstrapProjectDeps = require('../tasks/bootstrapProjectDeps')
const gitCheckChanges = require('../tasks/gitCheckChanges')
const cleanCache = require('../tasks/cleanCache')

class AssembleCommand extends Command {
  init() {
    this.add([
      readProjectConfiguration,
      extendsTask(gitCheckChanges, {
        skip: skipMode(DEV_MODE),
        after: ({ hasChanges }) => {
          if (hasChanges) {
            throw new Error('Working tree has modifications. Cannot restore plugins')
          }
        },
      }),
      {
        title: 'Restore plugins',
        task: ctx => {
          fs.ensureDirSync(ctx.configuration.pluginsPath)
          return new Listr(
            ctx.configuration.plugins.map(createRestorePluginTask),
            { exitOnError: false }
          )
        },
      },
      cleanCache,
      bootstrapProjectDeps,
    ])
  }
}

AssembleCommand.commandName = 'assemble'
AssembleCommand.commandDescription = 'Assemble project'

module.exports = AssembleCommand
