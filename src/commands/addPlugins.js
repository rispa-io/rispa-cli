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
const { extendsTask, skipMode } = require('../utils/tasks')
const { DEV_MODE, TEST_MODE } = require('../constants')
const { commit: gitCommit } = require('../utils/git')
const { findInList: findPluginInList } = require('../utils/plugin')

const skipNotProdMode = skipMode(DEV_MODE, TEST_MODE)

const skipTestMode = skipMode(TEST_MODE)

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

    return new Listr(
      pluginsToInstall.map(({ name, cloneUrl }) =>
        createInstallPlugin(name, cloneUrl)
      ), { exitOnError: false }
    )
  }

  init() {
    const { pluginsToInstall } = this.state
    this.add([
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
        skip: ctx => (
          ((!ctx.installedPlugins || !ctx.installedPlugins.length) && 'Plugins not added') || skipNotProdMode(ctx)
        ),
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
