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
const scanPlugins = require('../tasks/scanPlugins')
const postinstall = require('../tasks/postinstall')
const { extendsTask, skipMode } = require('../utils/tasks')
const { DEV_MODE, TEST_MODE } = require('../constants')
const { commit: gitCommit, getChanges: gitGetChanges } = require('../utils/git')
const { findPluginForInstall } = require('../utils/plugin')

const skipNotProdMode = skipMode(DEV_MODE, TEST_MODE)

const skipTestMode = skipMode(TEST_MODE)

class AddPluginsCommand extends Command {
  constructor(pluginsToInstall, options) {
    super(options)

    this.state = {
      pluginsToInstall,
    }

    this.installPlugins = this.installPlugins.bind(this)
  }

  installPlugins(ctx) {
    const { configuration } = ctx
    const { pluginsToInstall } = this.state

    fs.ensureDirSync(configuration.pluginsPath)

    const plugins = pluginsToInstall.map(pluginName => findPluginForInstall(pluginName, ctx.plugins) || pluginName)

    const invalidPlugins = plugins.filter(plugin => typeof plugin === 'string')
    if (invalidPlugins.length !== 0) {
      throw new Error(`Can't find plugins with names:\n - ${invalidPlugins.join(', ')}`)
    }

    return new Listr(plugins.map(createInstallPlugin), { exitOnError: false })
  }

  init() {
    const { pluginsToInstall } = this.state

    return [
      readProjectConfiguration,
      extendsTask(gitCheckChanges, {
        skip: skipNotProdMode,
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
        skip: skipTestMode,
        enabled: () => pluginsToInstall.length === 0,
        before: ctx => {
          ctx.excludePluginsNames = ctx.configuration.plugins.map(plugin => plugin.name)
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
        skip: ctx => (
          ((!ctx.installedPlugins || !ctx.installedPlugins.length) && 'Plugins not added') ||
          skipNotProdMode(ctx) ||
          (!gitGetChanges(ctx.projectPath) && 'Nothing to commit')
        ),
        task: ({ projectPath, installedPlugins }) => {
          gitCommit(projectPath, `Add plugins: ${installedPlugins.join(', ')}`)
        },
      },
      cleanCache,
      scanPlugins,
      postinstall,
    ]
  }
}

AddPluginsCommand.commandName = 'add'
AddPluginsCommand.commandDescription = 'Add plugins'

module.exports = AddPluginsCommand
