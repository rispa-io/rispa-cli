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
const { getPluginName } = require('../utils/plugin')

const updatePluginSubtree = (projectPath, pluginsPath, plugin) => {
  const pluginsRelPath = path.relative(projectPath, pluginsPath)
  const prefix = `${pluginsRelPath}/${plugin.name}`

  if (!gitUpdateSubtree(projectPath, prefix, plugin.name, plugin.remote)) {
    throw new Error(`Failed update subtree '${plugin.remote}'`)
  }
}

const createUpdatePlugin = plugin => improveTask({
  title: `Update plugin with name ${chalk.cyan(getPluginName(plugin))}`,
  task: ctx => {
    const { projectPath, configuration } = ctx
    const pluginsPath = path.resolve(projectPath, configuration.pluginsPath)
    const pluginPath = path.resolve(pluginsPath, `./${plugin.name}`)

    if (checkMode(ctx, DEV_MODE, TEST_MODE)) {
      if (!fs.existsSync(path.resolve(pluginPath, './.git'))) {
        throw new Error('Not a git repository: .git')
      }

      if (checkMode(ctx, TEST_MODE)) {
        gitClean(pluginPath)
      }

      gitPull(pluginPath)
    } else {
      updatePluginSubtree(projectPath, pluginsPath, plugin)
    }

    ctx.updatedPlugins.push(plugin.name)
  },
})

module.exports = createUpdatePlugin
