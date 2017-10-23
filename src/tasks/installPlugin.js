const path = require('path')
const { cyan } = require('chalk')
const { improveTask, checkMode } = require('../utils/tasks')
const {
  addSubtree: gitAddSubtree,
  cloneRepository: gitCloneRepository,
} = require('../utils/git')
const {
  getPluginName,
  equalPluginName,
  addDevDependency,
} = require('../utils/plugin')
const { DEV_MODE, TEST_MODE } = require('../constants')

const checkCloneUrl = cloneUrl => {
  if (!cloneUrl.endsWith('.git')) {
    throw new Error(`Invalid plugin remote url ${cyan(cloneUrl)}`)
  }
}

const configurationContainsPlugin = (configuration, plugin) => (
  configuration.plugins.some(searchPlugin =>
    equalPluginName(searchPlugin.name, plugin)
  )
)

const createInstallPlugin = plugin => improveTask({
  title: `Install plugin with name ${cyan(getPluginName(plugin))}`,
  skip: ({ configuration }) => (
    configurationContainsPlugin(configuration, plugin) && 'Plugin already installed'
  ),
  before: ctx => {
    if (!ctx.installedPlugins) {
      ctx.installedPlugins = []
    }
  },
  task: ctx => {
    const { projectPath } = ctx
    const { remote, name, packageName, packageVersion, ref, extendable } = plugin

    if (!remote) {
      throw new Error('Plugin without remote url')
    }

    const pluginsPath = ctx.pluginsPath || path.resolve(projectPath, ctx.configuration.pluginsPath)
    const pluginInfo = {
      name,
      ref,
      remote,
    }

    checkCloneUrl(remote)

    if (checkMode(ctx, DEV_MODE)) {
      gitCloneRepository(pluginsPath, remote)
    } else if (checkMode(ctx, TEST_MODE)) {
      gitCloneRepository(pluginsPath, remote, { depth: 1 })
    } else if (packageName && packageVersion) {
      addDevDependency(projectPath, packageName, packageVersion)

      pluginInfo.name = packageName
      pluginInfo.dependency = true
      delete pluginInfo.remote
    } else {
      if (extendable) {
        pluginInfo.extendable = true
      }

      const pluginsRelPath = path.relative(projectPath, pluginsPath)
      const prefix = `${pluginsRelPath}/${name}`
      gitAddSubtree(projectPath, prefix, name, remote, ref)
    }

    ctx.pluginsPath = pluginsPath
    ctx.installedPlugins.push(pluginInfo.name)

    ctx.configuration.plugins.push(pluginInfo)
  },
})

module.exports = createInstallPlugin
