const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')
const {
  pullRepository: gitPull,
  updateSubtree: gitUpdateSubtree,
  clean: gitClean,
} = require('../utils/git')
const { improveTask, checkMode } = require('../utils/tasks')
const { DEV_MODE, TEST_MODE } = require('../constants')

const updatePluginSubtree = (remotes, projectPath, pluginsPath, pluginName) => {
  const remoteUrl = remotes[pluginName]
  const pluginsRelPath = path.relative(projectPath, pluginsPath)
  const prefix = `${pluginsRelPath}/${pluginName}`

  if (!gitUpdateSubtree(projectPath, prefix, pluginName, remoteUrl)) {
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
    const pluginPath = path.resolve(pluginsPath, `./${name}`)

    if (checkMode(ctx, DEV_MODE, TEST_MODE)) {
      if (!fs.existsSync(path.resolve(pluginPath, './.git'))) {
        throw new Error('Not a git repository: .git')
      }

      if (checkMode(ctx, TEST_MODE)) {
        gitClean(pluginPath)
      }

      gitPull(pluginPath)
    } else {
      updatePluginSubtree(configuration.remotes, projectPath, pluginsPath, name)
    }

    ctx.updatedPlugins.push(name)
  },
})

module.exports = createUpdatePlugin
