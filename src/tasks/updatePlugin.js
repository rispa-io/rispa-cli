const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')
const { pullRepository, updateSubtree } = require('../utils/git')
const { improveTask } = require('../utils/tasks')

const updatePluginRepository = pluginPath => {
  if (!fs.existsSync(path.resolve(pluginPath, './.git'))) {
    throw new Error('Can\'t find `.git`')
  }

  pullRepository(pluginPath)
}

const updatePluginSubtree = (remotes, projectPath, pluginsPath, pluginName) => {
  const remoteUrl = remotes[pluginName]
  const pluginsRelPath = path.relative(projectPath, pluginsPath)
  const prefix = `${pluginsRelPath}/${pluginName}`

  updateSubtree(projectPath, prefix, pluginName, remoteUrl)
}

const createUpdatePlugin = name => improveTask({
  title: `Update plugin with name ${chalk.cyan(name)}`,
  before: ctx => {
    if (!ctx.configuration) {
      throw new Error('Can\'t find project configuration')
    }

    if (!ctx.updatedPlugins) {
      ctx.updatedPlugins = []
    }
  },
  task: ctx => {
    const { projectPath } = ctx
    const pluginsPath = path.resolve(projectPath, ctx.configuration.pluginsPath)
    const mode = ctx.mode || ctx.configuration.mode
    const pluginPath = path.resolve(pluginsPath, `./${name}`)

    if (mode === 'dev') {
      updatePluginRepository(pluginPath)
    } else {
      updatePluginSubtree(ctx.configuration.remotes, projectPath, pluginsPath, name)
    }

    ctx.updatedPlugins.push(name)
  },
})

module.exports = createUpdatePlugin
