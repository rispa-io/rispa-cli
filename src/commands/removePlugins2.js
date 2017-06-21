const Listr = require('listr')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const saveProjectConfiguration = require('../tasks/saveProjectConfiguration')
const cleanCache = require('../tasks/cleanCache')
const createRemovePlugin = require('../tasks/removePlugin')
const selectPlugins = require('../tasks/selectPlugins')

class RemovePluginsCommand extends Command {
  constructor([...pluginsToRemove]) {
    super({})

    this.state = {
      pluginsToRemove,
    }

    this.removePlugins = this.removePlugins.bind(this)
  }

  removePlugins(ctx) {
    const { pluginsToRemove } = this.state
    const { configuration: { plugins } } = ctx

    const invalidPlugins = pluginsToRemove.filter(plugin => plugins.indexOf(plugin) === -1)
    if (invalidPlugins.length) {
      throw new Error(`Can't find plugins with names:\n - ${invalidPlugins.join(', ')}`)
    }

    return new Listr(
      pluginsToRemove.map(plugin =>
        createRemovePlugin(plugin)
      ), { exitOnError: false }
    )
  }

  init() {
    const { pluginsToRemove } = this.state
    this.add([
      readProjectConfiguration,
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
      cleanCache,
    ])
  }
}

RemovePluginsCommand.commandName = 'remove'
RemovePluginsCommand.commandDescription = 'Remove plugins'

module.exports = RemovePluginsCommand
