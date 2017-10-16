const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')
const { removeRemote } = require('../utils/git')
const { improveTask, checkMode } = require('../utils/tasks')
const { DEV_MODE } = require('../constants')
const { getPluginName } = require('../utils/plugin')

const createRemovePlugin = plugin => improveTask({
  title: `Remove plugin with name ${chalk.cyan(getPluginName(plugin))}`,
  before: ctx => {
    if (!ctx.removedPlugins) {
      ctx.removedPlugins = []
    }
  },
  task: ctx => {
    const { projectPath } = ctx
    const pluginsPath = path.resolve(projectPath, ctx.configuration.pluginsPath)
    const pluginPath = path.resolve(pluginsPath, `./${plugin.name}`)

    fs.removeSync(pluginPath)

    if (!checkMode(ctx, DEV_MODE)) {
      removeRemote(projectPath, plugin.name)
    }

    ctx.configuration.plugins = ctx.configuration.plugins.filter(({ name }) => name !== plugin.name)
    ctx.removedPlugins.push(plugin.name)
  },
})

module.exports = createRemovePlugin
