const Listr = require('listr')
const fs = require('fs-extra')
const createInstallPlugin = require('../tasks/installPlugin')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const saveProjectConfiguration = require('../tasks/saveProjectConfiguration')
const gitCheckChanges = require('../tasks/gitCheckChange')
const selectPlugins = require('../tasks/selectPlugins')
const fetchPlugins = require('../tasks/fetchPlugins')
const bootstrapProjectDeps = require('../tasks/bootstrapProjectDeps')
const cleanCache = require('../tasks/cleanCache')

const extractPluginNameFromUrl = cloneUrl => {
  const parts = cloneUrl.split('/')
  return parts[parts.length - 1].replace(/\.git$/, '')
}

const findPlugin = (plugins, plugin) => {
  if (plugin.startsWith('git:')) {
    return {
      name: extractPluginNameFromUrl(plugin),
      cloneUrl: plugin,
    }
  }

  const currentPlugin = plugins.find(({ name }) => name === plugin)
  return currentPlugin || { name: plugin }
}

class AddPluginsCommand extends Command {
  constructor([...pluginsToInstall]) {
    super({})

    this.state = {
      pluginsToInstall,
    }

    this.installPlugins = this.installPlugins.bind(this)
  }

  installPlugins(ctx) {
    const { plugins, configuration: { pluginsPath } } = ctx

    fs.ensureDirSync(pluginsPath)

    const pluginsToInstall = this.state.pluginsToInstall.map(plugin =>
      typeof plugin === 'object' ? plugin : findPlugin(plugins, plugin)
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
      readProjectConfiguration,
      Object.assign({}, gitCheckChanges, {
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
      bootstrapProjectDeps,
      saveProjectConfiguration,
      cleanCache,
    ])
  }
}

AddPluginsCommand.commandName = 'add'
AddPluginsCommand.commandDescription = 'Add plugins'

module.exports = AddPluginsCommand