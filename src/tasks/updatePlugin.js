const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')
const { pullRepository, updateSubtree } = require('../utils/git')
const { improveTask } = require('../utils/tasks')
const { DEV_MODE } = require('../constants')

const updatePluginRepository = pluginPath => {
  if (!fs.existsSync(path.resolve(pluginPath, './.git'))) {
    throw new Error('Not a git repository: .git')
  }

  pullRepository(pluginPath)
}

const updatePluginSubtree = (remotes, projectPath, pluginsPath, pluginName) => {
  const remoteUrl = remotes[pluginName]
  const pluginsRelPath = path.relative(projectPath, pluginsPath)
  const prefix = `${pluginsRelPath}/${pluginName}`

  if (!updateSubtree(projectPath, prefix, pluginName, remoteUrl)) {
    throw new Error(`Failed update subtree '${remoteUrl}'`)
  }
}

const createUpdatePlugin = name => improveTask({
  title: `Update plugin with name ${chalk.cyan(name)}`,
  before: ctx => {
    if (!ctx.updatedPlugins) {
      ctx.updatedPlugins = []
    }
  },
  task: ctx => {
    const { projectPath, configuration } = ctx
    const pluginsPath = path.resolve(projectPath, configuration.pluginsPath)
    const mode = ctx.mode || configuration.mode
    const pluginPath = path.resolve(pluginsPath, `./${name}`)

    if (mode === DEV_MODE) {
      updatePluginRepository(pluginPath)
    } else {
      updatePluginSubtree(configuration.remotes, projectPath, pluginsPath, name)
    }

    ctx.updatedPlugins.push(name)
  },
})

module.exports = createUpdatePlugin
