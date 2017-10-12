const Listr = require('listr')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const saveProjectConfiguration = require('../tasks/saveProjectConfiguration')
const cleanCache = require('../tasks/cleanCache')
const createRemovePlugin = require('../tasks/removePlugin')
const selectPlugins = require('../tasks/selectPlugins')
const { extendsTask, skipMode } = require('../utils/tasks')
const { DEV_MODE } = require('../constants')
const gitCheckChanges = require('../tasks/gitCheckChanges')
const { commit: gitCommit, getChanges: gitGetChanges } = require('../utils/git')
const { findPluginByName } = require('../utils/plugin')

const skipDevMode = skipMode(DEV_MODE)

class RemovePluginsCommand extends Command {
  constructor(pluginsToRemove, options) {
    super(options)

    this.state = {
      pluginsToRemove,
    }

    this.removePlugins = this.removePlugins.bind(this)
  }

  removePlugins(ctx) {
    const { pluginsToRemove } = this.state
    const { configuration } = ctx

    const plugins = pluginsToRemove.map(pluginName =>
      findPluginByName(configuration.plugins, pluginName) || pluginName
    )

    const invalidPlugins = plugins.filter(plugin => typeof plugin === 'string')
    if (invalidPlugins.length !== 0) {
      throw new Error(`Can't find plugins with names:\n - ${invalidPlugins.join(', ')}`)
    }

    return new Listr(plugins.map(createRemovePlugin), { exitOnError: false })
  }

  init() {
    const { pluginsToRemove } = this.state

    return [
      readProjectConfiguration,
      extendsTask(gitCheckChanges, {
        skip: skipDevMode,
        after: ({ hasChanges }) => {
          if (hasChanges) {
            throw new Error('Working tree has modifications. Cannot remove plugins')
          }
        },
      }),
      {
        title: 'Select plugins to remove',
        task: selectPlugins.task,
        enabled: () => pluginsToRemove.length === 0,
        after: ctx => {
          this.state.pluginsToRemove = ctx.selectedPlugins
          delete ctx.selectedPlugins
        },
      },
      {
        title: 'Remove plugins',
        task: this.removePlugins,
      },
      saveProjectConfiguration,
      {
        title: 'Git commit',
        skip: ctx => (
          (ctx.removedPlugins.length === 0 && 'Plugins not removed') ||
          skipDevMode(ctx) ||
          (!gitGetChanges(ctx.projectPath) && 'Nothing to commit')
        ),
        task: ({ projectPath, removedPlugins }) => {
          gitCommit(projectPath, `Remove plugins: ${removedPlugins.join(', ')}`)
        },
      },
      cleanCache,
    ]
  }
}

RemovePluginsCommand.commandName = 'remove'
RemovePluginsCommand.commandDescription = 'Remove plugins'

module.exports = RemovePluginsCommand
