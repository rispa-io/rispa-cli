const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')
const { removeRemote } = require('../utils/git')
const { improveTask, checkMode } = require('../utils/tasks')
const { DEV_MODE } = require('../constants')

const createRemovePlugin = name => improveTask({
  title: `Remove plugin with name ${chalk.cyan(name)}`,
  skip: ({ configuration: { plugins } }) => plugins.indexOf(name) === -1 && 'Can\'t find plugin',
  before: ctx => {
    if (!ctx.removedPlugins) {
      ctx.removedPlugins = []
    }
  },
  task: ctx => {
    const { projectPath } = ctx
    const pluginsPath = path.resolve(projectPath, ctx.configuration.pluginsPath)
    const pluginPath = path.resolve(pluginsPath, `./${name}`)

    fs.removeSync(pluginPath)

    if (!checkMode(ctx, DEV_MODE)) {
      removeRemote(projectPath, name)
    }

    ctx.removedPlugins.push(name)
    ctx.configuration.plugins.splice(ctx.configuration.plugins.indexOf(name), 1)
    delete ctx.configuration.remotes[name]
  },
})

module.exports = createRemovePlugin
