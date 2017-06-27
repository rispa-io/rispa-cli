const Listr = require('listr')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const saveProjectConfiguration = require('../tasks/saveProjectConfiguration')
const cleanCache = require('../tasks/cleanCache')
const createUpdatePlugin = require('../tasks/updatePlugin')
const selectPlugins = require('../tasks/selectPlugins')
const { extendsTask, skipDevMode } = require('../utils/tasks')
const gitCheckChanges = require('../tasks/gitCheckChanges')
const { commit: gitCommit } = require('../utils/git')
const { ALL_PLUGINS } = require('../constants')

class RemovePluginsCommand extends Command {
  constructor([...pluginsToUpdate], options) {
    super(options)

    this.state = {
      pluginsToUpdate,
    }

    this.updatePlugins = this.updatePlugins.bind(this)
  }

  updatePlugins(ctx) {
    const { pluginsToUpdate } = this.state
    const { configuration: { plugins } } = ctx

    const invalidPlugins = pluginsToUpdate.filter(plugin => plugins.indexOf(plugin) === -1)
    if (invalidPlugins.length) {
      throw new Error(`Can't find plugins with names:\n - ${invalidPlugins.join(', ')}`)
    }

    return new Listr(
      pluginsToUpdate.map(plugin =>
        createUpdatePlugin(plugin)
      ), { exitOnError: false }
    )
  }

  init() {
    const { pluginsToUpdate } = this.state
    this.add([
      readProjectConfiguration,
      extendsTask(gitCheckChanges, {
        skip: skipDevMode,
        after: ({ hasChanges }) => {
          if (hasChanges) {
            throw new Error('Working tree has modifications. Cannot update plugins')
          }
        },
      }),
      {
        title: 'Select plugins to update',
        task: selectPlugins.task,
        enabled: () => pluginsToUpdate.length === 0,
        after: ctx => {
          this.state.pluginsToUpdate = ctx.selectedPlugins
          delete ctx.selectedPlugins
        },
      },
      {
        title: 'Update plugins',
        task: this.updatePlugins,
        before: ctx => {
          if (pluginsToUpdate[0] === ALL_PLUGINS) {
            this.state.pluginsToUpdate = ctx.configuration.plugins
          }
        },
      },
      saveProjectConfiguration,
      {
        title: 'Git commit',
        skip: ctx => (ctx.updatedPlugins.length === 0 && 'Plugins not updated') || skipDevMode(ctx),
        task: ({ projectPath, updatedPlugins }) => {
          gitCommit(projectPath, `Update plugins: ${updatedPlugins.join(', ')}`)
        },
      },
      cleanCache,
    ])
  }
}

RemovePluginsCommand.commandName = 'update'
RemovePluginsCommand.commandDescription = 'Update plugins'

module.exports = RemovePluginsCommand
