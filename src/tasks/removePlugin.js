const path = require('path')
const fs = require('fs-extra')
const { removeRemote } = require('../utils/git')

const createRemovePlugin = name => ({
  title: `Remove plugin with name '${name}'`,
  task: ctx => {
    if (!ctx.configuration) {
      throw new Error('Can\'t find project configuration')
    }

    const { projectPath } = ctx
    const pluginsPath = path.resolve(projectPath, ctx.configuration.pluginsPath)
    const mode = ctx.mode || ctx.configuration.mode
    const pluginPath = path.resolve(pluginsPath, `./${name}`)

    fs.removeSync(pluginPath)

    if (mode !== 'dev') {
      removeRemote(projectPath, name)
    }

    ctx.configuration.plugins.splice(ctx.configuration.plugins.indexOf(name), 1)
    delete ctx.configuration.remotes[name]
  },
})

module.exports = createRemovePlugin
