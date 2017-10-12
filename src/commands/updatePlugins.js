const Listr = require('listr')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const saveProjectConfiguration = require('../tasks/saveProjectConfiguration')
const cleanCache = require('../tasks/cleanCache')
const createUpdatePlugin = require('../tasks/updatePlugin')
const selectPlugins = require('../tasks/selectPlugins')
const { extendsTask, skipMode } = require('../utils/tasks')
const gitCheckChanges = require('../tasks/gitCheckChanges')
const bootstrapProjectDeps = require('../tasks/bootstrapProjectDeps')
const { commit: gitCommit, getChanges: gitGetChanges } = require('../utils/git')
const { ALL_PLUGINS, DEV_MODE, TEST_MODE } = require('../constants')
const { findPluginByName } = require('../utils/plugin')

const skipNotProdMode = skipMode(DEV_MODE, TEST_MODE)

class UpdatePluginsCommand extends Command {
  constructor(pluginsToUpdate, options) {
    super(options)

    this.state = {
      pluginsToUpdate,
    }

    this.updatePlugins = this.updatePlugins.bind(this)
  }

  updatePlugins(ctx) {
    const { pluginsToUpdate } = this.state
    const { configuration } = ctx

    let plugins
    if (pluginsToUpdate[0] === ALL_PLUGINS) {
      plugins = configuration.plugins
    } else {
      plugins = pluginsToUpdate.map(pluginName => findPluginByName(configuration.plugins, pluginName) || pluginName)

      const invalidPlugins = plugins.filter(plugin => typeof plugin === 'string')
      if (invalidPlugins.length !== 0) {
        throw new Error(`Can't find plugins with names:\n - ${invalidPlugins.join(', ')}`)
      }
    }

    ctx.updatedPlugins = []

    return new Listr(plugins.map(createUpdatePlugin))
  }

  init() {
    const { pluginsToUpdate } = this.state

    return [
      readProjectConfiguration,
      extendsTask(gitCheckChanges, {
        skip: skipNotProdMode,
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
      },
      bootstrapProjectDeps,
      saveProjectConfiguration,
      {
        title: 'Git commit',
        skip: ctx => (
          skipNotProdMode(ctx) ||
          (ctx.updatedPlugins.length === 0 && 'Plugins not updated') ||
          (!gitGetChanges(ctx.projectPath) && 'Nothing to commit')
        ),
        task: ({ projectPath, updatedPlugins }) => {
          gitCommit(projectPath, `Update plugins: ${updatedPlugins.join(', ')}`)
        },
      },
      cleanCache,
    ]
  }
}

UpdatePluginsCommand.commandName = 'update'
UpdatePluginsCommand.commandDescription = 'Update plugins'

module.exports = UpdatePluginsCommand
