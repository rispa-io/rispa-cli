const Listr = require('listr')
const fs = require('fs-extra')
const createInstallPlugin = require('../tasks/installPlugin')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const saveProjectConfiguration = require('../tasks/saveProjectConfiguration')
const gitCheckChanges = require('../tasks/gitCheckChanges')
const selectPlugins = require('../tasks/selectPlugins')
const fetchPlugins = require('../tasks/fetchPlugins')
const bootstrapProjectDeps = require('../tasks/bootstrapProjectDeps')
const cleanCache = require('../tasks/cleanCache')
const resolvePluginsDeps = require('../tasks/resolvePluginsDeps')
const { extendsTask, skipDevMode } = require('../utils/tasks')
const { commit: gitCommit } = require('../utils/git')
const { findInList: findPluginInList } = require('../utils/plugin')

class AddPluginsCommand extends Command {
  constructor([...pluginsToInstall], options) {
    super(options)

    this.state = {
      pluginsToInstall,
    }

    this.installPlugins = this.installPlugins.bind(this)
  }

  installPlugins(ctx) {
    const { plugins: pluginList, configuration: { pluginsPath } } = ctx

    fs.ensureDirSync(pluginsPath)

    const pluginsToInstall = this.state.pluginsToInstall.map(plugin =>
      findPluginInList(plugin, pluginList)
    )

    const invalidPlugins = pluginsToInstall.filter(plugin => !plugin.cloneUrl).map(plugin => plugin.name)
    if (invalidPlugins.length) {
      throw new Error(`Can't find plugins with names:\n - ${invalidPlugins.join(', ')}`)
    }

    return new Listr(
      pluginsToInstall.map(({ name, cloneUrl }) =>
        createInstallPlugin(name, cloneUrl)
      ), { exitOnError: false }
    )
  }

  init() {
    const { pluginsToInstall } = this.state
    this.add([
      extendsTask(readProjectConfiguration),
      extendsTask(gitCheckChanges, {
        skip: skipDevMode,
        after: ({ hasChanges }) => {
          if (hasChanges) {
            throw new Error('Working tree has modifications. Cannot add plugins')
          }
        },
      }),
      fetchPlugins,
      {
        title: 'Select plugins to install',
        task: selectPlugins.task,
        enabled: () => pluginsToInstall.length === 0,
        before: ctx => {
          ctx.excludePluginsNames = ctx.configuration.plugins
        },
        after: ctx => {
          this.state.pluginsToInstall = ctx.selectedPlugins
          delete ctx.selectedPlugins
        },
      },
      {
        title: 'Install plugins',
        task: this.installPlugins,
      },
      resolvePluginsDeps,
      bootstrapProjectDeps,
      saveProjectConfiguration,
      {
        title: 'Git commit',
        skip: ctx => ((!ctx.installedPlugins || !ctx.installedPlugins.length) && 'Plugins not added') || skipDevMode(ctx),
        task: ({ projectPath, installedPlugins }) => {
          gitCommit(projectPath, `Add plugins: ${installedPlugins.join(', ')}`)
        },
      },
      cleanCache,
    ])
  }
}

AddPluginsCommand.commandName = 'add'
AddPluginsCommand.commandDescription = 'Add plugins'

module.exports = AddPluginsCommand
