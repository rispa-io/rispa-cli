const path = require('path')
const fs = require('fs-extra')
const { removeRemote } = require('../utils/git')
const { improveTask } = require('../utils/tasks')

const createRemovePlugin = name => improveTask({
  title: `Remove plugin with name '${name}'`,
  before: ctx => {
    if (!ctx.configuration) {
      throw new Error('Can\'t find project configuration')
    }

    if (!ctx.removedPlugins) {
      ctx.removedPlugins = []
    }
  },
  task: ctx => {
    const { projectPath } = ctx
    const pluginsPath = path.resolve(projectPath, ctx.configuration.pluginsPath)
    const mode = ctx.mode || ctx.configuration.mode
    const pluginPath = path.resolve(pluginsPath, `./${name}`)

    fs.removeSync(pluginPath)

    if (mode !== 'dev') {
      removeRemote(projectPath, name)
    }

    ctx.removedPlugins.push(name)
    ctx.configuration.plugins.splice(ctx.configuration.plugins.indexOf(name), 1)
    delete ctx.configuration.remotes[name]
  },
})

module.exports = createRemovePlugin
